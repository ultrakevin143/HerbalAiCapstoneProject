'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import AuthBrandPanel from '../../components/AuthBrandPanel';
import { ThemeToggle } from '../../components/DisplayPreferences';
import api from '../../lib/axios';
import { requestError, responseMessage } from '../../lib/request-feedback';

type VerificationStatus = 'loading' | 'success' | 'error';

function ResendVerificationForm() {
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResending(true);
    setResendMessage(null);

    try {
      const response = await api.post('/auth/resend-email-verification', { email: email.trim() });
      setResendMessage(responseMessage(response, 'If this account is unverified, a new link has been sent.'));
    } catch (err: unknown) {
      setResendMessage(requestError(err, 'We could not send a new link right now. Please try again later.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={handleResend} className="space-y-3 text-left">
      <label htmlFor="verification-email" className="block text-sm font-semibold text-ink">
        Need a new link? Enter your email address.
      </label>
      <input
        id="verification-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full rounded-2xl border border-line bg-panel px-4 py-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={resending}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {resending ? 'Sending link...' : 'Send new link'}
      </button>
      {resendMessage && <p role="status" className="text-sm leading-relaxed text-muted">{resendMessage}</p>}
    </form>
  );
}

function VerificationLayout({ status, message }: { status: VerificationStatus; message: string }) {
  return (
    <main className="auth-shell grid min-h-svh grid-cols-1 bg-canvas font-sans lg:h-svh lg:grid-cols-[minmax(23rem,0.92fr)_minmax(32rem,1.08fr)] lg:overflow-hidden">
      <AuthBrandPanel mode="signup" />

      <div className="auth-form-pane relative flex min-w-0 items-center justify-center px-5 pb-8 pt-20 lg:h-svh lg:overflow-hidden lg:px-8 lg:pb-5 lg:pt-16">
        <ThemeToggle className="auth-theme-toggle" />
        <section className="auth-form-card glass-card text-center" aria-labelledby="verification-title">
          <h2 id="verification-title" className="mb-5 text-2xl font-extrabold text-ink lg:text-3xl">
            Verify your email
          </h2>

          {status === 'loading' && (
            <div role="status" className="flex flex-col items-center gap-4 py-3 text-accent">
              <LoaderCircle aria-hidden="true" className="h-10 w-10 animate-spin motion-reduce:animate-none" />
              <p className="text-sm text-muted">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div role="status" className="space-y-5">
              <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-accent" />
              <p className="text-sm leading-relaxed text-ink">{message}</p>
              <Link href="/signin" className="btn flex min-h-12 w-full items-center justify-center rounded-full border-brand bg-brand px-6 py-3 font-semibold text-on-brand transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                Sign in
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div role="alert" className="space-y-5">
              <CircleAlert aria-hidden="true" className="mx-auto h-12 w-12 text-error-ink" />
              <p className="text-sm leading-relaxed text-error-ink">{message}</p>
              <ResendVerificationForm />
              <Link href="/signin" className="flex min-h-12 w-full items-center justify-center rounded-full border border-line bg-panel px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                Back to sign in
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'error');
  const [message, setMessage] = useState<string>(
    token ? 'Verifying your email address...' : 'Invalid verification link. Token is missing.'
  );
  const verifyRef = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (verifyRef.current) return;
    verifyRef.current = true;

    const verifyToken = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(responseMessage(response, 'Your email address has been verified successfully!'));
      } catch (err: unknown) {
        setStatus('error');
        setMessage(requestError(err, 'Verification failed. The link may have expired or is invalid.'));
      }
    };

    verifyToken();
  }, [token]);

  return <VerificationLayout status={status} message={message} />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerificationLayout status="loading" message="Loading verification..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
