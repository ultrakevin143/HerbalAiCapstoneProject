'use client';

import CreditsWallet from './CreditsWallet';
import { useAuth } from '../context/AuthContext';

export default function DrAiCreditsStatus({ revision }: { revision: number }) {
  const { user } = useAuth();
  return <CreditsWallet key={user?.id ?? 'signed-out'} embedded revision={revision} />;
}
