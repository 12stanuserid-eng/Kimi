import { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, openSSE, postJson, storage, uploadForm } from './lib/api';

const backendDefault = import.meta.env.VITE_API_BASE_URL || 'https://kimibg1.onrender.com';

const NAV_ITEMS = [
  ['overview', 'Overview'],
  ['chat', 'Chat'],
  ['search', 'Search'],
  ['upload', 'Upload'],
  ['image', 'Image'],
  ['tts', 'TTS'],
  ['translate', 'Translate'],
  ['summarize', 'Summarize'],
  ['code', 'Code'],
  ['write', 'Write'],
  ['dataDoc', 'Data + Docs'],
  ['agent', 'Agent'],
  ['history', 'History + Status']
];

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

function safeParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function toMessages(prompt, history = []) {
  const messages = [...history];
  if (prompt?.trim()) {
    messages.push({ role: 'user', content: prompt.trim() });
  }
  return messages;
}

function Section({ id, title, subtitle, children, activeSection }) {
  return (
    <section id={id} className={classNames('panel section', activeSection !== id && 'hidden-section')}>
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function JsonBlock({ value }) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return <pre className="output">{text}</pre>;
}

function ResultCard({ title, data }) {
  return (
    <div className="result-card">
      <div className="result-title">{title}</div>
      <JsonBlock value={data} />
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');
  const [baseUrl, setBaseUrl] = useState(storage.getBaseUrl() || backendDefault);
  const [token, setToken] = useState(storage.getToken() || '');
  const [toast, setToast] = useState('');
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState(null);
  const [health, setHealth] = useState(null);

  const [chatModel, setChatModel] = useState('instant');
  const [chatPrompt, setChatPrompt] = useState('Hello Kimi! Give me a crisp overview of this backend.');
  const [chatSession, setChatSession] = useState('');
  const [chatTemperature, setChatTemperature] = useState('');
  const [chatMaxTokens, setChatMaxTokens] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatReply, setChatReply] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const streamStopRef = useRef(null);

  const [searchState, setSearchState] = useState({ query: 'latest AI tools', num_results: 5, language: 'en', summarize: true });
  const [searchResult, setSearchResult] = useState(null);
  const [newsQuery, setNewsQuery] = useState('artificial intelligence');
  const [newsResult, setNewsResult] = useState(null);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadImage, setUploadImage] = useState(null);
  const [uploadImageResult, setUploadImageResult] = useState(null);
  const [uploadUrl, setUploadUrl] = useState('https://example.com');
  const [uploadUrlResult, setUploadUrlResult] = useState(null);

  const [imagePrompt, setImagePrompt] = useState('A futuristic AI command center with glass dashboards and neon lighting');
  const [imageStyle, setImageStyle] = useState('cyberpunk');
  const [imageWidth, setImageWidth] = useState(1024);
  const [imageHeight, setImageHeight] = useState(1024);
  const [imageSeed, setImageSeed] = useState('');
  const [imageResult, setImageResult] = useState(null);
  const [describeFile, setDescribeFile] = useState(null);
  const [describeResult, setDescribeResult] = useState(null);

  const [ttsText, setTtsText] = useState('Namaste! This is your Kimi backend frontend test.');
  const [ttsLang, setTtsLang] = useState('en');
  const [ttsSlow, setTtsSlow] = useState(false);
  const [ttsResult, setTtsResult] = useState(null);

  const [translateText, setTranslateText] = useState('How are you today?');
  const [translateFrom, setTranslateFrom] = useState('auto');
  const [translateTo, setTranslateTo] = useState('hi');
  const [translateStyle, setTranslateStyle] = useState('casual');
  const [translateResult, setTranslateResult] = useState(null);
  const [batchText, setBatchText] = useState('Hello\nHow are you?\nWelcome to Kimi');
  const [batchResult, setBatchResult] = useState(null);

  const [sumText, setSumText] = useState('Paste any long content here to summarize.');
  const [sumLength, setSumLength] = useState('medium');
  const [sumFormat, setSumFormat] = useState('bullets');
  const [sumLanguage, setSumLanguage] = useState('en');
  const [sumTextResult, setSumTextResult] = useState(null);
  const [sumUrl, setSumUrl] = useState('https://example.com');
  const [sumUrlResult, setSumUrlResult] = useState(null);
  const [ytUrl, setYtUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [ytResult, setYtResult] = useState(null);

  const [codeAction, setCodeAction] = useState('review');
  const [codeInput, setCodeInput] = useState('function sum(a,b){ return a+b }');
  const [codeLang, setCodeLang] = useState('javascript');
  const [codeExtra, setCodeExtra] = useState('all');
  const [codeExtra2, setCodeExtra2] = useState('');
  const [codeResult, setCodeResult] = useState(null);

  const [writeAction, setWriteAction] = useState('improve');
  const [writeText, setWriteText] = useState('pls improve this text for client mail');
  const [writeStyle, setWriteStyle] = useState('professional');
  const [writeLang, setWriteLang] = useState('en');
  const [writeTopic, setWriteTopic] = useState('AI in education');
  const [writeTone, setWriteTone] = useState('informative');
  const [writeLength, setWriteLength] = useState('medium');
  const [writeKeywords, setWriteKeywords] = useState('AI, teachers, students');
  const [writeResult, setWriteResult] = useState(null);

  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [datasetId, setDatasetId] = useState('');
  const [datasetQuestion, setDatasetQuestion] = useState('What are the key patterns in this dataset?');
  const [datasetAnswer, setDatasetAnswer] = useState(null);

  const [docFile, setDocFile] = useState(null);
  const [docResult, setDocResult] = useState(null);
  const [docId, setDocId] = useState('');
  const [docQuestion, setDocQuestion] = useState('What is the main conclusion?');
  const [docAnswer, setDocAnswer] = useState(null);
  const [docCompareOne, setDocCompareOne] = useState(null);
  const [docCompareTwo, setDocCompareTwo] = useState(null);
  const [docCompareResult, setDocCompareResult] = useState(null);

  const [agentTask, setAgentTask] = useState('Create a market research brief about AI note-taking tools.');
  const [agentModel, setAgentModel] = useState('swarm');
  const [agentSteps, setAgentSteps] = useState(5);
  const [agentEvents, setAgentEvents] = useState([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const agentStopRef = useRef(null);

  const [historyPayload, setHistoryPayload] = useState('[{"role":"user","content":"Hello"},{"role":"assistant","content":"Hi there"}]');
  const [historyTitle, setHistoryTitle] = useState('Sample Conversation');
  const [historyModel, setHistoryModel] = useState('instant');
  const [historySessionId, setHistorySessionId] = useState('demo-session-001');
  const [historyList, setHistoryList] = useState(null);
  const [historyOne, setHistoryOne] = useState(null);
  const [statusPing, setStatusPing] = useState(null);

  const activeLabel = useMemo(() => NAV_ITEMS.find(([id]) => id === activeSection)?.[1] || 'Overview', [activeSection]);

  useEffect(() => {
    storage.setBaseUrl(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    storage.setToken(token);
  }, [token]);

  useEffect(() => {
    loadBootData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadBootData() {
    try {
      const [modelData, statusData, healthData] = await Promise.all([
        apiRequest('/api/chat/models'),
        apiRequest('/api/status').catch(() => null),
        apiRequest('/health').catch(() => null)
      ]);
      const normalizedModels = Array.isArray(modelData)
        ? modelData
        : Object.entries(modelData || {}).map(([name, details]) => ({ name, ...details }));
      setModels(normalizedModels);
      setStatus(statusData);
      setHealth(healthData);
    } catch (error) {
      setToast(error.message);
    }
  }

  function saveSettings() {
    storage.setBaseUrl(baseUrl);
    storage.setToken(token);
    setToast('Settings saved');
    loadBootData();
  }

  async function runAction(action, setter, options = {}) {
    options.onStart?.();
    try {
      const result = await action();
      setter(result);
      options.onSuccess?.(result);
      setToast(options.successMessage || 'Request completed');
    } catch (error) {
      setter({ error: error.message });
      setToast(error.message);
    } finally {
      options.onFinally?.();
    }
  }

  async function handleChatSubmit() {
    const messages = toMessages(chatPrompt, chatHistory);
    if (!messages.length) return setToast('Enter a prompt first');

    await runAction(
      () => postJson('/api/chat', {
        messages,
        model: chatModel,
        session_id: chatSession || undefined,
        temperature: chatTemperature ? Number(chatTemperature) : undefined,
        max_tokens: chatMaxTokens ? Number(chatMaxTokens) : undefined
      }),
      (result) => {
        setChatReply(result.reply || JSON.stringify(result, null, 2));
        setChatHistory([
          ...messages,
          { role: 'assistant', content: result.reply || '' }
        ]);
      },
      {
        onStart: () => setChatLoading(true),
        onFinally: () => setChatLoading(false),
        successMessage: 'Chat response received'
      }
    );
  }

  function handleChatStream() {
    if (streaming) {
      streamStopRef.current?.();
      setStreaming(false);
      return;
    }

    const messages = toMessages(chatPrompt, chatHistory);
    if (!messages.length) return setToast('Enter a prompt first');

    setChatReply('');
    setStreaming(true);
    setAgentEvents([]);

    streamStopRef.current = openSSE('/api/chat/stream', {
      messages,
      model: chatModel,
      session_id: chatSession || undefined
    }, {
      onMessage: (event) => {
        if (event.delta) {
          setChatReply((prev) => prev + event.delta);
        }
        if (event.done) {
          setStreaming(false);
          setChatHistory([
            ...messages,
            { role: 'assistant', content: chatReply + (event.delta || '') }
          ]);
        }
        if (event.error) {
          setToast(event.error);
          setStreaming(false);
        }
      },
      onError: (error) => {
        setToast(error.message);
        setStreaming(false);
      },
      onClose: () => setStreaming(false)
    });
  }

  async function fetchSearch() {
    await runAction(
      () => postJson('/api/search', searchState),
      setSearchResult
    );
  }

  async function fetchNews() {
    await runAction(
      () => apiRequest(`/api/search/news?q=${encodeURIComponent(newsQuery)}&lang=en&num=10`),
      setNewsResult
    );
  }

  async function handleUploadFile() {
    if (!uploadFile) return setToast('Choose a file first');
    const form = new FormData();
    form.append('file', uploadFile);
    await runAction(() => uploadForm('/api/upload', form), setUploadResult);
  }

  async function handleUploadImage() {
    if (!uploadImage) return setToast('Choose an image first');
    const form = new FormData();
    form.append('file', uploadImage);
    await runAction(() => uploadForm('/api/upload/image', form), setUploadImageResult);
  }

  async function handleUploadUrl() {
    await runAction(
      () => postJson('/api/upload/url', { url: uploadUrl, summarize: true }),
      setUploadUrlResult
    );
  }

  async function handleImageGenerate() {
    await runAction(
      () => postJson('/api/image/generate', {
        prompt: imagePrompt,
        style: imageStyle,
        width: Number(imageWidth),
        height: Number(imageHeight),
        seed: imageSeed ? Number(imageSeed) : undefined
      }),
      setImageResult
    );
  }

  async function handleImageDescribe() {
    if (!describeFile) return setToast('Choose an image first');
    const base64 = await fileToBase64(describeFile);
    await runAction(
      () => postJson('/api/image/describe', { image_base64: base64 }),
      setDescribeResult
    );
  }

  async function handleTts() {
    await runAction(
      () => postJson('/api/tts', { text: ttsText, language: ttsLang, slow: ttsSlow }),
      setTtsResult
    );
  }

  async function handleHindiTts() {
    await runAction(
      () => postJson('/api/tts/hindi', { text: ttsText }),
      setTtsResult
    );
  }

  async function handleTranslate() {
    await runAction(
      () => postJson('/api/translate', {
        text: translateText,
        from_lang: translateFrom,
        to_lang: translateTo,
        style: translateStyle
      }),
      setTranslateResult
    );
  }

  async function handleBatchTranslate() {
    const texts = batchText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!texts.length) return setToast('Add at least one line');
    await runAction(
      () => postJson('/api/translate/batch', { texts, to_lang: translateTo, style: translateStyle }),
      setBatchResult
    );
  }

  async function handleSummarizeText() {
    await runAction(
      () => postJson('/api/summarize/text', {
        text: sumText,
        length: sumLength,
        format: sumFormat,
        language: sumLanguage
      }),
      setSumTextResult
    );
  }

  async function handleSummarizeUrl() {
    await runAction(
      () => postJson('/api/summarize/url', {
        url: sumUrl,
        length: sumLength,
        language: sumLanguage
      }),
      setSumUrlResult
    );
  }

  async function handleSummarizeYoutube() {
    await runAction(
      () => postJson('/api/summarize/youtube', { url: ytUrl, language: sumLanguage }),
      setYtResult
    );
  }

  async function handleCodeAction() {
    let path = '/api/code/review';
    let payload = { code: codeInput, language: codeLang, focus: codeExtra || 'all' };

    if (codeAction === 'explain') {
      path = '/api/code/explain';
      payload = { code: codeInput, level: codeExtra || 'beginner', language_out: codeExtra2 || 'en' };
    } else if (codeAction === 'fix') {
      path = '/api/code/fix';
      payload = { code: codeInput, error: codeExtra2 || undefined, language: codeLang };
    } else if (codeAction === 'convert') {
      path = '/api/code/convert';
      payload = { code: codeInput, from_lang: codeLang, to_lang: codeExtra2 || 'javascript' };
    } else if (codeAction === 'generate') {
      path = '/api/code/generate';
      payload = { description: codeInput, language: codeLang, style: codeExtra || 'modern' };
    } else if (codeAction === 'optimize') {
      path = '/api/code/optimize';
      payload = { code: codeInput, language: codeLang, goal: codeExtra || 'all' };
    }

    await runAction(() => postJson(path, payload), setCodeResult);
  }

  async function handleWriteAction() {
    let path = '/api/write/improve';
    let payload = { text: writeText, style: writeStyle, language: writeLang };

    if (writeAction === 'generate') {
      path = '/api/write/generate';
      payload = {
        type: writeStyle || 'article',
        topic: writeTopic,
        tone: writeTone,
        length: writeLength,
        language: writeLang,
        keywords: writeKeywords
      };
    } else if (writeAction === 'email') {
      path = '/api/write/email';
      payload = {
        context: writeText,
        tone: writeTone,
        recipient: writeTopic,
        key_points: writeKeywords.split(',').map((item) => item.trim()).filter(Boolean),
        language: writeLang
      };
    } else if (writeAction === 'social') {
      path = '/api/write/social';
      payload = {
        topic: writeTopic,
        platform: writeStyle || 'linkedin',
        tone: writeTone,
        hashtags: true,
        language: writeLang
      };
    } else if (writeAction === 'headline') {
      path = '/api/write/headline';
      payload = { topic: writeTopic, type: writeStyle || 'news', count: Number(writeLength) || 5 };
    }

    await runAction(() => postJson(path, payload), setWriteResult);
  }

  async function handleCsvAnalyze() {
    if (!csvFile) return setToast('Choose a CSV file first');
    const form = new FormData();
    form.append('file', csvFile);
    await runAction(
      () => uploadForm('/api/data/analyze', form),
      (result) => {
        setCsvResult(result);
        if (result.dataset_id) setDatasetId(result.dataset_id);
      }
    );
  }

  async function handleCsvQuery() {
    await runAction(
      () => postJson('/api/data/query', { dataset_id: datasetId, question: datasetQuestion }),
      setDatasetAnswer
    );
  }

  async function handleDocAnalyze() {
    if (!docFile) return setToast('Choose a PDF first');
    const form = new FormData();
    form.append('file', docFile);
    await runAction(
      () => uploadForm('/api/doc/analyze', form),
      (result) => {
        setDocResult(result);
        if (result.doc_id) setDocId(result.doc_id);
      }
    );
  }

  async function handleDocQa() {
    await runAction(
      () => postJson('/api/doc/qa', { doc_id: docId, question: docQuestion }),
      setDocAnswer
    );
  }

  async function handleDocCompare() {
    if (!docCompareOne || !docCompareTwo) return setToast('Choose both PDF files');
    const form = new FormData();
    form.append('doc1', docCompareOne);
    form.append('doc2', docCompareTwo);
    await runAction(() => uploadForm('/api/doc/compare', form), setDocCompareResult);
  }

  function handleAgentRun() {
    if (agentRunning) {
      agentStopRef.current?.();
      setAgentRunning(false);
      return;
    }

    setAgentEvents([]);
    setAgentRunning(true);
    agentStopRef.current = openSSE('/api/agent/run', {
      task: agentTask,
      model: agentModel,
      tools: [],
      max_steps: Number(agentSteps)
    }, {
      onMessage: (event) => {
        setAgentEvents((prev) => [...prev, event]);
        if (event.done) setAgentRunning(false);
      },
      onError: (error) => {
        setToast(error.message);
        setAgentRunning(false);
      },
      onClose: () => setAgentRunning(false)
    });
  }

  async function handleSaveHistory() {
    const parsed = safeParse(historyPayload);
    if (!Array.isArray(parsed)) return setToast('History messages must be a JSON array');
    await runAction(
      () => postJson('/api/history/save', {
        session_id: historySessionId,
        messages: parsed,
        title: historyTitle,
        model: historyModel
      }),
      setHistoryOne
    );
  }

  async function handleListHistory() {
    await runAction(() => apiRequest('/api/history/list'), setHistoryList);
  }

  async function handleGetHistory() {
    await runAction(() => apiRequest(`/api/history/${historySessionId}`), setHistoryOne);
  }

  async function handleDeleteHistory() {
    await runAction(
      () => apiRequest(`/api/history/${historySessionId}`, { method: 'DELETE' }),
      setHistoryOne
    );
  }

  async function handleClearHistory() {
    await runAction(() => apiRequest('/api/history/all', { method: 'DELETE' }), setHistoryList);
  }

  async function refreshStatus() {
    await runAction(() => apiRequest('/api/status'), setStatus);
  }

  async function pingStatus() {
    await runAction(() => apiRequest('/api/status/ping'), setStatusPing);
  }

  async function hitHealth() {
    await runAction(() => apiRequest('/health'), setHealth);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">K</div>
          <div>
            <h1>Kimi Frontend</h1>
            <p>Connected to your Render backend</p>
          </div>
        </div>

        <div className="nav-list">
          {NAV_ITEMS.map(([id, label]) => (
            <button
              key={id}
              className={classNames('nav-btn', activeSection === id && 'active')}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div><strong>Backend</strong></div>
          <div className="tiny">{baseUrl || backendDefault}</div>
          <div className="tiny">Current: {activeLabel}</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar panel">
          <div>
            <h2>Production dashboard</h2>
            <p>Frontend is already wired to <code>{backendDefault}</code></p>
          </div>
          <div className="topbar-actions">
            <Field label="API Base URL">
              <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={backendDefault} />
            </Field>
            <Field label="Bearer Token">
              <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Optional token" />
            </Field>
            <div className="btn-row compact">
              <button className="primary" onClick={saveSettings}>Save</button>
              <button onClick={hitHealth}>Health</button>
              <button onClick={refreshStatus}>Status</button>
            </div>
          </div>
        </header>

        {toast ? <div className="toast">{toast}</div> : null}

        <Section id="overview" title="Overview" subtitle="Quick snapshot of backend connectivity and models" activeSection={activeSection}>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Backend URL</span>
              <strong>{baseUrl}</strong>
            </div>
            <div className="stat-card">
              <span>Models loaded</span>
              <strong>{models.length}</strong>
            </div>
            <div className="stat-card">
              <span>Status</span>
              <strong>{status?.status || 'unknown'}</strong>
            </div>
            <div className="stat-card">
              <span>Health</span>
              <strong>{health?.status || 'not checked'}</strong>
            </div>
          </div>

          <div className="grid two">
            <ResultCard title="Models" data={models} />
            <ResultCard title="Backend Status" data={status || { message: 'Click Status to load' }} />
          </div>
        </Section>

        <Section id="chat" title="Chat + Streaming" subtitle="Instant, thinking, agent, swarm ready chat console" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <div className="form-grid two">
                <Field label="Model">
                  <select value={chatModel} onChange={(e) => setChatModel(e.target.value)}>
                    <option value="instant">instant</option>
                    <option value="thinking">thinking</option>
                    <option value="agent">agent</option>
                    <option value="swarm">swarm</option>
                  </select>
                </Field>
                <Field label="Session ID">
                  <input value={chatSession} onChange={(e) => setChatSession(e.target.value)} placeholder="Optional session_id" />
                </Field>
                <Field label="Temperature">
                  <input value={chatTemperature} onChange={(e) => setChatTemperature(e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Max Tokens">
                  <input value={chatMaxTokens} onChange={(e) => setChatMaxTokens(e.target.value)} placeholder="Optional" />
                </Field>
              </div>
              <Field label="Prompt">
                <textarea rows="10" value={chatPrompt} onChange={(e) => setChatPrompt(e.target.value)} />
              </Field>
              <div className="btn-row">
                <button className="primary" onClick={handleChatSubmit} disabled={chatLoading}>{chatLoading ? 'Sending...' : 'Send Chat'}</button>
                <button onClick={handleChatStream}>{streaming ? 'Stop Stream' : 'Start Stream'}</button>
                <button onClick={() => { setChatHistory([]); setChatReply(''); }}>Clear</button>
              </div>
            </div>
            <div className="panel subpanel">
              <h3>Chat Output</h3>
              <pre className="output large">{chatReply || 'Response will appear here...'}</pre>
            </div>
          </div>
        </Section>

        <Section id="search" title="Search + News" subtitle="Web search and latest news search endpoints" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <div className="form-grid two">
                <Field label="Search Query">
                  <input value={searchState.query} onChange={(e) => setSearchState({ ...searchState, query: e.target.value })} />
                </Field>
                <Field label="Language">
                  <input value={searchState.language} onChange={(e) => setSearchState({ ...searchState, language: e.target.value })} />
                </Field>
                <Field label="Results Count">
                  <input type="number" value={searchState.num_results} onChange={(e) => setSearchState({ ...searchState, num_results: Number(e.target.value) })} />
                </Field>
                <Field label="Summarize">
                  <select value={String(searchState.summarize)} onChange={(e) => setSearchState({ ...searchState, summarize: e.target.value === 'true' })}>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </Field>
              </div>
              <div className="btn-row"><button className="primary" onClick={fetchSearch}>Run Search</button></div>
              <Field label="News Query">
                <input value={newsQuery} onChange={(e) => setNewsQuery(e.target.value)} />
              </Field>
              <div className="btn-row"><button onClick={fetchNews}>Get News</button></div>
            </div>
            <div className="stack">
              <ResultCard title="Search Result" data={searchResult || {}} />
              <ResultCard title="News Result" data={newsResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="upload" title="Upload + URL Analysis" subtitle="File upload, image analysis, and webpage extraction" activeSection={activeSection}>
          <div className="grid three">
            <div className="panel subpanel">
              <h3>File Upload</h3>
              <Field label="Choose File">
                <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              </Field>
              <button className="primary" onClick={handleUploadFile}>Analyze File</button>
              <ResultCard title="File Analysis" data={uploadResult || {}} />
            </div>
            <div className="panel subpanel">
              <h3>Image Upload</h3>
              <Field label="Choose Image">
                <input type="file" accept="image/*" onChange={(e) => setUploadImage(e.target.files?.[0] || null)} />
              </Field>
              <button className="primary" onClick={handleUploadImage}>Describe Image</button>
              <ResultCard title="Image Analysis" data={uploadImageResult || {}} />
            </div>
            <div className="panel subpanel">
              <h3>URL Summary</h3>
              <Field label="URL">
                <input value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleUploadUrl}>Analyze URL</button>
              <ResultCard title="URL Result" data={uploadUrlResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="image" title="Image Tools" subtitle="Generate and describe images using backend routes" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <h3>Generate Image</h3>
              <Field label="Prompt">
                <textarea rows="6" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
              </Field>
              <div className="form-grid two">
                <Field label="Style">
                  <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)}>
                    {['realistic', 'anime', '3d', 'sketch', 'painting', 'cyberpunk', 'fantasy'].map((style) => <option key={style} value={style}>{style}</option>)}
                  </select>
                </Field>
                <Field label="Seed">
                  <input value={imageSeed} onChange={(e) => setImageSeed(e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Width">
                  <input type="number" value={imageWidth} onChange={(e) => setImageWidth(e.target.value)} />
                </Field>
                <Field label="Height">
                  <input type="number" value={imageHeight} onChange={(e) => setImageHeight(e.target.value)} />
                </Field>
              </div>
              <button className="primary" onClick={handleImageGenerate}>Generate</button>
              {imageResult?.image_url ? <img className="preview-img" src={imageResult.image_url} alt="Generated" /> : null}
              <ResultCard title="Image Generate Response" data={imageResult || {}} />
            </div>
            <div className="panel subpanel">
              <h3>Describe Existing Image</h3>
              <Field label="Image File">
                <input type="file" accept="image/*" onChange={(e) => setDescribeFile(e.target.files?.[0] || null)} />
              </Field>
              <button className="primary" onClick={handleImageDescribe}>Describe</button>
              <ResultCard title="Describe Result" data={describeResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="tts" title="Text to Speech" subtitle="Generate playable MP3 audio from text" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <Field label="Text">
                <textarea rows="8" value={ttsText} onChange={(e) => setTtsText(e.target.value)} />
              </Field>
              <div className="form-grid two">
                <Field label="Language">
                  <input value={ttsLang} onChange={(e) => setTtsLang(e.target.value)} />
                </Field>
                <Field label="Slow">
                  <select value={String(ttsSlow)} onChange={(e) => setTtsSlow(e.target.value === 'true')}>
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                </Field>
              </div>
              <div className="btn-row">
                <button className="primary" onClick={handleTts}>Generate TTS</button>
                <button onClick={handleHindiTts}>Hindi TTS</button>
              </div>
            </div>
            <div className="panel subpanel">
              <ResultCard title="TTS Result" data={ttsResult || {}} />
              {ttsResult?.audio_base64 ? (
                <audio controls className="audio-player" src={`data:audio/mp3;base64,${ttsResult.audio_base64}`} />
              ) : null}
            </div>
          </div>
        </Section>

        <Section id="translate" title="Translation" subtitle="Single and batch translation support" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <h3>Single Translate</h3>
              <Field label="Input Text">
                <textarea rows="6" value={translateText} onChange={(e) => setTranslateText(e.target.value)} />
              </Field>
              <div className="form-grid three">
                <Field label="From">
                  <input value={translateFrom} onChange={(e) => setTranslateFrom(e.target.value)} />
                </Field>
                <Field label="To">
                  <input value={translateTo} onChange={(e) => setTranslateTo(e.target.value)} />
                </Field>
                <Field label="Style">
                  <select value={translateStyle} onChange={(e) => setTranslateStyle(e.target.value)}>
                    {['casual', 'formal', 'literal'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
              </div>
              <button className="primary" onClick={handleTranslate}>Translate</button>
              <ResultCard title="Single Translation" data={translateResult || {}} />
            </div>
            <div className="panel subpanel">
              <h3>Batch Translate</h3>
              <Field label="One line per text">
                <textarea rows="8" value={batchText} onChange={(e) => setBatchText(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleBatchTranslate}>Translate Batch</button>
              <ResultCard title="Batch Result" data={batchResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="summarize" title="Summarization" subtitle="Text, URL, and YouTube summarization" activeSection={activeSection}>
          <div className="panel subpanel">
            <div className="form-grid three">
              <Field label="Length">
                <select value={sumLength} onChange={(e) => setSumLength(e.target.value)}>
                  {['short', 'medium', 'detailed'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Format">
                <select value={sumFormat} onChange={(e) => setSumFormat(e.target.value)}>
                  {['bullets', 'paragraph', 'structured'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <input value={sumLanguage} onChange={(e) => setSumLanguage(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="grid three">
            <div className="panel subpanel">
              <h3>Text Summary</h3>
              <Field label="Text">
                <textarea rows="8" value={sumText} onChange={(e) => setSumText(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleSummarizeText}>Summarize Text</button>
              <ResultCard title="Text Summary" data={sumTextResult || {}} />
            </div>
            <div className="panel subpanel">
              <h3>URL Summary</h3>
              <Field label="URL">
                <input value={sumUrl} onChange={(e) => setSumUrl(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleSummarizeUrl}>Summarize URL</button>
              <ResultCard title="URL Summary" data={sumUrlResult || {}} />
            </div>
            <div className="panel subpanel">
              <h3>YouTube Summary</h3>
              <Field label="YouTube URL">
                <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleSummarizeYoutube}>Summarize Video</button>
              <ResultCard title="YouTube Summary" data={ytResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="code" title="Code Tools" subtitle="Review, explain, fix, convert, generate, optimize" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <div className="form-grid two">
                <Field label="Action">
                  <select value={codeAction} onChange={(e) => setCodeAction(e.target.value)}>
                    {['review', 'explain', 'fix', 'convert', 'generate', 'optimize'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Primary Language">
                  <input value={codeLang} onChange={(e) => setCodeLang(e.target.value)} />
                </Field>
                <Field label="Extra Field 1">
                  <input value={codeExtra} onChange={(e) => setCodeExtra(e.target.value)} placeholder="focus / level / style / goal" />
                </Field>
                <Field label="Extra Field 2">
                  <input value={codeExtra2} onChange={(e) => setCodeExtra2(e.target.value)} placeholder="target lang / error / output lang" />
                </Field>
              </div>
              <Field label={codeAction === 'generate' ? 'Description' : 'Code'}>
                <textarea rows="14" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleCodeAction}>Run Code Tool</button>
            </div>
            <div className="panel subpanel">
              <ResultCard title="Code Tool Result" data={codeResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="write" title="Writing Tools" subtitle="Improve, generate, email, social, headline" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <div className="form-grid two">
                <Field label="Action">
                  <select value={writeAction} onChange={(e) => setWriteAction(e.target.value)}>
                    {['improve', 'generate', 'email', 'social', 'headline'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Style / Type / Platform">
                  <input value={writeStyle} onChange={(e) => setWriteStyle(e.target.value)} />
                </Field>
                <Field label="Language">
                  <input value={writeLang} onChange={(e) => setWriteLang(e.target.value)} />
                </Field>
                <Field label="Tone">
                  <input value={writeTone} onChange={(e) => setWriteTone(e.target.value)} />
                </Field>
                <Field label="Topic / Recipient">
                  <input value={writeTopic} onChange={(e) => setWriteTopic(e.target.value)} />
                </Field>
                <Field label="Length / Count">
                  <input value={writeLength} onChange={(e) => setWriteLength(e.target.value)} />
                </Field>
              </div>
              <Field label="Text / Context">
                <textarea rows="10" value={writeText} onChange={(e) => setWriteText(e.target.value)} />
              </Field>
              <Field label="Keywords / Key Points">
                <input value={writeKeywords} onChange={(e) => setWriteKeywords(e.target.value)} />
              </Field>
              <button className="primary" onClick={handleWriteAction}>Run Writing Tool</button>
            </div>
            <div className="panel subpanel">
              <ResultCard title="Writing Result" data={writeResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="dataDoc" title="Data Analysis + Document Intel" subtitle="CSV and PDF workflows in one place" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <h3>CSV Analysis</h3>
              <Field label="CSV File">
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
              </Field>
              <button className="primary" onClick={handleCsvAnalyze}>Analyze CSV</button>
              <Field label="Dataset ID">
                <input value={datasetId} onChange={(e) => setDatasetId(e.target.value)} />
              </Field>
              <Field label="Dataset Question">
                <textarea rows="4" value={datasetQuestion} onChange={(e) => setDatasetQuestion(e.target.value)} />
              </Field>
              <button onClick={handleCsvQuery}>Ask Dataset</button>
              <ResultCard title="CSV Analysis" data={csvResult || {}} />
              <ResultCard title="Dataset Answer" data={datasetAnswer || {}} />
            </div>
            <div className="panel subpanel">
              <h3>Document Intelligence</h3>
              <Field label="Analyze PDF">
                <input type="file" accept="application/pdf" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              </Field>
              <button className="primary" onClick={handleDocAnalyze}>Analyze PDF</button>
              <Field label="Doc ID">
                <input value={docId} onChange={(e) => setDocId(e.target.value)} />
              </Field>
              <Field label="Question">
                <textarea rows="4" value={docQuestion} onChange={(e) => setDocQuestion(e.target.value)} />
              </Field>
              <button onClick={handleDocQa}>Ask Document</button>
              <div className="form-grid two">
                <Field label="Compare PDF 1">
                  <input type="file" accept="application/pdf" onChange={(e) => setDocCompareOne(e.target.files?.[0] || null)} />
                </Field>
                <Field label="Compare PDF 2">
                  <input type="file" accept="application/pdf" onChange={(e) => setDocCompareTwo(e.target.files?.[0] || null)} />
                </Field>
              </div>
              <button onClick={handleDocCompare}>Compare PDFs</button>
              <ResultCard title="Doc Analysis" data={docResult || {}} />
              <ResultCard title="Doc Answer" data={docAnswer || {}} />
              <ResultCard title="Doc Compare" data={docCompareResult || {}} />
            </div>
          </div>
        </Section>

        <Section id="agent" title="Agent Runner" subtitle="SSE-powered multi-step task execution" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <Field label="Task">
                <textarea rows="10" value={agentTask} onChange={(e) => setAgentTask(e.target.value)} />
              </Field>
              <div className="form-grid two">
                <Field label="Model">
                  <select value={agentModel} onChange={(e) => setAgentModel(e.target.value)}>
                    {['instant', 'thinking', 'agent', 'swarm'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Max Steps">
                  <input type="number" value={agentSteps} onChange={(e) => setAgentSteps(e.target.value)} />
                </Field>
              </div>
              <button className="primary" onClick={handleAgentRun}>{agentRunning ? 'Stop Agent' : 'Run Agent'}</button>
            </div>
            <div className="panel subpanel">
              <h3>Agent Events</h3>
              <pre className="output large">{JSON.stringify(agentEvents, null, 2)}</pre>
            </div>
          </div>
        </Section>

        <Section id="history" title="History + Status" subtitle="Save sessions, inspect status, and test uptime" activeSection={activeSection}>
          <div className="grid two">
            <div className="panel subpanel">
              <h3>History Controls</h3>
              <div className="form-grid two">
                <Field label="Session ID">
                  <input value={historySessionId} onChange={(e) => setHistorySessionId(e.target.value)} />
                </Field>
                <Field label="Model">
                  <input value={historyModel} onChange={(e) => setHistoryModel(e.target.value)} />
                </Field>
              </div>
              <Field label="Title">
                <input value={historyTitle} onChange={(e) => setHistoryTitle(e.target.value)} />
              </Field>
              <Field label="Messages JSON">
                <textarea rows="10" value={historyPayload} onChange={(e) => setHistoryPayload(e.target.value)} />
              </Field>
              <div className="btn-row wrap">
                <button className="primary" onClick={handleSaveHistory}>Save</button>
                <button onClick={handleListHistory}>List</button>
                <button onClick={handleGetHistory}>Get One</button>
                <button onClick={handleDeleteHistory}>Delete One</button>
                <button onClick={handleClearHistory}>Clear All</button>
              </div>
            </div>
            <div className="panel subpanel">
              <h3>Status Tools</h3>
              <div className="btn-row wrap">
                <button className="primary" onClick={refreshStatus}>Refresh Status</button>
                <button onClick={pingStatus}>Ping</button>
                <button onClick={hitHealth}>Health</button>
              </div>
              <ResultCard title="History One" data={historyOne || {}} />
              <ResultCard title="History List" data={historyList || {}} />
              <ResultCard title="Status Ping" data={statusPing || {}} />
              <ResultCard title="Health" data={health || {}} />
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
