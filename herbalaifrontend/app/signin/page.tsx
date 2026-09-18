'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login(identifier, password);
      if (loggedInUser?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
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
    <main className="flex min-h-screen flex-col lg:flex-row bg-transparent font-sans">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-gradient-to-br from-[#1b4332] to-[#40916c] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-serif-custom italic font-normal tracking-tight mb-4">Herbal AI</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Preserving Filipino Herbal Medicine Heritage through Artificial Intelligence
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md glass-card bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] dark:text-ink mb-6">Log into Herbal AI</h2>
          
          {error && (
            <div 
              role="alert" 
              className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-bold rounded-xl text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="mt-6">
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

          <p className="text-center text-sm font-bold text-[#6a7282] dark:text-muted mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#2d6a4f] dark:text-[#74c69d] hover:underline font-extrabold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
