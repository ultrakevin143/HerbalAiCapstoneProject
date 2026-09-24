'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import DrAiAvatar from '../../../../components/DrAiAvatar';

export default function GoogleSuccessPage() {
  const { checkSession } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const verifyAndRedirect = async () => {
      try {
        const verifiedUser = await checkSession(true);
        if (!verifiedUser) {
          setError('Failed to retrieve your session. Please try signing in again.');
          return;
        }
        router.replace(verifiedUser.role === 'admin' ? '/admin' : '/');
      } catch (err) {
        console.error('Session check failed during Google login success verification:', err);
        setError('Failed to verify session. Please try signing in again.');
      }
    };

    verifyAndRedirect();
  }, [checkSession, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-2xl border-4 border-forest bg-surface-2 p-8 shadow-[8px_8px_0px_0px_rgba(27,67,50,1)]">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-extrabold text-forest">Authentication Error</h1>
          <p className="mb-6 font-semibold text-error-ink">{error}</p>
          <button
            onClick={() => router.push('/signin')}
            className="flat-button flat-button-primary w-full"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center" role="status" aria-live="polite">
      <DrAiAvatar className="h-20 w-20" animated />
      <p className="text-base font-medium text-ink">Signing you in...</p>
    </div>
  );
}
