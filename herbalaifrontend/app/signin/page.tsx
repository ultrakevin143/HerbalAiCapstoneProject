'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Invalid email or password. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-[#fafaf8]">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-gradient-to-br from-[#1b4332] to-[#40916c] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">Herbal AI</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Preserving Filipino Herbal Medicine Heritage through Artificial Intelligence
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] mb-6">Log into Herbal AI</h2>
          
          {error && (
            <div 
              role="alert" 
              className="mb-6 p-4 border-2 border-danger bg-red-50 text-danger font-bold rounded-lg text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flat-input"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-extrabold text-[#1b4332]" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#40916c] hover:underline">
                  Forgot Password?
                </Link>

              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flat-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flat-button flat-button-primary w-full mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleLogin}
            className="flat-button flat-button-secondary w-full mt-4 flex items-center justify-center gap-3"
          >
            <span className="font-extrabold text-sm border-2 border-[#2d6a4f] rounded px-1.5 py-0.5 bg-[#fafaf8]">G</span>
            Sign in with Google
          </button>

          <Link
            href="/"
            className="flat-button flat-button-secondary w-full mt-4 flex items-center justify-center"
          >
            View Guest Homepage
          </Link>

          <p className="text-center mt-6 text-sm font-bold text-[#6a7282]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#40916c] hover:underline font-extrabold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
