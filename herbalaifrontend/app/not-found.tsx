import Link from 'next/link';
import DrAiAvatar from '../components/DrAiAvatar';
import BrandMark from '../components/BrandMark';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <Link href="/" className="not-found-brand" aria-label="Herbal-Ai home">
        <BrandMark className="h-9 w-9" />
        <span>Herbal-Ai</span>
      </Link>
      <section className="not-found-card">
        <div className="not-found-code" aria-hidden="true">404</div>
        <DrAiAvatar animated className="not-found-avatar" />
        <p className="not-found-kicker">Page not found</p>
        <h1>This path has no plant record.</h1>
        <p>The page may have moved, or the address may be incomplete. Dr. Ai can guide you back to the verified library.</p>
        <div className="not-found-actions">
          <Link href="/">Return home</Link>
          <Link href="/library" className="secondary">Open herbal library</Link>
        </div>
      </section>
    </main>
  );
}
