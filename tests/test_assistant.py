import json
import unittest

from server import (
    ChatRequestError,
    normalize_issue_context,
    parse_report_draft,
    sanitize_chat_history,
    sanitize_provider_answer,
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


if __name__ == "__main__":
    unittest.main()
