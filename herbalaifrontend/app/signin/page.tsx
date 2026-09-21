'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import AuthBrandPanel from '../../components/AuthBrandPanel';
import { ThemeToggle } from '../../components/DisplayPreferences';

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleAuthUrl = '/api/auth/google';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login(identifier, password);
      const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
      const safeCallback = callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') && !callbackUrl.includes('\\')
        ? callbackUrl
        : null;
      router.push(safeCallback || (loggedInUser?.role === 'admin' ? '/admin' : '/'));
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Invalid email/username or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell grid min-h-svh grid-cols-1 bg-canvas font-sans lg:h-svh lg:grid-cols-[minmax(23rem,0.92fr)_minmax(32rem,1.08fr)] lg:overflow-hidden">
      <AuthBrandPanel mode="signin" />

      <div className="auth-form-pane relative flex min-w-0 items-center justify-center px-5 pb-8 pt-20 lg:h-svh lg:overflow-hidden lg:px-8 lg:pb-5 lg:pt-16">
        <ThemeToggle className="auth-theme-toggle" />
        <div className="auth-form-card glass-card">
          <p className="auth-form-eyebrow">Welcome back</p>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] dark:text-ink mb-5">Log into Herbal-Ai</h2>
          
          {error && (
            <div 
              role="alert" 
              className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-bold rounded-xl text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="identifier">
                Email or username
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                autoCapitalize="none"
                spellCheck={false}
                placeholder="Enter your email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-extrabold text-[#1b4332] dark:text-ink" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#2d6a4f] dark:text-[#74c69d] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all w-full cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          <div className="mt-5">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-line"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase">or</span>
              <div className="flex-grow border-t border-gray-200 dark:border-line"></div>
            </div>

            <a
              href={googleAuthUrl}
              className="mt-2 w-full flex items-center justify-center gap-3 border-2 border-black/10 dark:border-line bg-white/80 dark:bg-soft rounded-full px-5 py-3 text-sm font-bold text-gray-700 dark:text-ink hover:bg-gray-50 dark:hover:bg-panel transition-all shadow-xs"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </a>
          </div>

          <p className="text-center text-sm font-bold text-[#6a7282] dark:text-muted mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#2d6a4f] dark:text-[#74c69d] hover:underline font-extrabold">
              Sign up
            </Link>
          </p>
          <Link
            href="/"
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full border border-black/15 bg-white/70 px-5 py-3 text-sm font-semibold text-[#1b4332] transition-colors hover:bg-white dark:border-line dark:bg-soft dark:text-ink dark:hover:bg-panel"
          >
            Continue as guest
          </Link>
        </div>
      </div>
    </main>
  );
}
