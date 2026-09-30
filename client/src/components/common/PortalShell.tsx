import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, Globe, LogOut, Menu, X } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext.js';
import { LanguagePickerModal } from './LanguagePickerModal.js';
import { NotificationBell } from './NotificationBell.js';
import { IdentityBadge } from './IdentityBadge.js';
import { EcgTrace } from './EcgBackground.js';

// layout effect in the browser (no flicker when the highlight moves), plain effect in server renders
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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
 * Shared frame for the patient and doctor portals: dark ink sidebar with a live ECG line and a sliding
 * active-item glow, frosted top bar with the current page's title, aurora background, and animated page
 * transitions (each page's sections rise in one after another).
 */
export const PortalShell: React.FC<Props> = ({ role, portalName, groups, user, subtitle, onLogout, banner }) => {
  const { lang, t, showPicker, formatDate } = useLanguage();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<{ top: number; height: number; danger: boolean } | null>(null);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const allItems = groups.flatMap((g) => g.items);
  const current = [...allItems].sort((a, b) => b.to.length - a.to.length).find((i) => location.pathname.startsWith(i.to));
  const pageTitle = current?.label ?? portalName;

  // Slide the glowing highlight to whichever link is active
  useIsoLayoutEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!nav || !active) return setIndicator(null);
    setIndicator({ top: active.offsetTop, height: active.offsetHeight, danger: active.dataset.tone === 'danger' });
  }, [location.pathname, lang, groups.length]);

  const initial = user?.name?.trim().charAt(0).toUpperCase() || (role === 'DOCTOR' ? 'D' : 'P');

  return (
    <div className="portal-root flex min-h-screen">
      <div className="portal-bg" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <LanguagePickerModal isOpen={showPicker || modalOpen} onClose={() => setModalOpen(false)} isDismissable={!showPicker} />

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`portal-sidebar fixed lg:sticky top-0 z-40 flex h-screen w-[17rem] shrink-0 flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Identity card with a live heartbeat */}
        <div className="relative m-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="portal-avatar relative h-11 w-11 shrink-0 rounded-2xl p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0f0f1a] text-base font-bold text-white">{initial}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{user?.name}</p>
              {subtitle && <p className="truncate text-[11px] font-semibold text-teal-300">{subtitle}</p>}
            </div>
            <button className="rounded-lg p-1 text-white/50 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)} aria-label={t('Close')}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 [&_*]:!text-[10px]">
            <IdentityBadge id={user?.publicId || ''} type={role} size="sm" showLabel={false} />
          </div>
          <EcgTrace className="mt-3 h-8 w-full" color={role === 'DOCTOR' ? '#818cf8' : '#5eead4'} duration={5.5} amp={0.9} />
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="relative flex-1 overflow-y-auto px-3 pb-3">
          {indicator && (
            <span
              aria-hidden="true"
              className={`portal-indicator ${indicator.danger ? 'is-danger' : ''}`}
              style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
            />
          )}
          {groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className={`mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] ${group.tone === 'danger' ? 'text-rose-300/70' : 'text-white/35'}`}>
                {group.label}
              </p>
              {group.items.map(({ to, label, Icon, badge, tone }) => (
                <NavLink
                  key={to}
                  to={to}
                  data-tone={tone ?? group.tone ?? 'default'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative z-[1] flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors duration-200 ${
                      isActive ? 'text-white' : (tone ?? group.tone) === 'danger' ? 'text-rose-200/80 hover:text-rose-100' : 'text-white/60 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                          isActive ? 'bg-white/15 shadow-[0_0_18px_rgba(129,140,248,0.45)]' : 'bg-white/[0.04] group-hover:bg-white/10 group-hover:scale-105'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 leading-snug">{label}</span>
                      {!!badge && (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(244,63,94,0.6)]">
                          {badge}
                        </span>
                      )}
                      <ChevronRight className={`h-3.5 w-3.5 transition-all duration-300 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-40'}`} />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="space-y-1.5 border-t border-white/10 p-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-teal-300" />
              {currentLang.label}
              <span className="text-[10px] text-white/35">({currentLang.labelEn})</span>
            </span>
            <span className="text-[10px] font-bold text-white/40">{currentLang.flag}</span>
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-rose-500/15 hover:text-rose-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="portal-topbar sticky top-0 z-20 flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-600 hover:bg-white/70 hover:text-slate-900 lg:hidden"
            aria-label={t('Open menu')}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500/80 sm:block">{portalName}</p>
            <h1 key={pageTitle} className="portal-title truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              {pageTitle}
            </h1>
          </div>
          <span className="hidden text-xs font-medium text-slate-500 md:block">
            {formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white lg:hidden"
          >
            <Globe className="h-3 w-3 text-indigo-600" />
            {currentLang.code.toUpperCase()}
          </button>
          <div className="rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur">
            <NotificationBell role={role} />
          </div>
        </header>

        <main className="relative flex-1 overflow-x-hidden px-1 pb-10 sm:px-2">
          {banner}
          {/* re-keyed per route so every page plays its entrance */}
          <div key={location.pathname} className="portal-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
