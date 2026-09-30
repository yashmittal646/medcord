import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Globe, LogOut, Menu, X } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext.js';
import { LanguagePickerModal } from './LanguagePickerModal.js';
import { NotificationBell } from './NotificationBell.js';
import { IdentityBadge } from './IdentityBadge.js';

export interface PortalNavItem {
  to: string;
  label: string;
  Icon: React.ElementType;
  badge?: number;
  /** 'danger' for emergency-style links */
  tone?: 'default' | 'danger';
}

export interface PortalNavGroup {
  label: string;
  tone?: 'default' | 'danger';
  items: PortalNavItem[];
}

interface Props {
  role: 'PATIENT' | 'DOCTOR';
  portalName: string;
  groups: PortalNavGroup[];
  user: { name?: string; publicId?: string } | null;
  /** Extra line under the user's name (e.g. specialization) */
  subtitle?: string;
  onLogout: () => void;
  /** Rendered above every page (e.g. a verification notice) */
  banner?: React.ReactNode;
}

/**
 * Shared frame for the patient and doctor portals ("Chart Room"): white ruled sidebar, plain top bar with
 * the current page's title, paper-grey ground. Type is set one step larger than the public site and every
 * control has a visible focus ring and a 44px touch target, for older patients and small screens.
 */
export const PortalShell: React.FC<Props> = ({ role, portalName, groups, user, subtitle, onLogout, banner }) => {
  const { lang, t, showPicker, formatDate } = useLanguage();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Portal pages read one step larger (rem-based sizes scale with the root)
  useEffect(() => {
    document.documentElement.classList.add('portal-html');
    return () => document.documentElement.classList.remove('portal-html');
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const allItems = groups.flatMap((g) => g.items);
  const current = [...allItems].sort((a, b) => b.to.length - a.to.length).find((i) => location.pathname.startsWith(i.to));
  const pageTitle = current?.label ?? portalName;
  const initials =
    (user?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || (role === 'DOCTOR' ? 'D' : 'P');

  return (
    <div className="portal-root flex min-h-screen">
      <LanguagePickerModal isOpen={showPicker || modalOpen} onClose={() => setModalOpen(false)} isDismissable={!showPicker} />

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`portal-sidebar fixed lg:sticky top-0 z-40 flex h-screen w-[16.5rem] shrink-0 flex-col transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true">
            <rect width="18" height="18" rx="4" fill="var(--pr-primary)" />
            <path d="M3 10h3l2-4 2 7 2-3h3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
          </svg>
          <span className="text-[15px] font-bold tracking-tight">FollowUp</span>
          <button className="ml-auto rounded-md p-1.5 text-[var(--pr-muted)] hover:bg-[var(--pr-hover)] lg:hidden" onClick={() => setSidebarOpen(false)} aria-label={t('Close')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Who is signed in */}
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-md border border-[var(--pr-line)] px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--pr-primary-tint)] text-sm font-semibold text-[var(--pr-primary)]">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            {subtitle ? (
              <p className="truncate text-xs text-[var(--pr-muted)]">{subtitle}</p>
            ) : (
              <div className="mt-0.5">
                <IdentityBadge id={user?.publicId || ''} type={role} size="sm" showLabel={false} />
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label={portalName}>
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className={`mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] ${group.tone === 'danger' ? 'text-[var(--pr-danger)]' : 'text-[var(--pr-muted)]'}`}>
                {group.label}
              </p>
              {group.items.map(({ to, label, Icon, badge, tone }) => {
                const danger = (tone ?? group.tone) === 'danger';
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `portal-nav flex min-h-[44px] items-center gap-3 rounded-md px-3 text-[14px] ${
                        isActive
                          ? danger
                            ? 'bg-[var(--pr-danger-tint)] font-semibold text-[var(--pr-danger)]'
                            : 'bg-[var(--pr-primary-tint)] font-semibold text-[var(--pr-primary)]'
                          : danger
                          ? 'text-[var(--pr-danger)] hover:bg-[var(--pr-danger-tint)]'
                          : 'text-[var(--pr-ink-2)] hover:bg-[var(--pr-hover)] hover:text-[var(--pr-ink)]'
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span className="flex-1 leading-snug">{label}</span>
                    {!!badge && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--pr-danger)] px-1.5 text-[11px] font-bold text-white">{badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--pr-line)] p-3">
          <button
            onClick={() => setModalOpen(true)}
            className="portal-nav flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-[14px] text-[var(--pr-ink-2)] hover:bg-[var(--pr-hover)]"
          >
            <Globe className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="flex-1 text-left">{currentLang.label}</span>
            <span className="text-xs text-[var(--pr-muted)]">{currentLang.labelEn}</span>
          </button>
          <button
            onClick={onLogout}
            className="portal-nav flex min-h-[44px] w-full items-center gap-3 rounded-md px-3 text-[14px] text-[var(--pr-ink-2)] hover:bg-[var(--pr-danger-tint)] hover:text-[var(--pr-danger)]"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="portal-topbar sticky top-0 z-20 flex min-h-[60px] items-center gap-3 px-4 sm:px-7">
          <button
            onClick={() => setSidebarOpen(true)}
            className="-ml-1 rounded-md p-2 text-[var(--pr-ink-2)] hover:bg-[var(--pr-hover)] lg:hidden"
            aria-label={t('Open menu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight">{pageTitle}</h1>
          <span className="hidden text-sm text-[var(--pr-muted)] md:block">{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <button
            onClick={() => setModalOpen(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-[var(--pr-line)] bg-white px-2.5 text-xs font-semibold lg:hidden"
            aria-label={currentLang.labelEn}
          >
            <Globe className="h-3.5 w-3.5" />
            {currentLang.code.toUpperCase()}
          </button>
          <NotificationBell role={role} />
        </header>

        <main className="flex-1 overflow-x-hidden pb-10">
          {banner}
          {/* re-keyed per route: a short fade so the content change is noticed, nothing more */}
          <div key={location.pathname} className="portal-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
