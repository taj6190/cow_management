'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  FiHome,
  FiDatabase,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiPlusCircle,
  FiTag,
  FiLogOut,
  FiUser,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';
import { useTheme } from './ThemeProvider';

const navGroups = [
  {
    label: 'MAIN',
    items: [
      { href: '/', label: 'Dashboard', desc: 'Farm overview', icon: FiHome },
      { href: '/cows', label: 'Cows', desc: 'All cow records', icon: GiCow },
      { href: '/transactions', label: 'Transactions', desc: 'Income & expenses', icon: FiDollarSign },
    ],
  },
  {
    label: 'ANALYTICS',
    items: [
      { href: '/reports', label: 'Reports', desc: 'Financial analysis', icon: FiBarChart2 },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { href: '/settings', label: 'Categories & Owners', desc: 'Manage categories & partners', icon: FiTag },
      { href: '/backup', label: 'Backup', desc: 'Save & restore data', icon: FiDatabase },
    ],
  },
];

const quickActions = [
  { href: '/cows/add', label: 'New Cow', icon: FiPlusCircle },
  { href: '/transactions/add', label: 'New Transaction', icon: FiPlusCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface-0 border-b border-surface-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <GiCow className="text-white text-lg" />
          </div>
          <span className="font-bold text-surface-900">GoruFarm</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-surface-100 text-surface-600"
        >
          {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-surface-0 border-r border-surface-200
          flex flex-col transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-surface-100">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <GiCow className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="font-bold text-surface-900 text-lg leading-tight">GoruFarm</h1>
              <p className="text-[11px] text-surface-400">Farm Management System</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.15em] px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group
                        ${active
                          ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-800'
                        }
                      `}
                    >
                      <div className={`
                        w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                        ${active
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-surface-100 text-surface-500 group-hover:bg-surface-200'
                        }
                      `}>
                        <item.icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-[13px] leading-tight ${active ? 'text-primary-700' : ''}`}>
                          {item.label}
                        </p>
                        <p className={`text-[10px] leading-tight mt-0.5 ${active ? 'text-primary-500' : 'text-surface-400'}`}>
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Actions */}
          <div>
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.15em] px-3 mb-1.5">
              QUICK ACTIONS
            </p>
            <div className="space-y-0.5">
              {quickActions.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center shrink-0 group-hover:bg-primary-100">
                    <item.icon size={17} />
                  </div>
                  <p className="font-semibold text-[13px]">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Theme Toggle & User */}
        <div className="p-3 border-t border-surface-100 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors group"
          >
            <div className="w-9 h-9 bg-surface-100 text-surface-500 flex items-center justify-center shrink-0 group-hover:bg-surface-200">
              {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
            </div>
            <span className="font-medium text-[13px]">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          {session?.user && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-surface-50">
              <div className="w-8 h-8 bg-primary-100 flex items-center justify-center shrink-0">
                <FiUser size={14} className="text-primary-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-surface-800 truncate">{session.user.name}</p>
                <p className="text-[10px] text-surface-400 truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors group"
          >
            <div className="w-9 h-9 bg-red-50 text-red-400 flex items-center justify-center shrink-0 group-hover:bg-red-100">
              <FiLogOut size={16} />
            </div>
            <span className="font-medium text-[13px]">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
