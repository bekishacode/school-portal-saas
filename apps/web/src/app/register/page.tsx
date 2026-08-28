'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ schoolName, fullName, email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand mb-1">Register your school</h1>
        <p className="text-sm text-gray-600 mb-6">
          This creates your school and your admin account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="School name" value={schoolName} onChange={setSchoolName} placeholder="Green Valley Academy" />
          <Field label="Your full name" value={fullName} onChange={setFullName} placeholder="Jane Admin" />
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="jane@school.com" />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white rounded px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create school account'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-brand font-medium">
            Log in
          </a>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}
