'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getStoredUser, logout, AuthUser } from '@/lib/auth';
import { authedFetch } from '@/lib/api-client';
import { AppShell } from '@/components/AppShell';

const PLATFORM_NAME = process.env.NEXT_PUBLIC_PLATFORM_NAME ?? 'Ekballo';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
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

  if (checking || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <AppShell user={user} orgName={PLATFORM_NAME} logoUrl={null} onLogout={handleLogout}>
      <div className="max-w-3xl">
        <h1 className="text-xl font-bold text-gray-900">Welcome, {user.fullName}</h1>
        <p className="text-gray-600 mt-1">
          You are logged in as <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>.
        </p>
      </div>
    </AppShell>
  );
}
