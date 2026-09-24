'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DisplayPreferences from '../../components/DisplayPreferences';
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
    <main className="flex min-h-screen flex-col lg:flex-row bg-canvas">
      {/* Left side: Archival Ethnobotanical Masthead */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-16 lg:w-1/2 bg-[#19261c] text-[#f5f2eb] border-b lg:border-b-0 lg:border-r border-[#2d3d31]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded px-2.5 py-1 border border-[#3b4e40] bg-[#223326] text-[11px] font-mono uppercase tracking-widest text-[#c46238]">
            <span>Accession Verification</span>
            <span className="text-[#88998c]">·</span>
            <span className="text-[#ede8df]">Electronic Dispatch</span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-editorial text-[#f5f2eb]">
              HERBAL<span className="text-[#c46238] ml-1">·AI</span>
            </h1>
            <p className="mt-3 text-sm text-[#c4ceb7] max-w-md leading-relaxed">
              Cryptographic verification of ethnobotanical research identities in accordance with RA 8423 archive protocols.
            </p>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-[#2e4033] flex items-center justify-between text-[11px] font-mono text-[#88998c]">
          <span>Security Standard · RA 8423 Archive</span>
          <span>Verification Dispatch</span>
        </div>
      </div>

      {/* Right side: status card */}
      <div className="flex flex-col justify-center items-center lg:w-1/2 p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-panel border border-line rounded-lg p-6 sm:p-8 shadow-sm text-center">
          <div className="flex items-center justify-between border-b border-line pb-3 mb-6">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Dispatch Confirmation
            </span>
            <DisplayPreferences />
          </div>

          <h2 className="text-2xl font-extrabold font-editorial text-ink mb-2">
            Email Verification
          </h2>

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent"></div>
              <p className="text-xs font-mono text-muted">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-soft text-brand mx-auto border border-line font-bold font-mono">
                ✓
              </div>
              <p className="text-xs font-medium text-ink bg-soft p-3.5 rounded border border-line">
                {message}
              </p>
              <Link
                href="/signin"
                className="flat-button flat-button-primary w-full block text-center !text-sm mt-4"
              >
                Sign In to Registry
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-surface text-danger mx-auto border border-error-ink/30 font-mono font-bold">
                !
              </div>
              <p className="text-xs font-medium text-error-ink bg-error-surface p-3.5 rounded border border-error-ink/20">
                {message}
              </p>
              <Link
                href="/signin"
                className="flat-button flat-button-secondary w-full block text-center !text-sm mt-4"
              >
                Return to Authentication
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
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-12 w-12 animate-pulse rounded-full bg-soft" aria-hidden="true"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
