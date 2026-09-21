interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M32 35C25 29 24 18 32 10C40 18 39 29 32 35Z"
        fill="currentColor"
      />
      <path d="M30 31H34V46H30Z" fill="currentColor" />
      <path
        d="M32 53C24 45 16 42 6 42V31C17 31 26 36 32 44C38 36 47 31 58 31V42C48 42 40 45 32 53Z"
        fill="currentColor"
      />
      <path d="M4 29H10V35H4ZM54 29H60V35H54Z" fill="#B4E858" />
    </svg>
  );
}
