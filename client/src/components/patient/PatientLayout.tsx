import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { NotificationProvider, useNotifications } from '../../context/NotificationContext.js';
import { PortalShell, PortalNavGroup } from '../common/PortalShell.js';
import {
  LayoutDashboard,
  User,
  FileText,
  Clock,
  HeartPulse,
  Shield,
  MessageSquareHeart,
  Activity,
  ShieldCheck,
  Pill,
  ClipboardList,
} from 'lucide-react';

const PatientLayoutInner: React.FC = () => {
  const { items } = useNotifications();
  const pendingRequests = items.filter((n) => n.type === 'ACCESS_REQUEST_RECEIVED' && !n.readAt).length;
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const groups: PortalNavGroup[] = [
    {
      label: t('nav.patientPortal'),
      items: [
        { to: '/patient/dashboard', label: t('nav.dashboard'), Icon: LayoutDashboard },
        { to: '/patient/profile', label: t('nav.medicalProfile'), Icon: User },
        { to: '/patient/records', label: t('nav.medicalRecords'), Icon: FileText },
        { to: '/patient/timeline', label: t('nav.timeline'), Icon: Clock },
        { to: '/patient/health-tracker', label: t('Health Tracker'), Icon: Activity },
        { to: '/patient/health-paths', label: t('nav.healthPaths'), Icon: HeartPulse },
        { to: '/patient/prescriptions', label: t('Prescriptions'), Icon: ClipboardList },
        { to: '/patient/medications', label: t('Medications'), Icon: Pill },
        { to: '/patient/ask-advice', label: t('nav.askAdvice'), Icon: MessageSquareHeart },
      ],
    },
    {
      label: t('Privacy & Access'),
      items: [
        { to: '/patient/privacy', label: t('Privacy & Access'), Icon: ShieldCheck, badge: pendingRequests },
        { to: '/patient/activity', label: t('nav.privacyFeed'), Icon: Shield },
      ],
    },
  ];

  return (
    <PortalShell
      role="PATIENT"
      portalName={t('nav.patientPortal')}
      groups={groups}
      user={user}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    />
  );
};

export const PatientLayout: React.FC = () => (
  <NotificationProvider>
    <PatientLayoutInner />
  </NotificationProvider>
);
