'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  bio: string | null;
  joined: string;
  isBanned?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionUnavailable: boolean;
  login: (identifier: string, password: string) => Promise<User | null>;
  signup: (data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: (force?: boolean) => Promise<User | null>;
  updateProfile: (data: { name?: string; avatar?: string | null; bio?: string | null }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const router = useRouter();

  const checkSession = async (force: boolean = false): Promise<User | null> => {
    if (!force && typeof window !== 'undefined' && !localStorage.getItem('herbalai_has_session')) {
      setUser(null);
      setSessionUnavailable(false);
      setLoading(false);
      return null;
    }

    try {
      const response = await cachedApiGet('/auth/me', 2_000);
      if (response.data?.status === 'success' && response.data?.data?.user) {
        const userObj = response.data.data.user;
        setUser(userObj);
        setSessionUnavailable(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('herbalai_has_session', '1');
        }
        return userObj;
      } else {
        setUser(null);
        setSessionUnavailable(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('herbalai_has_session');
        }
        return null;
      }
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 403) {
        setUser(null);
        setSessionUnavailable(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('herbalai_has_session');
        }
      } else {
        setSessionUnavailable(true);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { identifier: identifier.trim(), password });
      const loggedInUser = response.data?.data?.user as User | undefined;
      if (!loggedInUser) throw new Error('Login succeeded without a user profile.');
      setUser(loggedInUser);
      setSessionUnavailable(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('herbalai_has_session', '1');
      }
      invalidateApiGetCache('/auth/me');
      return loggedInUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    setLoading(true);
    try {
      await api.post('/auth/signup', data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('herbalai_has_session');
      }
      setUser(null);
      setSessionUnavailable(false);
      invalidateApiGetCache();
      setLoading(false);
      router.push('/signin');
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string | null; bio?: string | null }): Promise<User> => {
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('herbalai_has_session');
      }
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
