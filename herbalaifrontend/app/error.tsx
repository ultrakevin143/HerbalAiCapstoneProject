'use client';

import Link from 'next/link';
import { Home, RefreshCw } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import DrAiAvatar from '../components/DrAiAvatar';

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="system-state-page">
      <Link href="/" className="system-state-brand" aria-label="Herbal-Ai home">
        <BrandMark className="h-9 w-9" />
        <span>Herbal-Ai</span>
      </Link>

      <section className="system-state-card" aria-labelledby="error-title">
        <DrAiAvatar className="system-state-avatar" />
        <p className="system-state-kicker">Unable to load this page</p>
        <h1 id="error-title">The connection was interrupted.</h1>
        <p>
          Your account and saved records have not been changed. Try loading the page again, or return home and continue from there.
        </p>
        <div className="system-state-actions">
          <button type="button" onClick={() => retry()}>
            <RefreshCw aria-hidden="true" size={17} />
            Try again
          </button>
          <Link href="/" className="secondary">
            <Home aria-hidden="true" size={17} />
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
