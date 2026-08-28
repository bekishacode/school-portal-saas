// Central place for calling the NestJS API from the frontend.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // No JSON body (e.g. empty response) - fine to ignore.
  }

  if (!res.ok) {
    // NestJS's default error shape is { statusCode, message, error }.
    // 'message' can be a string or an array (from class-validator).
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? `API error: ${res.status} ${res.statusText}`);
    throw new ApiError(res.status, message);
  }

  return body;
}

// For requests that need the logged-in user's token attached.
export async function authedFetch(path: string, token: string, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
}
