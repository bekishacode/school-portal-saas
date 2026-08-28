import { apiFetch } from './api-client';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  schoolId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  school: { id: string; name: string; subdomain: string } | null;
}

const TOKEN_KEY = 'school_portal_token';
const USER_KEY = 'school_portal_user';

// schoolId is resolved by the tenant login page from the subdomain -
// omit it for platform/root-domain login (super_admin). The backend
// rejects the login if the account doesn't actually belong to that school.
export async function login(input: {
  email: string;
  password: string;
  schoolId?: string;
}): Promise<AuthResponse> {
  const data: AuthResponse = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  persistSession(data);
  return data;
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function persistSession(data: AuthResponse) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}
