import json
import unittest

from server import (
    ChatRequestError,
    _VisibleTextParser,
    build_retrieval_query,
    chunk_knowledge_document,
    format_app_knowledge,
    normalize_issue_context,
    parse_report_draft,
    retrieve_app_knowledge,
    sanitize_chat_history,
    sanitize_provider_answer,
    WorldWatchHandler,
)


class AssistantResponseTests(unittest.TestCase):
    def test_ticket_metadata_becomes_a_greeting_for_hi(self):
        answer = json.dumps({
            "ticket_metadata": {
                "domain_category": "Unclassified / Website Assistance",
                "severity_priority": "LOW (P4)",
                "extracted_summary": "hi",
                "missing_information": ["Exact location"],
                "original_report": "hi",
            }
        })

        result = sanitize_provider_answer(answer, [{"role": "user", "content": "hi"}])

        self.assertIn("How can I help", result)
        self.assertNotIn("ticket_metadata", result)

    def test_ticket_metadata_is_removed_from_conversation_history(self):
        messages = [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": '{"ticket_metadata": {}}'},
        ]

        result = sanitize_chat_history(messages)

        self.assertNotIn("ticket_metadata", result[-1]["content"])
        self.assertIn("How can I help", result[-1]["content"])

    def test_valid_report_draft_is_returned_as_fields(self):
        model_answer = json.dumps({
            "answer": "Here is your draft. Severity defaults to 3; you can change it.",
            "draft": {
                "title": "Blocked road after a fallen tree",
                "description": "A fallen tree is blocking the road.",
                "type": "infrastructure",
                "severity": 3,
                "location": "Kochi, Kerala",
            },
            "missing": [],
        })

        answer, draft = parse_report_draft(model_answer)

        self.assertIn("draft", answer)
        self.assertEqual(draft["type"], "infrastructure")
        self.assertEqual(draft["location"], "Kochi, Kerala")

    def test_incomplete_or_invalid_report_draft_is_not_ready(self):
        answer, draft = parse_report_draft(json.dumps({
            "answer": "What city is the issue in?",
            "draft": None,
            "missing": ["location"],
        }))
        self.assertIsNone(draft)
        self.assertIn("What city", answer)

        _, invalid_draft = parse_report_draft(json.dumps({
            "answer": "Draft",
            "draft": {
                "title": "Example",
                "description": "Example",
                "type": "unknown",
                "severity": 3,
                "location": "Somewhere",
            },
            "missing": [],
        }))
        self.assertIsNone(invalid_draft)

    def test_issue_context_rejects_invalid_issue_category(self):
        with self.assertRaises(ChatRequestError):
            normalize_issue_context({
                "issueContext": [{
                    "id": "ISS001",
                    "title": "Sample issue",
                    "type": "not-a-supported-type",
                    "description": "",
                    "location": "",
                    "department": "",
                    "status": "Verified",
                    "date": "2026-11-13",
                    "severity": 3,
                    "reportCount": 1,
                }]
            })

    def test_issue_context_preserves_resolution_details(self):
        context = normalize_issue_context({
            "issueContext": [{
                "id": "ISS004",
                "title": "Factory fire",
                "type": "fire",
                "description": "A fire was reported.",
                "location": "Surat",
                "department": "Fire department",
                "resolutionMsg": "Fire contained by responders.",
                "status": "Resolved",
                "date": "2026-11-14",
                "severity": 5,
                "reportCount": 4,
            }]
        })

        self.assertEqual(context[0]["resolutionMsg"], "Fire contained by responders.")

    def test_issue_context_accepts_twenty_records_and_rejects_more(self):
        record = {
            "id": "ISS001",
            "title": "Sample issue",
            "type": "fire",
            "description": "",
            "location": "",
            "department": "",
            "status": "Verified",
            "date": "2026-11-13",
            "severity": 3,
            "reportCount": 1,
        }

        self.assertEqual(len(normalize_issue_context({"issueContext": [record] * 20})), 20)
        with self.assertRaises(ChatRequestError):
            normalize_issue_context({"issueContext": [record] * 21})

    def test_application_knowledge_retrieval_ranks_relevant_documentation(self):
        chunks = chunk_knowledge_document(
            "## Reporting an issue\nUsers submit an issue from Report Issue with a category, severity, description, location, and optional evidence.\n\n"
            "## Analytics\nThe dashboard shows totals, charts, and issue trends.",
            "README.md",
        )

        passages = retrieve_app_knowledge("How do I submit a report with a location?", chunks)

        self.assertTrue(passages)
        self.assertEqual(passages[0]["section"], "Reporting an issue")
        self.assertIn("optional evidence", format_app_knowledge(passages))

    def test_application_documentation_is_added_to_provider_context(self):
        captured = {}
        handler = object.__new__(WorldWatchHandler)
        handler.call_provider = lambda body, headers: captured.update({"body": body}) or {
            "choices": [{"message": {"content": "Use the map tab to inspect issues."}}]
        }
        handler.send_json = lambda status, payload: captured.update({"status": status, "response": payload})

        handler.ask_provider(
            [{"role": "user", "content": "How does the map work?"}],
            [],
            "chat",
        )

        system_context = "\n".join(
            message["content"] for message in captured["body"]["messages"] if message["role"] == "system"
        )
        self.assertIn("Relevant WorldWatch application documentation", system_context)
        self.assertIn("Interactive Map", system_context)
        self.assertEqual(captured["status"], 200)

    def test_application_retrieval_uses_recent_user_context_for_followups(self):
        query = build_retrieval_query([
            {"role": "user", "content": "How do I use the admin dashboard to verify reports?"},
            {"role": "assistant", "content": "Admins review pending reports."},
            {"role": "user", "content": "And what about resolution?"},
        ])

        self.assertIn("admin dashboard", query)
        self.assertIn("resolution", query)

    def test_visible_page_knowledge_excludes_script_content(self):
        parser = _VisibleTextParser()
        parser.feed("<h1>Map View</h1><p>Filter and inspect issues.</p><script>secret implementation</script>")
        visible_text = " ".join(parser.parts)

        self.assertIn("Map View", visible_text)
        self.assertIn("Filter and inspect issues.", visible_text)
        self.assertNotIn("secret implementation", visible_text)


if __name__ == "__main__":
    unittest.main()
