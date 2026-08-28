'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');

  function goToSchoolLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!subdomain.trim()) return;
    // Temporary manual entry point until subdomain-based routing
    // (middleware) exists - a real deployment would resolve this
    // automatically from the URL's actual subdomain instead.
    router.push(`/tenant/${subdomain.trim()}/login`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-brand">School Portal</h1>
      <p className="mt-2 text-gray-600">
        Multi-tenant school management platform.
      </p>

      <form onSubmit={goToSchoolLogin} className="mt-6 flex gap-2">
        <input
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          placeholder="your-school-subdomain"
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-brand text-white rounded px-4 py-2 font-medium text-sm"
        >
          Go to school login
        </button>
      </form>

      <a href="/login" className="mt-4 text-sm text-gray-500 underline">
        Platform admin login
      </a>
    </main>
  );
}
