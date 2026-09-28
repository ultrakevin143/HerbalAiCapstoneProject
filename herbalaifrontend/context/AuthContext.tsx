'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/axios';
import { cachedApiGet, invalidateApiGetCache } from '../lib/request-cache';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  joined: string;
  isBanned?: boolean;
}

type SignupData = { name: string; username: string; email: string; password: string };
type SignupResult = { message: string; verificationRequired: boolean; verificationEmailSent: boolean };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionUnavailable: boolean;
  login: (identifier: string, password: string) => Promise<User | null>;
  signup: (data: SignupData) => Promise<SignupResult>;
  logout: () => Promise<void>;
  checkSession: (force?: boolean) => Promise<User | null>;
  updateProfile: (data: { name?: string; avatar?: string | null }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const sessionRevision = useRef(0);
  const router = useRouter();

  const checkSession = async (force: boolean = false): Promise<User | null> => {
    const revision = ++sessionRevision.current;
    setLoading(true);
    try {
      const response = await cachedApiGet('/auth/me', 2_000, force);
      if (revision !== sessionRevision.current) return null;
      if (response.data?.status === 'success' && response.data?.data?.user) {
        const userObj = response.data.data.user;
        setUser(userObj);
        setSessionUnavailable(false);
        return userObj;
      } else {
        setUser(null);
        setSessionUnavailable(false);
        return null;
      }
    } catch (error) {
      if (revision !== sessionRevision.current) return null;
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 403) {
        invalidateApiGetCache();
        setUser(null);
        setSessionUnavailable(false);
      } else {
        setSessionUnavailable(true);
      }
      return null;
    } finally {
      if (revision === sessionRevision.current) setLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<User | null> => {
    sessionRevision.current += 1;
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { identifier: identifier.trim(), password });
      const loggedInUser = response.data?.data?.user as User | undefined;
      if (!loggedInUser) throw new Error('Login succeeded without a user profile.');
      setUser(loggedInUser);
      setSessionUnavailable(false);
      invalidateApiGetCache();
      return loggedInUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<SignupResult> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', data);
      return {
        message: response.data?.message || 'Account created. Please check your email to verify it.',
        verificationRequired: response.data?.data?.verificationRequired !== false,
        verificationEmailSent: response.data?.data?.verificationEmailSent !== false,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    sessionRevision.current += 1;
    setLoading(true);
    try {
      await api.post('/auth/logout');
      setUser(null);
      setSessionUnavailable(false);
      invalidateApiGetCache();
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string | null }): Promise<User> => {
    const response = await api.patch('/auth/me', data);
    const updatedUser = response.data.data.user as User;
    invalidateApiGetCache('/auth/me');
    setUser(updatedUser);
    return updatedUser;
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSession();

    const handleAuthLogout = () => {
      sessionRevision.current += 1;
      invalidateApiGetCache();
      setUser(null);
      setSessionUnavailable(false);
      router.push('/signin');
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        sessionUnavailable,
        login,
        signup,
        logout,
        checkSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
