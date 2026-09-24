import React from 'react';

export default function Footer({ showHeroPhotoCredit = false }: { showHeroPhotoCredit?: boolean }) {
  return (
    <footer className="w-full border-t border-line bg-panel py-6 px-4">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding & Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white text-sm font-bold shadow-sm">
            🌿
          </div>
          <span className="font-serif-custom italic font-extrabold text-ink">
            Help us Preserve our History
          </span>
        </div>

        {/* copyright and legal */}
        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-ink mb-1">
            © {new Date().getFullYear()} Herbal-Ai — Philippine Medicinal Plant Repository.
          </p>
          <p className="text-xs font-medium text-muted">
            Uses publicly available DOH and PITAHC reference materials; not an institutional endorsement.
          </p>
          {showHeroPhotoCredit && (
            <p className="mt-1 text-sm text-muted">
              Mount Isarog photo by <a className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink" href="https://commons.wikimedia.org/wiki/File:A_mossy_path_at_Mount_Isarog_National_Park_-_Tigaon.jpg">Irvin Parco Sto. Tomas</a> · <a className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · resized
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
