'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/lib/auth';
import { SearchIcon, BellIcon, SettingsIcon, GridIcon, ChevronDownIcon } from './icons';

// Constant fallback (Change this value or pass `unreadNotificationsCount` via props)
const DEFAULT_UNREAD_COUNT = 3;

// Role-based nav. Items with an href route; the rest stay placeholders
// until their own tickets land.
const NAV_ITEMS: { label: string; href?: string; roles: string[] }[] = [
  { label: 'Home', href: '/dashboard', roles: ['super_admin', 'school_admin', 'registrar', 'teacher', 'student', 'parent', 'librarian', 'accountant'] },
  { label: 'Schools', roles: ['super_admin'] },
  { label: 'Subjects', roles: ['school_admin', 'registrar', 'teacher'] },
  { label: 'Teachers', href: '/dashboard/teachers', roles: ['school_admin', 'registrar'] },
  { label: 'Students', href: '/dashboard/students', roles: ['school_admin', 'registrar', 'teacher'] },
  { label: 'Registrars', href: '/dashboard/registrars', roles: ['school_admin'] },
];

function isNavActive(label: string, href: string | undefined, pathname: string) {
  const segment = pathname.replace(/\/$/, '').split('/').pop() ?? '';
  if (label === 'Home') return segment === 'dashboard';
  if (!href) return false;
  return segment === href.split('/').pop();
}

export function AppShell({
  user,
  orgName,
  logoUrl,
  unreadNotificationsCount = DEFAULT_UNREAD_COUNT,
  onLogout,
  children,
}: {
  user: AuthUser;
  orgName: string;
  logoUrl?: string | null;
  unreadNotificationsCount?: number;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const activeNav =
    visibleNavItems.find((item) => isNavActive(item.label, item.href, pathname))?.label ?? 'Home';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar: org branding, global search, utility icons, profile */}
      <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={orgName} className="h-8 w-8 object-contain rounded" />
            ) : (
              <div className="h-8 w-8 rounded bg-brand text-white flex items-center justify-center text-sm font-bold">
                {orgName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-gray-800 hidden sm:inline">{orgName}</span>
          </div>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <button className="text-black hover:text-gray-700" title="Settings" type="button">
              <SettingsIcon className="h-6 w-6" />
            </button>
            <button className="text-black hover:text-gray-700" title="Notifications" type="button">
              <BellIcon className="h-8 w-8" count={unreadNotificationsCount} />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                type="button"
                className="h-10 w-10 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold"
              >
                {user.fullName.charAt(0)}
              </button>
              {profileOpen && (
                <>
                  {/* Click-outside catcher */}
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded shadow-lg py-1 z-20">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={onLogout}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Second bar: app launcher, current app, nav dropdown */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 px-4 h-11">
          <button className="text-gray-500 hover:text-gray-700" title="App launcher" type="button">
            <GridIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">School Portal</span>

          <div className="relative">
            <button
              onClick={() => setNavOpen((v) => !v)}
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-brand px-2 py-1 rounded hover:bg-gray-50"
            >
              {activeNav}
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            {navOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNavOpen(false)} />
                <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg py-1 z-20">
                  {visibleNavItems.map((item) =>
                    item.href ? (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          activeNav === item.label ? 'text-brand font-medium' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        key={item.label}
                        onClick={() => setNavOpen(false)}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          activeNav === item.label ? 'text-brand font-medium' : 'text-gray-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main body */}
      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
