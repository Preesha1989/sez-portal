// src/lib/api.js
// Central API client. All backend calls go through here.

const BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1';

function getToken() {
  return localStorage.getItem('sez_token');
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password)  => request('POST', '/auth/login', { email, password }),
  me:    ()                  => request('GET',  '/auth/me'),
};

// ── Requests ────────────────────────────────────────────────────────────────
export const requestsApi = {
  list:   (params = {}) => request('GET',  '/requests?' + new URLSearchParams(params)),
  get:    (id)          => request('GET',  `/requests/${id}`),
  create: (data)        => request('POST', '/requests', data),
  stats:  ()            => request('GET',  '/requests/stats'),

  setStatus: (id, status)    => request('PATCH', `/requests/${id}/status`,  { status }),
  assign:    (id, memberId)  => request('PATCH', `/requests/${id}/assign`,  { memberId }),
  comment:   (id, body)      => request('POST',  `/requests/${id}/comments`, { body }),

  uploadDocuments: (id, files) => {
    const form = new FormData();
    for (const f of files) form.append('files', f);
    return request('POST', `/requests/${id}/documents`, form, true);
  },

  downloadUrl: (requestId, docId) => `${BASE}/requests/${requestId}/documents/${docId}`,
};

// ── Team ────────────────────────────────────────────────────────────────────
export const teamApi = {
  list: () => request('GET', '/team'),
};

// ── Audit ───────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params = {}) => request('GET', '/audit?' + new URLSearchParams(params)),
};
