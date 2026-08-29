import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BadgeIndianRupee,
  CreditCard,
  Flag,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Palette,
  ScrollText,
  Settings,
  Users,
  X,
} from 'lucide-react';

import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { useAuth } from '../../hooks/auth-context.js';
import { useDashboard, useOrders, useReports } from '../../hooks/queries.js';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'People',
    items: [
      { to: '/users', label: 'Users', icon: Users },
      { to: '/reports', label: 'Reports', icon: Flag, badge: 'reports' },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/pricing', label: 'Pricing & coins', icon: BadgeIndianRupee },
      { to: '/payments', label: 'Payments', icon: CreditCard, badge: 'payments' },
    ],
  },
  {
    label: 'Outreach',
    items: [{ to: '/campaigns', label: 'Campaigns', icon: Megaphone }],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/appearance', label: 'Appearance', icon: Palette },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/audit-log', label: 'Audit log', icon: ScrollText },
    ],
  },
];

function NavBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SidebarContent({ onNavigate, badges }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-sm font-bold text-white">
          V
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Vibe Admin</p>
          <p className="truncate text-[11px] text-ink-400">Control centre</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition
                       ${isActive ? 'bg-white/10 font-medium text-white' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                    <NavBadge count={badges[item.badge]} />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <Avatar name={user?.name ?? 'Admin'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-ink-400">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Sign out"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Counts of work waiting for an operator. These are the reason someone opens
  // the panel at all, so they belong in the navigation rather than buried on
  // their own pages.
  const { data: dashboard } = useDashboard();
  const { data: pendingOrders } = useOrders({ status: 'awaiting_verification', limit: 1 });
  const { data: openReports } = useReports({ status: 'open', limit: 1 });

  const badges = {
    payments: pendingOrders?.meta?.total ?? dashboard?.revenue?.awaitingVerification ?? 0,
    reports: openReports?.meta?.total ?? 0,
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden bg-ink-900 lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent badges={badges} />
        </div>
      </aside>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-[260px] bg-ink-900">
            <SidebarContent badges={badges} onNavigate={() => setIsMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-200 bg-ink-50/85 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen((open) => !open)}
            aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="text-sm font-semibold">Vibe Admin</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
