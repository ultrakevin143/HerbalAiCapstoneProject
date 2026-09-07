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
    <main className="flex min-h-screen flex-col lg:flex-row bg-[#fafaf8]">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-gradient-to-br from-[#1b4332] to-[#40916c] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">Herbal AI</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Secure and accessible preservation of traditional Philippine herbal medicine.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] mb-2">Forgot Password?</h2>
          <p className="text-sm font-bold text-[#6a7282] mb-6">
            Enter your email address below and we will send you a link to reset your password.
          </p>

          {error && (
            <div 
              role="alert" 
              className="mb-6 p-4 border-2 border-danger bg-red-50 text-danger font-bold rounded-lg text-sm"
            >
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div 
              role="alert" 
              className="mb-6 p-4 border-2 border-[#40916c] bg-[#eef5f0] text-[#2d6a4f] font-bold rounded-lg text-sm"
            >
              🎉 {success}
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

            <button
              type="submit"
              disabled={loading}
              className="flat-button flat-button-primary w-full mt-2"
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm font-bold text-[#6a7282]">
            Remember your password?{' '}
            <Link href="/signin" className="text-[#2d6a4f] hover:underline font-extrabold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
