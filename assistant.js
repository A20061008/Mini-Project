const chatHistory = [];
let reportDraftActive = false;
let assistantToolsInitialized = false;

const ASSISTANT_CATEGORIES = [
  { types: ['naturalDisaster'], terms: ['natural disaster', 'natural disasters', 'earthquake', 'cyclone', 'landslide', 'tsunami'] },
  { types: ['flood'], terms: ['flood', 'floods', 'flooding', 'waterlogging', 'water logging'] },
  { types: ['fire'], terms: ['fire', 'fires', 'wildfire', 'wildfires', 'blaze'] },
  { types: ['roadAccident'], terms: ['road accident', 'traffic accident', 'car crash', 'vehicle crash', 'collision', 'bus accident'] },
  { types: ['crime'], terms: ['crime', 'crimes', 'criminal', 'robbery', 'robberies', 'theft', 'assault', 'missing person', 'missing children'] },
  { types: ['infrastructure'], terms: ['infrastructure', 'bridge', 'pipeline', 'water supply', 'water pipeline', 'power outage'] },
  { types: ['pollution'], terms: ['pollution', 'air quality', 'smog', 'contamination', 'water pollution'] },
  { types: ['medical'], terms: ['medical', 'health emergency', 'food poisoning', 'outbreak'] },
  { types: ['other'], terms: ['other issue', 'other issues'] }
];

const ASSISTANT_PRECAUTIONS = {
  naturalDisaster: {
    response: 'Follow official alerts and evacuation instructions, move to the designated safe area, and contact emergency services if anyone is in immediate danger.',
    prevention: 'Keep an emergency kit and family contact plan, know evacuation routes, and follow local preparedness and building-safety guidance.'
  },
  flood: {
    response: 'Move away from rising water, follow evacuation notices, and never walk or drive through floodwater. Contact emergency services if trapped or in danger.',
    prevention: 'Keep drains clear where safe, heed flood warnings, plan evacuation routes, and protect important supplies above expected flood levels.'
  },
  fire: {
    response: 'Evacuate using a safe exit, alert others only if it is safe, and call emergency services. Do not re-enter until authorities say it is safe.',
    prevention: 'Maintain alarms and electrical equipment, store flammables safely, keep exits clear, and practice an evacuation plan.'
  },
  roadAccident: {
    response: 'Keep yourself out of traffic, call emergency services, and share the location. Do not move seriously injured people unless there is immediate danger.',
    prevention: 'Use seat belts or helmets, avoid impaired or distracted driving, follow speed limits, and maintain vehicles and roads.'
  },
  crime: {
    response: 'Prioritize personal safety, move to a secure place, and contact local emergency services or police. Do not confront or pursue suspects.',
    prevention: 'Use secure access and lighting, report hazards to appropriate authorities, and follow community safety guidance; do not use vigilante measures.'
  },
  infrastructure: {
    response: 'Keep clear of unstable structures, damaged roads, exposed wiring, or leaking utilities. Warn others if safe and notify the responsible authority or utility.',
    prevention: 'Use qualified inspections and timely maintenance, follow safety codes, and report visible damage early.'
  },
  pollution: {
    response: 'Reduce exposure, move away from visible fumes or spills when safe, and follow public-health or environmental-authority advisories.',
    prevention: 'Use proper waste handling and treatment, maintain emission controls, and report suspected releases to the responsible authority.'
  },
  medical: {
    response: 'Seek prompt professional medical care. For an emergency in India call 112; elsewhere use the local emergency number. Do not rely on chatbot advice for diagnosis.',
    prevention: 'Follow clinician guidance, maintain routine hygiene and vaccinations, and use safe food and water practices.'
  },
  other: {
    response: 'Move away from immediate hazards, document the issue only if safe, and contact the relevant local authority or emergency service.',
    prevention: 'Use the safety guidance appropriate to the hazard, maintain equipment and surroundings, and report concerns early.'
  }
};

function toggleChat() {
  const panel = document.getElementById('wwChatPanel');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) {
    initAssistantTools();
    document.getElementById('wwChatInput').focus();
  }
}

function addAssistantField(form, labelText, id, control) {
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = labelText;
  control.id = id;
  form.append(label, control);
  return control;
}

