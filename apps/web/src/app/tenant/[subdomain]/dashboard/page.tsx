'use client';

import { getStoredUser } from '@/lib/auth';

export default function TenantDashboardPage() {
  const user = getStoredUser();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900">Welcome{user ? `, ${user.fullName}` : ''}</h1>
      {user && (
        <p className="text-gray-600 mt-1">
          You are logged in as <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span>.
        </p>
      )}
    </div>
  );
}
