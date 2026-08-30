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

  const brandStyle = school.brandColor
    ? ({ '--color-brand': school.brandColor } as React.CSSProperties)
    : undefined;

  const panelStyle: React.CSSProperties = school.coverImageUrl
    ? {
        backgroundImage: `url(${school.coverImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `linear-gradient(135deg, ${school.brandColor ?? '#2563eb'}, #111827)`,
      };

  return (
    <main className="min-h-screen flex flex-col md:flex-row" style={brandStyle}>
      {/* Left Panel - Form (50% width, centered content) */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* School logo and name */}
          <div className="flex items-center gap-3 mb-6">
            {school.logoUrl && (
              <img src={school.logoUrl} alt="" className="h-10 w-10 object-contain rounded" />
            )}
            <span className="text-lg font-semibold text-brand">{school.name}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Log in</h1>
          <p className="text-sm text-gray-600 mb-6">Enter your details to access your account.</p>

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
      </div>

      {/* Right Panel - Image (50% width, hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="relative w-full" style={panelStyle}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute bottom-0 left-0 right-0 p-10">
            <h2 className="text-2xl font-bold text-white drop-shadow">{school.name}</h2>
          </div>
        </div>
      </div>
    </main>
  );
}