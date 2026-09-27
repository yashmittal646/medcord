import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser, IPatientProfile, IDoctorProfile } from '../types/index.js';
import { api } from '../services/api.js';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const saved = localStorage.getItem('async_health_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<IPatientProfile | IDoctorProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('async_health_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = async () => {
    if (!token) {
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

  useEffect(() => {
    refreshUserData();
  }, [token]);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    localStorage.setItem('async_health_token', newToken);
    localStorage.setItem('async_health_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    return res.data;
  };

  const registerPatient = async (data: any) => {
    const res = await api.registerPatient(data);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    localStorage.setItem('async_health_token', newToken);
    localStorage.setItem('async_health_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    return res.data;
  };

  const registerDoctor = async (data: any) => {
    const res = await api.registerDoctor(data);
    const { token: newToken, user: newUser, profile: newProfile } = res.data;
    localStorage.setItem('async_health_token', newToken);
    localStorage.setItem('async_health_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('async_health_token');
    localStorage.removeItem('async_health_user');
    setToken(null);
    setUser(null);
    setProfile(null);
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
