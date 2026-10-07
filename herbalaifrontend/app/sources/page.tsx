import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Sources & Methodology | Herbal-Ai',
  description: 'Where to find plant references and how Herbal-Ai distinguishes plant identity, traditional use, research, and safety.',
};

const linkStyle = 'inline-flex min-h-11 items-center text-ink underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand';

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <header className="border-b border-line pb-8 sm:pb-10">
          <h1 className="font-editorial text-4xl font-semibold leading-tight sm:text-6xl">Sources &amp; methodology</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            Herbal-Ai is an educational plant repository. A reference can support a particular statement without proving that a plant is effective or safe as a treatment.
          </p>
        </header>
        <div className="divide-y divide-line">
          <section className="grid gap-4 py-8 sm:grid-cols-[13rem_1fr] sm:gap-8 sm:py-10">
            <h2 className="font-editorial text-2xl font-semibold leading-snug">References for each plant</h2>
            <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
              <p>Open a plant in the Library, then expand Sources &amp; references. Attached references identify the statements they support, such as recorded uses, preparation, warnings, or study limitations. If no references are attached, the panel says so.</p>
              <Link href="/library" className={linkStyle}>Open the Library</Link>
              <p>The footer is a guide to these references, not a replacement for the sources attached to an individual plant.</p>
            </div>
          </section>
          <section className="grid gap-4 py-8 sm:grid-cols-[13rem_1fr] sm:gap-8 sm:py-10">
            <h2 className="font-editorial text-2xl font-semibold leading-snug">Identity and evidence</h2>
            <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
              <p>Common names can refer to different species. Scientific names and historical synonyms need to be checked before adding a record. Botanical references establish identity; they do not establish medical effectiveness.</p>
              <a href="https://powo.science.kew.org/" className={linkStyle}>Plants of the World Online — Royal Botanic Gardens, Kew</a>
              <p>Recorded traditional use, laboratory or animal findings, and human clinical evidence are different kinds of evidence. Traditional use is not proof of clinical efficacy; a laboratory or animal result does not establish a safe human dose.</p>
              <p>References do not imply endorsement by their authors, publishers, DOH, or PITAHC. Do not use this repository as a substitute for medical advice.</p>
            </div>
          </section>
          <section className="grid gap-4 py-8 sm:grid-cols-[13rem_1fr] sm:gap-8 sm:py-10">
            <h2 className="font-editorial text-2xl font-semibold leading-snug">Historical research</h2>
            <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
              <p>The Medicinal Plants of the Philippines by T. H. Pardo de Tavera, translated and revised by Jerome B. Thomas, Jr. (1901), is being used to identify candidates for further research. Its historical names, claims, preparations, and doses are not current treatment recommendations.</p>
              <a href="https://www.gutenberg.org/files/26393/26393-h/26393-h.htm" className={linkStyle}>Read the historical book on Project Gutenberg</a>
              <p>A book entry alone does not clear a plant for publication. Candidate additions still need identity, duplicate, evidence, safety, and image checks.</p>
            </div>
          </section>
          <section className="grid gap-4 py-8 sm:grid-cols-[13rem_1fr] sm:gap-8 sm:py-10">
            <h2 className="font-editorial text-2xl font-semibold leading-snug">Images and limitations</h2>
            <div className="space-y-4 text-sm leading-7 text-muted sm:text-base">
              <p>An image is a visual reference, not a reliable way to identify a plant for ingestion. Similar-looking species and different plant parts can have different risks.</p>
              <p>New expansion photos must have verified reuse permission and be checked against the intended species. Photo source and licence records are retained with the review documentation. Existing images retain any required attribution.</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