function initAssistantTools() {
  if (assistantToolsInitialized) return;
  const panel = document.getElementById('wwChatPanel');
  const composer = panel && panel.querySelector('.ww-chat-form');
  if (!composer || typeof TYPE_ORDER === 'undefined') return;

  const tools = document.createElement('div');
  tools.className = 'ww-chat-tools';

  const reportSection = document.createElement('details');
  reportSection.className = 'ww-chat-tool';
  const reportSummary = document.createElement('summary');
  reportSummary.textContent = 'Generate an issue report';
  const reportForm = document.createElement('form');
  reportForm.className = 'ww-chat-tool-form';
  reportForm.addEventListener('submit', generateAssistantReportDraft);

  const reportType = addAssistantField(reportForm, 'Issue category', 'wwChatReportType', document.createElement('select'));
  const emptyType = document.createElement('option');
  emptyType.value = '';
  emptyType.textContent = 'Choose a category';
  reportType.appendChild(emptyType);
  TYPE_ORDER.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = `${MapUtils.getTypeIcon(type)} ${i18n.t(type)}`;
    reportType.appendChild(option);
  });
  reportType.required = true;

  const title = addAssistantField(reportForm, 'Short title', 'wwChatReportTitle', document.createElement('input'));
  title.maxLength = 120;
  title.required = true;
  const description = addAssistantField(reportForm, 'What happened?', 'wwChatReportDescription', document.createElement('textarea'));
  description.maxLength = 1000;
  description.rows = 3;
  description.required = true;
  const location = addAssistantField(reportForm, 'Location (city or area)', 'wwChatReportLocation', document.createElement('input'));
  location.maxLength = 200;
  location.required = true;
  const severity = addAssistantField(reportForm, 'Severity', 'wwChatReportSeverity', document.createElement('select'));
  [1, 2, 3, 4, 5].forEach(value => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = `${value} / 5`;
    severity.appendChild(option);
  });
  severity.value = '3';
  const generate = document.createElement('button');
  generate.type = 'submit';
  generate.className = 'ww-chat-tool-button';
  generate.textContent = 'Prepare draft';
  reportForm.appendChild(generate);
  reportSection.append(reportSummary, reportForm);

  const preventionSection = document.createElement('details');
  preventionSection.className = 'ww-chat-tool';
  const preventionSummary = document.createElement('summary');
  preventionSummary.textContent = 'Prevention & precautions';
  const preventionForm = document.createElement('div');
  preventionForm.className = 'ww-chat-tool-form';
  const preventionType = addAssistantField(preventionForm, 'Issue category', 'wwChatPreventionType', document.createElement('select'));
  const chooseType = document.createElement('option');
  chooseType.value = '';
  chooseType.textContent = 'Choose a category';
  preventionType.appendChild(chooseType);
  TYPE_ORDER.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = `${MapUtils.getTypeIcon(type)} ${i18n.t(type)}`;
    preventionType.appendChild(option);
  });
  const guidance = document.createElement('div');
  guidance.className = 'ww-chat-tool-guidance';
  guidance.id = 'wwChatPreventionGuidance';
  guidance.textContent = 'Choose a category for practical response guidance and prevention precautions.';
  preventionType.addEventListener('change', () => renderAssistantPrecautions(preventionType.value, guidance));
  preventionForm.append(preventionType, guidance);
  preventionSection.append(preventionSummary, preventionForm);

  tools.append(reportSection, preventionSection);
  composer.before(tools);
  assistantToolsInitialized = true;
}

function renderAssistantPrecautions(type, target) {
  const guidance = ASSISTANT_PRECAUTIONS[type];
  if (!guidance || !target) return;
  target.textContent = `${i18n.t(type)}\n\nResponse: ${guidance.response}\n\nPrevention: ${guidance.prevention}\n\nGeneral safety guidance only. Follow instructions from local authorities and qualified professionals.`;
}

