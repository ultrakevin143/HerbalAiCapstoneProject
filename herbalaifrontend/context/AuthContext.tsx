'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/axios';

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
  login: (email: string, password: string) => Promise<User | null>;
  signup: (data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkSession = async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.status === 'success' && response.data?.data?.user) {
        const userObj = response.data.data.user;
        setUser(userObj);
        return userObj;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      const loggedInUser = await checkSession();
      return loggedInUser;
    } catch (error) {
      setLoading(false);
      throw error;
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
      setUser(null);
      setLoading(false);
      router.push('/signin');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSession();

    const handleAuthLogout = () => {
      setUser(null);
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
        login,
        signup,
        logout,
        checkSession,
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
