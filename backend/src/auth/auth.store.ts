export type Role = 'analyst' | 'reader';

export interface AuthUser {
  username: string;
  role: Role;
  token: string;
}

const USERS: Record<string, { password: string; role: Role }> = {
  analyst: { password: 'sql123456', role: 'analyst' },
  reader: { password: 'read123456', role: 'reader' },
};

const tokens = new Map<string, AuthUser>();

export function login(username: string, password: string): AuthUser | null {
  const user = USERS[username];
  if (!user || user.password !== password) return null;
  const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString(
    'base64url',
  );
  const authUser: AuthUser = { username, role: user.role, token };
  tokens.set(token, authUser);
  return authUser;
}

export function resolveToken(token?: string | null): AuthUser | null {
  if (!token) return null;
  return tokens.get(token) || null;
}