function generateAssistantReportDraft(event) {
  event.preventDefault();
  const draft = {
    type: document.getElementById('wwChatReportType').value,
    title: document.getElementById('wwChatReportTitle').value.trim(),
    description: document.getElementById('wwChatReportDescription').value.trim(),
    location: document.getElementById('wwChatReportLocation').value.trim(),
    severity: Number(document.getElementById('wwChatReportSeverity').value)
  };
  if (!draft.type || !draft.title || !draft.description || !draft.location) {
    chatMessage('Choose a category and provide a title, description, and location to prepare the report draft.', 'bot');
    return;
  }
  const bubble = chatMessage(
    `Draft prepared (not submitted): ${draft.title}\nCategory: ${i18n.t(draft.type)} · Severity: ${draft.severity}/5\nLocation: ${draft.location}\n${draft.description}`,
    'bot'
  );
  appendReportDraftButton(bubble, draft);
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

function assistantMatchedTypes(question) {
  const normalized = String(question || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const types = new Set();
  ASSISTANT_CATEGORIES.forEach(category => {
    if (category.terms.some(term => normalized.includes(term))) category.types.forEach(type => types.add(type));
  });
  if (/\bwater\b/.test(normalized)) {
    types.add('flood');
    types.add('infrastructure');
  }
  return types;
}

function findAssistantIssueContext(question) {
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
  const statusQuestion = normalize(question);
  const matchedTypes = assistantMatchedTypes(statusQuestion);
  const hasIssueReference = /\b(?:ISS[-\s]?\d+|issues?|reports?|incidents?|cases?|under verification|verified|resolved)\b/i.test(question);
  if (!hasIssueReference && !matchedTypes.size) return [];
  const stopWords = new Set(['all', 'an', 'and', 'are', 'details', 'did', 'do', 'does', 'for', 'from', 'give', 'has', 'have', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'show', 'tell', 'the', 'this', 'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'with', 'about', 'issue', 'issues', 'report', 'reports', 'incident', 'incidents', 'case', 'cases', 'status', 'current', 'latest']);
  const terms = statusQuestion.split(/\s+/).filter(term => term.length > 2 && !stopWords.has(term));
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
  let ranked = all
    .filter(issue => !matchedTypes.size || matchedTypes.has(issue.type))
    .map(issue => ({ issue, score: scoreIssue(issue) + (matchedTypes.has(issue.type) ? 100 : 0) }))
    .filter(item => item.score > 0 || matchedTypes.size > 0);
  if (!ranked.length && /\b(?:all|every|each|list|remaining)\b/.test(statusQuestion)) {
    ranked = all.map(issue => ({ issue, score: 0 }));
  }
  ranked.sort((a, b) => b.score - a.score || String(b.issue.date || '').localeCompare(String(a.issue.date || '')));
  return ranked.slice(0, 20).map(item => assistantIssueRecord(item.issue));
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
    resolutionMsg: String(issue.resolutionMsg || ''),
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
  button.textContent = 'Use draft in Report Issue';
  button.addEventListener('click', () => useAssistantReportDraft(draft));
  bubble.appendChild(document.createElement('br'));
  bubble.appendChild(button);
}

function useAssistantReportDraft(draft) {
  const session = AUTH.getSession();
  if (!session || session.guest || !document.getElementById('issueType')) {
    chatMessage('The draft is shown above and has not been submitted. Sign in as a user to copy it into Report Issue.', 'bot');
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

function localAssistantAnswer(question) {
  const query = question.toLowerCase();
  const matchedTypes = [...assistantMatchedTypes(question)];
  const requestedAdvice = /\b(?:solution\w*|resolv\w*|fix\w*|prevent\w*|precaution\w*|safety|safe)\b/i.test(question);

  if (/\b(?:what does|what is|tell me about|features of)\b.{0,50}\b(?:this app|the app|worldwatch|website|application)\b/i.test(question)
      || /\b(?:features|capabilities)\b.{0,30}\b(?:app|website|worldwatch|application)\b/i.test(question)) {
    return 'WorldWatch lets people report civic issues with a category, description, severity, location, and optional evidence. Users can browse reports on the map, follow progress in My Reports, and explore Analytics and the News Feed. Administrators can review reports, assign departments, verify or reject them, and add resolution details.';
  }
  if (isReportDraftRequest(question)) {
    return 'Use the “Generate an issue report” section above. Enter the category, title, what happened, and city or area, then prepare a draft. It will not be submitted automatically.';
  }
  if (/\b(?:how|where|steps?)\b.{0,50}\b(?:report|submit|file)\b/i.test(question)) {
    return 'To report an issue, open the Report Issue tab, choose a category, enter a title and description, set severity, and provide a location on the map or with GPS. Evidence is optional. Review the details and submit; reports are not automatically sent to authorities.';
  }

  const records = findAssistantIssueContext(question);
  if (records.length) {
    const reportList = records.map(issue =>
      `• ${issue.id}: ${issue.title} — ${issue.location || 'location not listed'} (${issue.status})`
    ).join('\n');
    let answer = `Matching local reports:\n${reportList}`;
    if (requestedAdvice) {
      const adviceTypes = [...new Set(records.map(issue => issue.type))];
      answer += '\n\nGeneral response and prevention guidance:\n' + adviceTypes.map(type => {
        const guidance = ASSISTANT_PRECAUTIONS[type];
        return `${i18n.t(type)}\nResponse: ${guidance.response}\nPrevention: ${guidance.prevention}`;
      }).join('\n\n');
    }
    return answer;
  }

  if (/\b(?:all|every|each|list|remaining)\b.{0,30}\b(?:issues?|reports?|incidents?|cases?)\b/i.test(question)) {
    const allReports = DATA.getAll()
      .slice()
      .sort((left, right) => String(right.date || '').localeCompare(String(left.date || '')))
      .slice(0, 20)
      .map(assistantIssueRecord);
    if (!allReports.length) return 'There are no locally available issue reports to list.';
    return `Local issue reports:\n${allReports.map(issue =>
      `• ${issue.id}: ${issue.title} — ${issue.location || 'location not listed'} (${issue.status})`
    ).join('\n')}`;
  }

  if (matchedTypes.length && requestedAdvice) {
    return matchedTypes.map(type => {
      const guidance = ASSISTANT_PRECAUTIONS[type];
      return `${i18n.t(type)}\nResponse: ${guidance.response}\nPrevention: ${guidance.prevention}`;
    }).join('\n\n');
  }
  if (/\b(?:demo|credentials|password|log in|login|sign in)\b/i.test(query)) {
    return 'Demo sign-in: user@world.com / user123. Admin demo: admin@world.com / admin123. These are demo credentials; do not reuse them for real accounts.';
  }
  if (/\b(?:map|marker|filter|location)\b/i.test(query)) {
    return 'Open Map View to browse reported issues. Use the category filters to narrow the map, select a circle or marker for report details, and use the search box to find an issue by title or location.';
  }
  if (/\b(?:admin|administrator|verify|verification|resolve|department)\b/i.test(query)) {
    return 'Admins can review reported issues, assign departments, verify or reject reports, and add resolution details. These actions update the issue status; reports are not automatically dispatched to authorities.';
  }
  if (/\b(?:analytics|chart|statistics|feed|news)\b/i.test(query)) {
    return 'The dashboard includes Analytics for issue counts, categories, statuses, severity, and trends, plus a News Feed of reported issues. Open those sections from the sidebar.';
  }
  if (/\b(?:prevent|prevention|precaution|safety)\b/i.test(query)) {
    return 'Choose an issue category in the “Prevention & precautions” section above for immediate response guidance and ways to reduce future risk.';
  }
  if (/\b(?:assistant|chatbot|AI|artificial intelligence)\b/i.test(query)) {
    return 'Local WorldWatch help is available for app questions, report lookups, report drafts, and category-based safety guidance. Open-ended AI answers need the app server and a configured AI provider. The report and prevention sections above work without one.';
  }
  if (/\b(?:report|issue|incident|draft)\b/i.test(query)) {
    return 'Use the “Generate an issue report” section above to prepare a draft. Reports need a category, title, description, and city or area; review and submit them from Report Issue. Drafts are never submitted automatically.';
  }
  return 'I can answer questions about WorldWatch reports, app features, map and dashboard use, report drafts, and category-based precautions. This question needs the online AI service, which is not available right now. Try asking about a WorldWatch feature or choose one of the report and prevention sections.';
}

function useLocalAssistantFallback(bubble, question, reason) {
  reportDraftActive = false;
  const answer = localAssistantAnswer(question);
  bubble.textContent = answer;
  bubble.dataset.mode = 'local';
  if (reason) bubble.title = 'Answered using built-in WorldWatch help because the AI service is unavailable.';
  chatHistory.push({ role: 'assistant', content: answer });
  if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
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
  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory.slice(-12), task, issueContext }),
      signal: controller.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404) {
        useLocalAssistantFallback(answerBubble, question, 'This server does not provide the chat API, so I switched to local help.');
        return;
      }
      if (response.status >= 500) {
        useLocalAssistantFallback(answerBubble, question, result.error || 'The AI service is unavailable, so I switched to local help.');
        return;
      }
      throw new Error(result.error || 'The chat request was rejected. Please check your question and try again.');
    }
    if (typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('The AI service returned an empty answer. Please try again.');
    const answer = result.answer.trim();
    answerBubble.textContent = answer;
    if (result.reportDraft) appendReportDraftButton(answerBubble, result.reportDraft);
    chatHistory.push({ role: 'assistant', content: answer });
    if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
  } catch (error) {
    if (error.name === 'AbortError') {
      useLocalAssistantFallback(answerBubble, question, 'The AI service timed out, so I switched to local help.');
    } else if (error.name === 'TypeError') {
      useLocalAssistantFallback(answerBubble, question, 'The chat API could not be reached, so I switched to local help.');
    } else {
      answerBubble.textContent = error.message || 'The chat service returned an unexpected error.';
    }
  } finally {
    clearTimeout(requestTimeout);
    form.removeAttribute('aria-busy');
    input.disabled = false;
    submit.disabled = false;
    input.focus();
  }
}
