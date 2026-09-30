import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import type { IDoctorProfile } from '../../types/index.js';
import { enumLabel } from '../../utils/enumLabel.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { NotificationProvider } from '../../context/NotificationContext.js';
import { PortalShell, PortalNavGroup } from '../common/PortalShell.js';
import { LayoutDashboard, Search, HeartPulse, Shield, AlertTriangle } from 'lucide-react';

const DoctorLayoutInner: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const specialization = (profile as IDoctorProfile | null)?.specialization;
  const { t } = useLanguage();
  const navigate = useNavigate();

  const groups: PortalNavGroup[] = [
    {
      label: t('nav.clinicalPortal'),
      items: [
        { to: '/doctor/dashboard', label: t('nav.dashboard'), Icon: LayoutDashboard },
        { to: '/doctor/lookup', label: t('nav.patientLookup'), Icon: Search },
        { to: '/doctor/health-paths', label: t('nav.healthPaths'), Icon: HeartPulse },
        { to: '/doctor/activity', label: t('nav.myActivityLog'), Icon: Shield },
      ],
    },
    {
      label: t('nav.emergency'),
      tone: 'danger',
      items: [{ to: '/doctor/emergency', label: t('nav.emergencyHUD'), Icon: AlertTriangle, tone: 'danger' }],
    },
  ];

  const banner =
    user?.verified === false ? (
      <div className="mx-auto mb-1 mt-4 max-w-6xl px-3 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold">{t('Your doctor account is awaiting verification')}</p>
            <p className="mt-0.5">
              {t('Until your medical license is verified you cannot look up patients or open their records. Please contact the FollowUp team to complete verification.')}
            </p>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <PortalShell
      role="DOCTOR"
      portalName={t('nav.clinicalPortal')}
      groups={groups}
      user={user}
      subtitle={specialization ? enumLabel(specialization) : undefined}
      banner={banner}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    />
  );
};

export const DoctorLayout: React.FC = () => (
  <NotificationProvider>
    <DoctorLayoutInner />
  </NotificationProvider>
);
