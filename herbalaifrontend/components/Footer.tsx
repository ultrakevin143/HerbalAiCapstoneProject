import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-black/10 dark:border-line bg-gray-50/80 dark:bg-canvas py-6 px-4">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#40916c] text-[#ffffff] text-sm font-bold shadow-sm">
            🌿
          </div>
          <span className="font-serif-custom italic font-extrabold text-[#1b4332] dark:text-ink">
            Help us Preserve our History
          </span>
        </div>

        {/* copyright and legal */}
        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-[#2d6a4f] dark:text-muted mb-1">
            © {new Date().getFullYear()} Herbal-Ai — Philippine Medicinal Plant Repository.
          </p>
          <p className="text-[10px] font-bold text-[#6a7282] dark:text-muted">
            Uses publicly available DOH and PITAHC reference materials; not an institutional endorsement.
          </p>
        </div>
      </div>
    </footer>
  );
}
