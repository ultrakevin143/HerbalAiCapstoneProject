'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';

export default function GoogleSuccessPage() {
  const { checkSession, isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const verifyAndRedirect = async () => {
      try {
        await checkSession();
      } catch (err) {
        console.error('Session check failed during Google login success verification:', err);
        setError('Failed to verify session. Please try signing in again.');
      }
    };

    verifyAndRedirect();
  }, [checkSession]);

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        if (user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else if (initialized.current) {
        setError('Failed to retrieve user profile. Please try again.');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-2xl border-4 border-forest bg-surface-2 p-8 shadow-[8px_8px_0px_0px_rgba(27,67,50,1)]">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-extrabold text-forest">Authentication Error</h1>
          <p className="mb-6 font-semibold text-danger">{error}</p>
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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border-4 border-forest bg-surface p-8 shadow-[8px_8px_0px_0px_rgba(27,67,50,1)]">
        <div className="mb-6 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-forest border-t-accent"></div>
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-forest animate-pulse">Completing Google Login</h1>
        <p className="font-semibold text-primary">Verifying secure credentials and setting up your workspace...</p>
      </div>
    </div>
  );
}
