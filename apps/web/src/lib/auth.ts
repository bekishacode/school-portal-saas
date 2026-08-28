import { apiFetch } from './api-client';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  schoolId: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  school: { id: string; name: string; subdomain: string } | null;
}

const TOKEN_KEY = 'school_portal_token';
const USER_KEY = 'school_portal_user';

export async function register(input: {
  schoolName: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const data: AuthResponse = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  persistSession(data);
  return data;
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
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
