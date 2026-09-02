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
  const baseColumns: Column[] = [
    { key: 'id', label: '', width: 50 },
    { key: 'fullName', label: 'Name', width: 200 },
    { key: 'username', label: 'Username', width: 150 },
    { key: 'email', label: 'Email', width: 250 },
    { key: 'phone', label: 'Phone', width: 150 },
  ];

  const roleSpecificColumns: Column[] = 
    role === 'student'
      ? [
          { key: 'grade', label: 'Grade', width: 120 },
          { key: 'section', label: 'Section', width: 120 },
        ]
      : role === 'teacher'
        ? [{ key: 'department', label: 'Department', width: 180 }]
        : [];

  const metaColumns: Column[] = [
    { key: 'createdAt', label: 'Created', width: 130 },
    { key: 'createdBy', label: 'Created by', width: 150 },
  ];

  return [...baseColumns, ...roleSpecificColumns, ...metaColumns];
}

function cellValue(user: SchoolUser, key: string): string {
  switch (key) {
    case 'id':
      return '';
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
  const [searchText, setSearchText] = useState(''); // New state for search
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
    <div className="w-full h-full flex flex-col">
      {/* Header with title and actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {users.length} {roleLabel.toLowerCase()}(s) at this school
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* SEARCH INPUT - Added here */}
          <div className="relative">
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-64 border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent focus:bg-white transition-colors"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilter((open) => !open)}
            className={`inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showFilter 
                ? 'border-brand bg-brand/10 text-brand' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
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
              className="bg-[#0F766E] text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              + New {roleLabel}
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {showFilter && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 shrink-0">
          <div className="max-w-md">
            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={`Filter ${title.toLowerCase()}...`}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Table container - fills remaining space */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading {title.toLowerCase()}...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#0F766E] text-left text-white">
                    {columns.map((col, index) => (
                      <th
                        key={col.key}
                        className="relative px-4 py-3 font-semibold border-r border-[#b8c94a] last:border-r-0 select-none whitespace-nowrap"
                        style={{ width: col.width, minWidth: col.width }}
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
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-12 text-center text-gray-500"
                      >
                        {users.length === 0
                          ? `No ${title.toLowerCase()} found. ${canCreate ? 'Create one using the button above.' : ''}`
                          : 'No results match your filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, rowIndex) => (
                      <tr 
                        key={user.id} 
                        className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#F0FDFA]'} hover:bg-teal-100/100 transition-colors`}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-4 py-3 text-gray-800 border-r border-gray-200 last:border-r-0 truncate"
                            title={col.key === 'id' ? String(rowIndex + 1) : cellValue(user, col.key)}
                          >
                            {col.key === 'id' ? rowIndex + 1 : cellValue(user, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer with record count */}
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-sm text-gray-600 shrink-0">
              Showing {filteredUsers.length} of {users.length} {roleLabel.toLowerCase()}(s)
            </div>
          </div>
        )}
      </div>

      {/* Create user modal */}
      {canCreate && showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <h2 id="create-user-title" className="text-xl font-semibold text-gray-900">
                New {roleLabel}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-700">Full name *</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-700">Username *</span>
                <input
                  type="text"
                  required
                  minLength={3}
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-700">Email *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-700">Phone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </label>
              {role === 'student' && (
                <>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-gray-700">Grade</span>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-gray-700">Section</span>
                    <input
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    />
                  </label>
                </>
              )}
              {role === 'teacher' && (
                <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                  <span className="font-medium text-gray-700">Department</span>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </label>
              )}
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-gray-700">Password *</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </label>

              {formError && (
                <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : `Create ${roleLabel}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}