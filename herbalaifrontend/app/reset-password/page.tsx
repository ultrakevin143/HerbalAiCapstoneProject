'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';
import { requestError, responseMessage } from '../../lib/request-feedback';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(token ? null : 'Invalid reset link. Token is missing.');
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tokenRejected = error === 'Invalid or expired password reset token.';

  useEffect(() => {
    if (!success) return;

    const redirectTimeout = window.setTimeout(() => {
      router.replace('/signin');
    }, 3000);

    return () => window.clearTimeout(redirectTimeout);
  }, [router, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success || tokenRejected) return;
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

    if (new TextEncoder().encode(password).length > 72) {
      setError('Password must be at most 72 UTF-8 bytes.');
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

      setPassword('');
      setConfirmPassword('');
      setSuccess(responseMessage(response, 'Password has been reset successfully!'));
    } catch (err: unknown) {
      setPassword('');
      setConfirmPassword('');
      setError(requestError(err, 'Failed to reset password. The link may have expired or is invalid.'));
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
          Create or reset your Herbal-Ai password to sign in to your account.
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md glass-card bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 lg:p-8 shadow-xl">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] dark:text-ink mb-2">Set Your Herbal-Ai Password</h2>
          <p className="text-sm font-semibold text-[#6a7282] dark:text-muted mb-2">
            Use at least 8 characters. Saving your password signs you out on all devices.
          </p>
          <p className="text-sm font-semibold text-[#6a7282] dark:text-muted mb-6">
            This password is only for Herbal-Ai. It does not change your Google password. If Google is linked to your account, you can still sign in with Google.
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
              🎉 {success} Redirecting to sign in page...
            </div>
          )}

          {!success && !tokenRejected && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="password">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={!token || loading}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={!token || loading}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                />
              </div>

              <button
                type="submit"
                disabled={!token || loading}
                className="btn border-[#2d6a4f] bg-[#2d6a4f] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:bg-[#1b4332] transition-colors w-full cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? 'Saving Password...' : 'Save Herbal-Ai Password'}
              </button>
            </form>
          )}

          {tokenRejected && (
            <Link href="/forgot-password" replace className="btn border-[#2d6a4f] bg-[#2d6a4f] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:bg-[#1b4332] transition-colors w-full">
              Request a New Reset Link
            </Link>
          )}

          <p className="text-center text-sm font-bold text-[#6a7282] dark:text-muted mt-6">
            <Link href="/signin" replace className="text-[#2d6a4f] dark:text-[#74c69d] hover:underline font-extrabold">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-transparent"></div>
          <p className="text-ink font-extrabold animate-pulse font-sans">Loading password form...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
