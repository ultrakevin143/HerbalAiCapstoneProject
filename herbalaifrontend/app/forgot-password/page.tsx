'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '../../lib/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data?.message || 'Password reset link has been sent to your email.');
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to request password reset. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col lg:flex-row bg-transparent font-sans">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-[#1b4332] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-serif-custom italic font-normal tracking-tight mb-4">Herbal-Ai</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Secure and accessible preservation of traditional Philippine herbal medicine.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md glass-card bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] dark:text-ink mb-2">Forgot Your Password?</h2>
          <p className="text-sm font-semibold text-[#6a7282] dark:text-muted mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div 
              role="alert" 
              className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-bold rounded-xl text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div 
              role="alert" 
              className="mb-6 p-4 border border-[#40916c] bg-[#eef5f0] text-[#2d6a4f] font-bold rounded-xl text-sm"
            >
              🎉 {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn border-[#2d6a4f] bg-[#2d6a4f] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:bg-[#1b4332] transition-colors w-full cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-sm font-bold text-[#6a7282] dark:text-muted mt-6">
            Remember your password?{' '}
            <Link href="/signin" className="text-[#2d6a4f] dark:text-[#74c69d] hover:underline font-extrabold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
