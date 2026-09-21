interface DrAiAvatarProps {
  className?: string;
  animated?: boolean;
}

export default function DrAiAvatar({ className = '', animated = false }: DrAiAvatarProps) {
  return (
    <span
      className={`dr-ai-mascot ${animated ? 'dr-ai-mascot-animated' : ''} ${className}`}
      role="img"
      aria-label="Dr. Ai botanical assistant"
    >
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.12" />
        <path d="M32 8C43 17 44 32 32 43C20 32 21 17 32 8Z" fill="currentColor" />
        <path d="M32 16V46" stroke="var(--ui-panel)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 48C25 43 29 42 32 46C35 42 39 43 44 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="27" cy="28" r="4.5" fill="var(--ui-panel)" stroke="#b4e858" strokeWidth="2" />
        <circle cx="37" cy="28" r="4.5" fill="var(--ui-panel)" stroke="#b4e858" strokeWidth="2" />
        <path d="M31.5 28H32.5M23 27L20 25M41 27L44 25" stroke="#b4e858" strokeWidth="2" strokeLinecap="round" />
        <circle cx="27" cy="28" r="1.25" fill="currentColor" />
        <circle cx="37" cy="28" r="1.25" fill="currentColor" />
        <path d="M28 35C30.5 37 33.5 37 36 35" stroke="var(--ui-panel)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
