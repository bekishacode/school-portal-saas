'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { getSchoolBySubdomain, SchoolBranding } from '@/lib/schools';
import { ApiError } from '@/lib/api-client';

export default function TenantLoginPage() {
  const params = useParams<{ subdomain: string }>();
  const router = useRouter();

  const [school, setSchool] = useState<SchoolBranding | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Resolve the school's branding from its subdomain BEFORE anyone has
  // logged in - this is what lets the login page look like the school's,
  // not the platform's.
  useEffect(() => {
    getSchoolBySubdomain(params.subdomain)
      .then(setSchool)
      .catch(() => setNotFound(true))
      .finally(() => setLoadingSchool(false));
  }, [params.subdomain]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!school) return;
    setError(null);
    setSubmitting(true);
    try {
      // Passing school.id is what makes this a TENANT login, not a
      // generic one - the backend rejects the attempt if this account
      // doesn't actually belong to this school.
      await login({ email, password, schoolId: school.id });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingSchool) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (notFound || !school) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">School not found</h1>
          <p className="mt-2 text-gray-600">
            We couldn&apos;t find a school at this address. Check the link and try again.
          </p>
        </div>
      </main>
    );
  }

  // Branding is applied via the same --color-brand CSS variable the rest
  // of the app already uses (see tailwind.config.js) - falls back to the
  // default blue if this school hasn't set a custom color yet.
  const brandStyle = school.brandColor
    ? ({ '--color-brand': school.brandColor } as React.CSSProperties)
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center p-8" style={brandStyle}>
      <div className="w-full max-w-sm">
        {school.logoUrl && (
          <img src={school.logoUrl} alt={school.name} className="h-12 mb-4 object-contain" />
        )}
        <h1 className="text-2xl font-bold text-brand mb-1">{school.name}</h1>
        <p className="text-sm text-gray-600 mb-6">Log in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-brand text-white rounded px-4 py-2 font-medium disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </main>
  );
}
