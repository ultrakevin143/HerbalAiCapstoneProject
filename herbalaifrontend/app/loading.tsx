import BrandMark from '../components/BrandMark';

export default function Loading() {
  return (
    <main className="route-loading-page" aria-busy="true" aria-labelledby="route-loading-title">
      <header className="route-loading-header">
        <div className="route-loading-brand">
          <BrandMark className="h-9 w-9" />
          <span>Herbal-Ai</span>
        </div>
        <div className="route-loading-nav" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </header>

      <section className="route-loading-content" role="status">
        <div className="route-loading-copy">
          <div className="route-loading-line short" />
          <div className="route-loading-line title" />
          <div className="route-loading-line" />
          <div className="route-loading-line medium" />
          <h1 id="route-loading-title" className="sr-only">Loading Herbal-Ai content</h1>
          <p>Preparing verified plant information…</p>
        </div>
        <div className="route-loading-panel" aria-hidden="true">
          <div className="route-loading-leaf" />
          <div className="route-loading-line medium" />
          <div className="route-loading-line" />
          <div className="route-loading-line short" />
        </div>
      </section>
    </main>
  );
}
