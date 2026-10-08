'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import SessionUnavailable from '../../components/SessionUnavailable';
import CreditsWallet from '../../components/CreditsWallet';

export default function CreditsPage() {
  const { user, isAuthenticated, loading, sessionUnavailable, checkSession } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated && !sessionUnavailable) router.replace('/signin?callbackUrl=/credits');
  }, [loading, isAuthenticated, sessionUnavailable, router]);
  if (sessionUnavailable) return <SessionUnavailable retry={checkSession} />;
  return <div className="operational-page min-h-screen"><Navbar /><main className="mx-auto max-w-xl space-y-6 px-4 py-10">
    <Link href="/chat" className="text-sm text-accent underline underline-offset-4">Back to Dr. Ai</Link>
    <CreditsWallet key={user?.id ?? 'signed-out'} />
  </main><Footer /></div>;
}
