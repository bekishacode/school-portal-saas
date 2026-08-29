'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getStoredUser, logout, AuthUser } from '@/lib/auth';
import { authedFetch } from '@/lib/api-client';

export default function TenantDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // Clean path, not the internal /tenant/... one - the middleware
      // rewrites this invisibly on the subdomain host, keeping the
      // browser's URL bar clean. Pushing the internal path directly
      // would bypass that and expose it (the bug we just fixed).
      router.push('/login');
      return;
    }

    authedFetch('/auth/me', token)
      .then(() => setUser(getStoredUser()))
      .catch(() => {
        logout();
        router.push('/login');
      })
      .finally(() => setChecking(false));
  }, [router]);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-brand">Welcome, {user?.fullName}</h1>
      <p className="mt-2 text-gray-600">
        Logged in as <span className="font-medium">{user?.role}</span>
      </p>
      <button onClick={handleLogout} className="mt-6 text-sm text-gray-500 underline">
        Log out
      </button>
    </main>
  );
}
