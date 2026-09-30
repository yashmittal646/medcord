import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types/index.js';
import { useLanguage } from '../../context/LanguageContext.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">{t('Authenticating session...')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const isDoctorRoute = allowedRoles?.includes('DOCTOR') || location.pathname.startsWith('/doctor');
    const redirectPath = isDoctorRoute ? '/doctor/login' : '/patient/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to respective home dashboard if wrong role
    if (user.role === 'PATIENT') {
      return <Navigate to="/patient/dashboard" replace />;
    }
    if (user.role === 'DOCTOR') {
      return <Navigate to="/doctor/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
