'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(token ? null : 'Invalid reset link. Token is missing.');
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Invalid reset link. Token is missing.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
      });

      setSuccess(response.data.message || 'Password has been reset successfully!');
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        axiosErr.response?.data?.message ||
        axiosErr.message ||
        'Failed to reset password. The link may have expired or is invalid.'
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
          Create a new secure password to access your contributor panel.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] mb-6">Reset Password</h2>

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
              🎉 {success} Redirecting to sign in page...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="password">
                New Password
              </label>
              <input
                id="password"
                type="password"
                required
                disabled={!token || loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flat-input"
              />
            </div>

            <div>
              <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                disabled={!token || loading}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flat-input"
              />
            </div>

            <button
              type="submit"
              disabled={!token || loading}
              className="flat-button flat-button-primary w-full mt-2"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm font-bold text-[#6a7282]">
            Cancel and{' '}
            <Link href="/signin" className="text-[#2d6a4f] hover:underline font-extrabold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf8]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#40916c]"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
