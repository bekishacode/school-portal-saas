'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getToken, getStoredUser, logout, AuthUser } from '@/lib/auth';
import { authedFetch } from '@/lib/api-client';
import { getSchoolBySubdomain, SchoolBranding } from '@/lib/schools';
import { AppShell } from '@/components/AppShell';

export function TenantDashboardFrame({ children }: { children: React.ReactNode }) {
  const params = useParams<{ subdomain: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [school, setSchool] = useState<SchoolBranding | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      authedFetch('/auth/me', token),
      getSchoolBySubdomain(params.subdomain).catch(() => null),
    ])
      .then(([, schoolData]) => {
        setUser(getStoredUser());
        setSchool(schoolData);
      })
      .catch(() => {
        logout();
        router.push('/login');
      })
      .finally(() => setChecking(false));
  }, [router, params.subdomain]);

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
    <AppShell
      user={user}
      orgName={school?.name ?? 'School Portal'}
      logoUrl={school?.logoUrl ?? null}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
