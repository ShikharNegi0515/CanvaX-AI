const API_BASE = 'http://localhost:3000';

const getToken = () => localStorage.getItem('canvax_token');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  user: { id: string; name: string; email: string; avatarUrl?: string };
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<AuthResponse['user']>('/auth/me'),
};

// ─── Canvas ───────────────────────────────────────────────────────────────────

export interface CanvasData {
  id: string;
  name: string;
  data: unknown[];
  thumbnail?: string;  // base64 PNG data URL
  userId: string;
  user?: { id: string; name: string | null; email: string };
  collaborators?: { role: 'EDITOR' | 'VIEWER'; user: { id: string; name: string | null; email: string } }[];
  role?: 'ADMIN' | 'EDITOR' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

export const canvasApi = {
  list: () => request<CanvasData[]>('/canvas'),

  create: (name?: string) =>
    request<CanvasData>('/canvas', {
      method: 'POST',
      body: JSON.stringify({ name: name ?? 'Untitled Canvas' }),
    }),

  get: (id: string) => request<CanvasData>(`/canvas/${id}`),

  save: (id: string, name: string, data: unknown[], thumbnail?: string) =>
    request<CanvasData>(`/canvas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, data, thumbnail }),
    }),

  share: (id: string, email: string, role: 'EDITOR' | 'VIEWER') =>
    request(`/canvas/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  rename: (id: string, name: string) =>
    request<CanvasData>(`/canvas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  saveThumbnail: (id: string, thumbnail: string) =>
    request<CanvasData>(`/canvas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ thumbnail }),
    }),

  delete: (id: string) =>
    request<void>(`/canvas/${id}`, { method: 'DELETE' }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiApi = {
  generate: (prompt: string) =>
    request<{ elements: unknown[] }>('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  beautify: (elements: unknown[]) =>
    request<{ elements: unknown[] }>('/ai/beautify', {
      method: 'POST',
      body: JSON.stringify({ elements }),
    }),

  transform: (elements: unknown[], prompt: string) =>
    request<{ elements: unknown[] }>('/ai/transform', {
      method: 'POST',
      body: JSON.stringify({ elements, prompt }),
    }),

  chat: (messages: { role: 'user' | 'assistant'; content: string }[], canvasElements?: unknown[]) =>
    request<{ text: string; newElements?: unknown[] }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, canvasElements }),
    }),
};
