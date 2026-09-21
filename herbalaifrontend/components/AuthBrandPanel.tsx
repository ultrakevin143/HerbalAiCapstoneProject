import BrandMark from './BrandMark';

interface AuthBrandPanelProps {
  mode: 'signin' | 'signup';
}

export default function AuthBrandPanel({ mode }: AuthBrandPanelProps) {
  return (
    <section className="auth-brand-panel relative isolate flex min-h-0 flex-col justify-between gap-5 overflow-hidden bg-[#1f4a36] px-6 py-7 text-[#f5f2eb] sm:min-h-72 sm:px-10 sm:py-10 lg:min-h-0 lg:px-16 lg:py-14" aria-label="About Herbal-Ai">
      <div className="auth-brand-watermark hidden lg:block" aria-hidden="true"><BrandMark /></div>
      <div className="auth-brand-content relative z-10 max-w-xl">
        <BrandMark className="auth-brand-mark mb-3 h-12 w-12 text-[#d8f06b] sm:mb-5 sm:h-16 sm:w-16 lg:h-20 lg:w-20" />
        <p className="auth-brand-kicker">Philippine herbal knowledge</p>
        <h1 className="font-serif-custom text-4xl italic leading-none sm:text-5xl lg:text-7xl">Herbal-Ai</h1>
        <p className="auth-brand-lead mt-3 max-w-lg text-sm leading-relaxed text-[#f5f2eb]/85 sm:text-base">
          {mode === 'signin'
            ? 'Traditional plant knowledge, organized for clearer and safer learning.'
            : 'Help preserve local medicinal-plant knowledge in a careful digital library.'}
        </p>
        <div className="auth-brand-rule hidden sm:flex" aria-hidden="true"><span /></div>
        <ul className="auth-brand-points hidden sm:grid">
          <li>Reviewed plant records</li>
          <li>Preparation and safety notes</li>
          <li>Philippine-focused references</li>
        </ul>
      </div>
      <p className="auth-brand-footnote relative z-10 hidden text-xs text-[#f5f2eb]/60 sm:block">Educational information only — not a substitute for medical advice.</p>
    </section>
  );
}
