import { useAuth } from '../auth/AuthContext';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join('; ');
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, String(message));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useApi() {
  const { user, logout } = useAuth();

  async function call<T>(path: string, options?: RequestInit): Promise<T> {
    try {
      return await request<T>(path, options, user?.token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
      throw err;
    }
  }

  return {
    login: (username: string, password: string) =>
      request<{ token: string; username: string; role: 'analyst' | 'reader' }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
      ),
    analyze: (payload: {
      dialect: string;
      sql: string;
      policy?: Record<string, string>;
    }) =>
      call<any>('/v1/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    rules: () => call<{ rules: any[] }>('/v1/rules'),
    history: () => call<{ items: any[] }>('/v1/history'),
    historyDetail: (id: string) => call<any>(`/v1/history/${id}`),
    fixtures: () => call<{ fixtures: any[] }>('/v1/fixtures'),
  };
}
