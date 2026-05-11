const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://kimibg1.onrender.com';
const defaultToken = import.meta.env.VITE_AUTH_TOKEN || '';

export const storage = {
  getBaseUrl() {
    return localStorage.getItem('kimi_api_base') || defaultBaseUrl;
  },
  setBaseUrl(value) {
    localStorage.setItem('kimi_api_base', value);
  },
  getToken() {
    return localStorage.getItem('kimi_api_token') || defaultToken;
  },
  setToken(value) {
    localStorage.setItem('kimi_api_token', value);
  }
};

function normalizeBase(url) {
  return (url || defaultBaseUrl).replace(/\/$/, '');
}

function buildHeaders(extra = {}, isJson = true) {
  const headers = { ...extra };
  const token = storage.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (isJson) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function apiRequest(path, options = {}) {
  const baseUrl = normalizeBase(storage.getBaseUrl());
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: buildHeaders(options.headers, options.isJson !== false),
    body: options.body,
    signal: options.signal
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === 'string' ? data : data.error || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export function postJson(path, payload) {
  return apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function uploadForm(path, formData) {
  return apiRequest(path, {
    method: 'POST',
    body: formData,
    isJson: false,
    headers: {}
  });
}

export function openSSE(path, payload, handlers = {}) {
  const baseUrl = normalizeBase(storage.getBaseUrl());
  const controller = new AbortController();
  const token = storage.getToken();

  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: buildHeaders({ Accept: 'text/event-stream' }),
    body: JSON.stringify(payload),
    signal: controller.signal
  })
    .then(async (response) => {
      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || 'Stream failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const line = event.split('\n').find((entry) => entry.startsWith('data: '));
          if (!line) continue;
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw);
            handlers.onMessage?.(parsed);
          } catch {
            handlers.onMessage?.({ raw });
          }
        }
      }

      handlers.onClose?.();
    })
    .catch((error) => {
      if (controller.signal.aborted) return;
      handlers.onError?.(error);
    });

  return () => controller.abort();
}
