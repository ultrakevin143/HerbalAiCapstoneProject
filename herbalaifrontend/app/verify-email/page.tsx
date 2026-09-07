'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/axios';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState<string>(
    token ? 'Verifying your email address...' : 'Invalid verification link. Token is missing.'
  );
  const verifyRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    // Prevent double invocation in development strict mode
    if (verifyRef.current) return;
    verifyRef.current = true;

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Your email address has been verified successfully!');
      } catch (err: unknown) {
        console.error(err);
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        setStatus('error');
        setMessage(
          axiosErr.response?.data?.message ||
          axiosErr.message ||
          'Verification failed. The link may have expired or is invalid.'
        );
      }
    };

    verifyToken();
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col lg:flex-row bg-[#fafaf8]">
      {/* Left side - brand */}
      <div className="flex flex-col justify-center items-center lg:items-start lg:w-1/2 p-8 lg:p-20 bg-gradient-to-br from-[#1b4332] to-[#40916c] text-[#ffffff] text-center lg:text-left border-b lg:border-b-0 lg:border-r border-green-700/20">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#ffffff] text-4xl mb-6 shadow-md">
          🌿
        </div>
        <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-4">Herbal AI</h1>
        <p className="text-lg lg:text-xl font-bold opacity-90 max-w-md">
          Traditional Filipino medicine meets modern intelligence.
        </p>
      </div>

      {/* Right side - status card */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 lg:p-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-xl text-center">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1b4332] mb-6">Email Verification</h2>

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#40916c]"></div>
              <p className="text-sm font-bold text-[#6a7282]">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 text-3xl mx-auto border-2 border-[#40916c]/30 text-[#40916c]">
                ✓
              </div>
              <p className="text-sm font-bold text-[#2d6a4f] bg-[#eef5f0] p-4 rounded-lg border-2 border-[#40916c]/20">
                🎉 {message}
              </p>
              <Link
                href="/signin"
                className="flat-button flat-button-primary w-full block text-center"
              >
                Sign In Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-3xl mx-auto border-2 border-danger/30 text-danger">
                !
              </div>
              <p className="text-sm font-bold text-danger bg-red-50 p-4 rounded-lg border-2 border-danger/20">
                {message}
              </p>
              <Link
                href="/signin"
                className="flat-button flat-button-secondary w-full block text-center"
              >
                Go Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf8]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#40916c]"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
