import BrandMark from './BrandMark';

interface AuthBrandPanelProps {
  mode: 'signin' | 'signup';
}

export default function AuthBrandPanel({ mode }: AuthBrandPanelProps) {
  return (
    <section className="auth-brand-panel" aria-label="About Herbal-Ai">
      <div className="auth-brand-watermark" aria-hidden="true"><BrandMark /></div>
      <div className="auth-brand-content">
        <BrandMark className="auth-brand-mark" />
        <p className="auth-brand-kicker">Philippine herbal knowledge</p>
        <h1>Herbal-Ai</h1>
        <p className="auth-brand-lead">
          {mode === 'signin'
            ? 'Traditional plant knowledge, organized for clearer and safer learning.'
            : 'Help preserve local medicinal-plant knowledge in a careful digital library.'}
        </p>
        <div className="auth-brand-rule" aria-hidden="true"><span /></div>
        <ul className="auth-brand-points">
          <li>Reviewed plant records</li>
          <li>Preparation and safety notes</li>
          <li>Philippine-focused references</li>
        </ul>
      </div>
      <p className="auth-brand-footnote">Educational information only — not a substitute for medical advice.</p>
    </section>
  );
}
