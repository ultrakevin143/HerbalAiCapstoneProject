import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import OptimizedFillImage from './OptimizedFillImage';
import { Button } from './ui/button';

const pitahcDirectoryUrl = 'https://pitahc.gov.ph/herbs-directory/';

export default function HomeEvidencePreview() {
  return (
    <section aria-labelledby="home-evidence-heading" className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-3 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-8">
          <h2 id="home-evidence-heading" className="max-w-[15ch] font-serif-custom text-4xl font-semibold leading-tight text-ink md:text-5xl">See the source behind the plant.</h2>
          <p className="max-w-[54ch] text-base leading-7 text-muted">A useful plant record separates what a source says from what it does not establish.</p>
        </div>

        <div className="grid overflow-hidden rounded-2xl bg-panel shadow-sm md:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
          <div className="relative min-h-56 bg-soft md:min-h-[420px]">
            <OptimizedFillImage src="/images/herbs/lagundi.jpg" alt="Lagundi leaves and flowers" sizes="(max-width: 767px) 100vw, 40vw" className="object-cover" />
            <div className="absolute bottom-4 left-4 rounded-xl bg-panel/95 px-4 py-3 text-ink shadow-sm">
              <p className="font-serif-custom text-xl font-semibold">Lagundi</p>
              <p className="text-sm italic text-muted">Vitex negundo</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <h3 className="font-serif-custom text-2xl font-semibold text-ink sm:text-3xl">What PITAHC records</h3>
            <dl className="mt-5 divide-y divide-line border-y border-line">
              <div className="py-3 sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                <dt className="text-sm font-semibold text-ink">Plant part</dt>
                <dd className="mt-1 text-sm leading-6 text-muted sm:mt-0">Fresh leaves.</dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                <dt className="text-sm font-semibold text-ink">Evidence</dt>
                <dd className="mt-1 text-sm leading-6 text-muted sm:mt-0">Clinical antitussive evidence is listed for the Philippine setting.</dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                <dt className="text-sm font-semibold text-ink">Preparation</dt>
                <dd className="mt-1 text-sm leading-6 text-muted sm:mt-0">The directory describes crushed fresh leaves boiled uncovered until the water is reduced by half.</dd>
              </div>
              <div className="py-3 sm:grid sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                <dt className="text-sm font-semibold text-ink">Safety boundary</dt>
                <dd className="mt-1 text-sm leading-6 text-muted sm:mt-0">This excerpt is not a personal dose or treatment plan. Consult a health professional for diagnosis and advice.</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-6 text-muted">Source: Philippine Institute of Traditional and Alternative Health Care, Directory of Herbs. Educational information only.</p>
            <p className="mt-1 text-sm leading-6 text-muted">Plant photo: <a className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink" href="https://www.inaturalist.org/observations/10163763">Greg III Espera</a> · <a className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild><Link href="/library?search=lagundi">Find Lagundi in the library <ArrowRight aria-hidden="true" /></Link></Button>
              <a href={pitahcDirectoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-accent underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Read the PITAHC source <ExternalLink className="h-4 w-4" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
