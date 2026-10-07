import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import BrandMark from './BrandMark';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Herbal Library', href: '/library' },
  { label: 'Dr. Ai', href: '/chat' },
  { label: 'Community', href: '/community' },
  { label: 'Suggest a herb', href: '/suggest' },
  { label: 'About the project', href: '/about' },
];

const referenceLinks = [
  { label: 'PITAHC', detail: 'Directory of Herbs', href: 'https://pitahc.gov.ph/herbs-directory/' },
  { label: 'TKDL Philippines', detail: 'Herbarium', href: 'https://www.tkdl.ph/library/herbarium' },
  { label: 'Kew Science', detail: 'Plants of the World Online', href: 'https://powo.science.kew.org/' },
  { label: 'StuartXchange', detail: 'Philippine plant reference', href: 'https://www.stuartxchange.org/CompleteList.html' },
];

const linkStyle = 'inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand';

export default function Footer({ showHeroPhotoCredit = false }: { showHeroPhotoCredit?: boolean }) {
  return (
    <footer className="w-full border-t border-line bg-panel text-ink">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-x-10 gap-y-9 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-[1.3fr_.8fr_1fr] lg:gap-x-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" prefetch={false} aria-label="Herbal-Ai home" className={`${linkStyle} gap-2.5 text-ink`}>
              <BrandMark className="h-10 w-10 shrink-0 text-accent" />
              <span className="text-xl font-extrabold tracking-tight">Herbal-<span className="text-accent">Ai</span></span>
            </Link>
            <p className="mt-5 max-w-xs font-editorial text-2xl font-medium leading-snug">
              Preserving Philippine<br className="hidden sm:block" /> herbal knowledge.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              Explore plants, documented preparations, and the references behind them.
            </p>
          </div>

          <nav aria-label="Footer quick links">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-ink">Quick links</h2>
            <ul>
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} prefetch={false} className={linkStyle}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Plant reference websites">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-ink">Sources &amp; references</h2>
            <ul className="space-y-1">
              {referenceLinks.map(({ label, detail, href }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={`${linkStyle} group w-full gap-3 py-2`}>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{label}</span>
                      <span className="mt-0.5 block text-xs leading-5">{detail}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-muted group-hover:text-ink" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-t border-line py-5 sm:py-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="text-xs leading-5 text-muted">© {new Date().getFullYear()} Herbal-Ai · Philippine Medicinal Plant Repository</p>
            <nav aria-label="Footer information" className="flex flex-wrap gap-x-6">
              <Link href="/sources" prefetch={false} className={linkStyle}>Sources &amp; methodology</Link>
              <Link href="/privacy" prefetch={false} className={linkStyle}>Privacy policy</Link>
            </nav>
          </div>
          <p className="mt-3 max-w-3xl text-xs leading-6 text-muted">
            Educational information only, not medical advice. References to DOH, PITAHC, and other sources do not imply institutional endorsement.
            {' '}See each plant&apos;s references for the statements they support.
          </p>
          {showHeroPhotoCredit && (
            <p className="mt-3 text-xs leading-6 text-muted">
              Mount Isarog photo by <a className={linkStyle} href="https://commons.wikimedia.org/wiki/File:A_mossy_path_at_Mount_Isarog_National_Park_-_Tigaon.jpg">Irvin Parco Sto. Tomas</a> · <a className={linkStyle} href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · resized
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
