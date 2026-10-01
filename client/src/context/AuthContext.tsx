import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { IUser, IPatientProfile, IDoctorProfile } from '../types/index.js';
import { api } from '../services/api.js';

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 Hour

interface AuthContextType {
  user: IUser | null;
  profile: IPatientProfile | IDoctorProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  registerPatient: (data: any) => Promise<any>;
  registerDoctor: (data: any) => Promise<any>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  isSessionExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to verify if session has exceeded 1 hour
  const checkSessionValid = (): boolean => {
    const savedToken = localStorage.getItem('async_health_token');
    const loginTime = localStorage.getItem('async_health_login_time');
    if (!savedToken || !loginTime) return false;

    const elapsed = Date.now() - parseInt(loginTime, 10);
    return elapsed < SESSION_TIMEOUT_MS;
  };

  const [user, setUser] = useState<IUser | null>(() => {
    if (!checkSessionValid()) {
      localStorage.removeItem('async_health_token');
      localStorage.removeItem('async_health_user');
      localStorage.removeItem('async_health_login_time');
      return null;
    }
    const saved = localStorage.getItem('async_health_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [profile, setProfile] = useState<IPatientProfile | IDoctorProfile | null>(null);
  
  const [token, setToken] = useState<string | null>(() => {
    if (!checkSessionValid()) return null;
    return localStorage.getItem('async_health_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isSessionExpired = (): boolean => {
    return !checkSessionValid();
  };

  const logout = () => {
    localStorage.removeItem('async_health_token');
    localStorage.removeItem('async_health_user');
    localStorage.removeItem('async_health_login_time');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  // Set when a sign-in or registration just returned the user, so the follow-up /auth/me can be skipped
  const justSignedIn = useRef(false);

  const refreshUserData = async () => {
    if (justSignedIn.current) {
      justSignedIn.current = false;
      setIsLoading(false);
      return;
    }
    if (!token || isSessionExpired()) {
      logout();
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.data) {
        setUser(res.data.user);
        setProfile(res.data.profile);
        localStorage.setItem('async_health_user', JSON.stringify(res.data.user));
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Hour Auto-Logout Timer & Visibility Sync
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Check remaining time
    const loginTime = parseInt(localStorage.getItem('async_health_login_time') || '0', 10);
    const elapsed = Date.now() - loginTime;
    const remainingTime = Math.max(0, SESSION_TIMEOUT_MS - elapsed);

    if (remainingTime <= 0) {
      logout();
      setIsLoading(false);
      return;
    }

    // Set auto-logout timer for remaining time
    const timer = setTimeout(() => {
      logout();
    }, remainingTime);

    // Also check on window focus / tab resume
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isSessionExpired()) {
          logout();
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [token]);

  useEffect(() => {
    refreshUserData();
  }, [token]);

  const saveSession = (newToken: string, newUser: IUser, newProfile: any) => {
    justSignedIn.current = true;
    const now = Date.now().toString();
    localStorage.setItem('async_health_token', newToken);
    localStorage.setItem('async_health_user', JSON.stringify(newUser));
    localStorage.setItem('async_health_login_time', now);
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
  };

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    saveSession(newToken, newUser, newProfile);
    return res.data;
  };

  const registerPatient = async (data: any) => {
    const res = await api.registerPatient(data);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    saveSession(newToken, newUser, newProfile);
    return res.data;
  };

  const registerDoctor = async (data: any) => {
    const res = await api.registerDoctor(data);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    saveSession(newToken, newUser, newProfile);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        registerPatient,
        registerDoctor,
        logout,
        refreshUserData,
        isSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
