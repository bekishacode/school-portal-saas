'use client';

import { FormEvent, MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, getToken } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';
import { createUser, CreatableSchoolRole, listUsers, SchoolUser } from '@/lib/users';
import { FilterIcon } from './icons';

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  registrar: 'Registrar',
  student: 'Student',
  parent: 'Parent',
  librarian: 'Librarian',
  accountant: 'Accountant',
};

const PAGE_ACCESS: Record<CreatableSchoolRole, string[]> = {
  teacher: ['school_admin', 'registrar'],
  student: ['school_admin', 'registrar', 'teacher'],
  registrar: ['school_admin'],
  parent: ['school_admin', 'registrar'],
  librarian: ['school_admin'],
  accountant: ['school_admin'],
};

type Column = { key: string; label: string; width: number };

function defaultColumns(role: CreatableSchoolRole): Column[] {
  const extra: Column[] =
    role === 'student'
      ? [
          { key: 'grade', label: 'Grade', width: 100 },
          { key: 'section', label: 'Section', width: 100 },
        ]
      : role === 'teacher'
        ? [{ key: 'department', label: 'Department', width: 140 }]
        : [];

  return [
    { key: 'fullName', label: 'Name', width: 180 },
    { key: 'username', label: 'Username', width: 140 },
    { key: 'email', label: 'Email', width: 220 },
    { key: 'phone', label: 'Phone', width: 140 },
    ...extra,
    { key: 'createdAt', label: 'Created', width: 120 },
    { key: 'createdBy', label: 'Created by', width: 140 },
  ];
}

function cellValue(user: SchoolUser, key: string): string {
  switch (key) {
    case 'fullName':
      return user.fullName;
    case 'username':
      return user.username;
    case 'email':
      return user.email;
    case 'phone':
      return user.phone ?? '—';
    case 'grade':
      return user.grade ?? '—';
    case 'section':
      return user.section ?? '—';
    case 'department':
      return user.department ?? '—';
    case 'createdAt':
      return user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
    case 'createdBy':
      return user.createdBy ?? '—';
    default:
      return '—';
  }
}

export function SchoolUsersPage({
  role,
  title,
}: {
  role: CreatableSchoolRole;
  title: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [department, setDepartment] = useState('');
  const [columns, setColumns] = useState<Column[]>(() => defaultColumns(role));

  const viewerRole = getStoredUser()?.role;
  const canCreate = viewerRole === 'school_admin';
  const canView = viewerRole ? PAGE_ACCESS[role].includes(viewerRole) : false;
  const roleLabel = ROLE_LABELS[role] ?? title;

  useEffect(() => {
    setColumns(defaultColumns(role));
  }, [role]);

  useEffect(() => {
    if (viewerRole && !PAGE_ACCESS[role].includes(viewerRole)) {
      router.replace('/dashboard');
      return;
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    listUsers(token, role)
      .then(setUsers)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load users.');
      })
      .finally(() => setLoading(false));
  }, [role, router, viewerRole]);

  useEffect(() => {
    if (!showForm) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowForm(false);
        setFormError(null);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  const filteredUsers = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.fullName, user.username, user.email, user.phone, user.grade, user.section, user.department]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q)),
    );
  }, [users, filterText]);

  function resetForm() {
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('');
    setGrade('');
    setSection('');
    setDepartment('');
    setFormError(null);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const created = await createUser(token, {
        fullName,
        username,
        email,
        phone: phone.trim() || undefined,
        password,
        role,
        grade: role === 'student' && grade.trim() ? grade.trim() : undefined,
        section: role === 'student' && section.trim() ? section.trim() : undefined,
        department: role === 'teacher' && department.trim() ? department.trim() : undefined,
      });
      setUsers((prev) => [...prev, created].sort((a, b) => a.fullName.localeCompare(b.fullName)));
      closeForm();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create user.');
    } finally {
      setSubmitting(false);
    }
  }

  function startResize(index: number, e: ReactMouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columns[index].width;

    function onMove(ev: globalThis.MouseEvent) {
      const nextWidth = Math.max(80, startWidth + ev.clientX - startX);
      setColumns((cols) => cols.map((col, i) => (i === index ? { ...col, width: nextWidth } : col)));
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  if (!canView) {
    return <p className="text-gray-500">Redirecting...</p>;
  }

  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);

  return (
    <div className="max-w-6xl space-y-4">
      <section className="bg-gray-50 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              People at this school with the {roleLabel.toLowerCase()} role.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFilter((open) => !open)}
              className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-700 rounded px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <FilterIcon className="h-4 w-4" />
              Filter
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setFormError(null);
                }}
                className="bg-brand text-white rounded px-4 py-2 text-sm font-medium"
              >
                New {roleLabel}
              </button>
            )}
          </div>
        </div>
        {showFilter && (
          <div className="mt-3">
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter by name, username, or email..."
              className="w-full sm:max-w-sm border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        )}
      </section>

      <section>
        {loading && <p className="text-gray-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white">
            <table className="text-sm table-fixed border-collapse" style={{ width: tableWidth, minWidth: '100%' }}>
              <colgroup>
                {columns.map((col) => (
                  <col key={col.key} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr className="bg-[#d4e157] text-left text-gray-800">
                  {columns.map((col, index) => (
                    <th
                      key={col.key}
                      className="relative px-3 py-2 font-semibold border-r border-[#b8c94a] last:border-r-0 select-none"
                    >
                      {col.label}
                      <span
                        role="separator"
                        aria-orientation="vertical"
                        onMouseDown={(e) => startResize(index, e)}
                        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-gray-700/30"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr className="bg-white">
                    <td
                      colSpan={columns.length}
                      className="px-3 py-6 text-center text-gray-600 border-t border-gray-200"
                    >
                      {users.length === 0
                        ? `No ${title.toLowerCase()} yet.`
                        : 'No rows match this filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, rowIndex) => (
                    <tr key={user.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-3 py-2 text-gray-800 border-r border-gray-200 last:border-r-0 truncate"
                          title={cellValue(user, col.key)}
                        >
                          {cellValue(user, col.key)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canCreate && showForm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={closeForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 id="create-user-title" className="text-lg font-semibold text-gray-900">
                New {roleLabel}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-500 hover:text-gray-800 text-sm"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Full name</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-gray-700">Username</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
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
                <span className="font-medium text-gray-700">Phone (optional)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>
              {role === 'student' && (
                <>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Grade</span>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-gray-700">Section</span>
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </label>
                </>
              )}
              {role === 'teacher' && (
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="font-medium text-gray-700">Department</span>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </label>
              )}
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-gray-700">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </label>

              {formError && (
                <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="border border-gray-300 text-gray-700 rounded px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : `Create ${roleLabel.toLowerCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
