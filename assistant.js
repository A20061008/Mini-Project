const chatHistory = [];
let reportDraftActive = false;

function toggleChat() {
  const panel = document.getElementById('wwChatPanel');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) document.getElementById('wwChatInput').focus();
}

function chatMessage(text, who) {
  const box = document.getElementById('wwChatMessages');
  const element = document.createElement('div');
  element.className = 'ww-chat-bubble ' + (who === 'user' ? 'user' : '');
  element.textContent = text;
  box.appendChild(element);
  box.scrollTop = box.scrollHeight;
  return element;
}

function isReportDraftRequest(text) {
  if (/\bhow\b[\s\S]{0,40}\breport\b/i.test(text)) return false;
  return /\b(?:start|generate|create|draft|prepare|write)\b[\s\S]{0,40}\b(?:report|issue|incident)\b/i.test(text)
    || /\b(?:i want|i need|please)\s+(?:to\s+)?(?:report|file|create|draft)\b/i.test(text)
    || /^\s*(?:report|file)\s+(?:this|an?|the)?\s*[\w-]+/i.test(text);
}

function findAssistantIssueContext(question) {
  if (!/\b(?:ISS[-\s]?\d+|issues?|reports?|incidents?|cases?|under verification|verified|resolved)\b/i.test(question)) return [];
  const all = DATA.getAll();
  const idMatch = question.match(/\bISS[-\s]?\d+\b/i);
  const numberMatch = question.match(/\bissue\s+#?(\d+)\b/i);
  if (idMatch) {
    const wanted = idMatch[0].replace(/[^a-z0-9]/gi, '').toUpperCase();
    const found = all.find(issue => String(issue.id).toUpperCase() === wanted);
    return found ? [assistantIssueRecord(found)] : [];
  }
  if (numberMatch) {
    const wanted = Number(numberMatch[1]);
    const found = all.find(issue => Number(String(issue.id).replace(/\D/g, '')) === wanted);
    if (found) return [assistantIssueRecord(found)];
  }
  const normalize = value => String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const stopWords = new Set(['all', 'an', 'and', 'are', 'details', 'did', 'do', 'does', 'for', 'from', 'give', 'has', 'have', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'show', 'tell', 'the', 'this', 'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'with', 'about', 'issue', 'issues', 'report', 'reports', 'incident', 'incidents', 'case', 'cases', 'status', 'current', 'latest']);
  const terms = normalize(question).split(/\s+/).filter(term => term.length > 2 && !stopWords.has(term));
  const statusQuestion = normalize(question);
  const scoreIssue = issue => {
    const fields = [
      [normalize(issue.id), 6],
      [normalize(issue.title), 5],
      [normalize(issue.location), 4],
      [normalize(issue.type + ' ' + i18n.t(issue.type)), 4],
      [normalize(issue.department), 2],
      [normalize(issue.description), 1],
      [normalize(issue.status === 'reviewing' ? 'under verification' : issue.status), 3]
    ];
    let score = 0;
    terms.forEach(term => {
      const weights = fields.filter(([value]) => value.includes(term)).map(([, weight]) => weight);
      if (weights.length) score += Math.max(...weights);
    });
    if (/\b(?:under verification|reviewing|pending)\b/.test(statusQuestion) && issue.status === 'reviewing') score += 5;
    if (/\bverified\b/.test(statusQuestion) && issue.status === 'verified') score += 5;
    if (/\bresolved\b/.test(statusQuestion) && issue.status === 'resolved') score += 5;
    return score;
  };
  let ranked = all.map(issue => ({ issue, score: scoreIssue(issue) })).filter(item => item.score > 0);
  if (!ranked.length && /\b(?:all|every|list)\b/.test(statusQuestion)) {
    ranked = all.map(issue => ({ issue, score: 0 }));
  }
  ranked.sort((a, b) => b.score - a.score || String(b.issue.date || '').localeCompare(String(a.issue.date || '')));
  return ranked.slice(0, 8).map(item => assistantIssueRecord(item.issue));
}

function assistantIssueRecord(issue) {
  const statuses = { reviewing: 'Under Verification', verified: 'Verified', fake: 'Fake/Rejected', resolved: 'Resolved' };
  return {
    id: String(issue.id || ''),
    title: String(issue.title || ''),
    type: String(issue.type || 'other'),
    description: String(issue.description || ''),
    location: String(issue.location || ''),
    department: String(issue.department || ''),
    status: statuses[issue.status] || String(issue.status || 'Unknown'),
    date: String(issue.date || ''),
    severity: Number.isInteger(issue.severity) && issue.severity >= 1 && issue.severity <= 5 ? issue.severity : 3,
    reportCount: Number.isInteger(issue.reportCount) && issue.reportCount >= 0 ? issue.reportCount : 0
  };
}

function appendReportDraftButton(bubble, draft) {
  if (!document.getElementById('issueType')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-sm btn-primary';
  button.textContent = 'Review draft in Report Issue';
  button.addEventListener('click', () => useAssistantReportDraft(draft));
  bubble.appendChild(document.createElement('br'));
  bubble.appendChild(button);
}

function useAssistantReportDraft(draft) {
  const session = AUTH.getSession();
  if (!session || session.guest || !document.getElementById('issueType')) {
    chatMessage('Please sign in as a user to use this draft in Report Issue. You can still review the draft in this chat.', 'bot');
    return;
  }
  if (!draft || !TYPE_ORDER.includes(draft.type) || !Number.isInteger(draft.severity) || draft.severity < 1 || draft.severity > 5) {
    chatMessage('This draft could not be applied safely. Please try generating it again.', 'bot');
    return;
  }
  resetReport();
  switchTab('report');
  reportDraftActive = false;
  document.getElementById('issueType').value = draft.type;
  document.getElementById('issueTitle').value = draft.title;
  document.getElementById('issueDesc').value = draft.description;
  document.getElementById('issueLocation').value = draft.location;
  const severity = document.querySelector(`input[name="severity"][value="${draft.severity}"]`);
  if (severity) severity.checked = true;
  departmentTouched = false;
  buildDepartmentOptions();
  chatMessage('Draft copied to Report Issue. Review the details, confirm the map location, add any evidence you want, then submit it yourself.', 'bot');
}

async function sendChat(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = document.getElementById('wwChatInput');
  const question = input.value.trim();
  if (!question || form.getAttribute('aria-busy') === 'true') return;
  chatMessage(question, 'user');
  input.value = '';
  if (reportDraftActive && /^(cancel|stop|never mind|forget the draft)\b/i.test(question)) {
    reportDraftActive = false;
    const answer = 'Okay, I stopped the report draft. Ask me anything else.';
    chatMessage(answer, 'bot');
    chatHistory.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
    if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
    return;
  }
  if (isReportDraftRequest(question)) reportDraftActive = true;
  const task = reportDraftActive ? 'draft_report' : 'chat';
  const issueContext = task === 'chat' ? findAssistantIssueContext(question) : [];
  chatHistory.push({ role: 'user', content: question });
  const answerBubble = chatMessage('Thinking…', 'bot');
  const submit = form.querySelector('button[type="submit"]');
  form.setAttribute('aria-busy', 'true');
  input.disabled = true;
  submit.disabled = true;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory.slice(-12), task, issueContext })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The AI service could not answer right now. Please try again.');
    if (typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('The AI service returned an empty answer. Please try again.');
    const answer = result.answer.trim();
    answerBubble.textContent = answer;
    if (result.reportDraft) appendReportDraftButton(answerBubble, result.reportDraft);
    chatHistory.push({ role: 'assistant', content: answer });
    if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
  } catch (error) {
    answerBubble.textContent = error.message || 'The AI service could not answer right now. Please try again.';
  } finally {
    form.removeAttribute('aria-busy');
    input.disabled = false;
    submit.disabled = false;
    input.focus();
  }
}
