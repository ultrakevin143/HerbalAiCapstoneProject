import Link from 'next/link';
import { ArrowRight, Bot, BookOpen, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeHero from '../components/HomeHero';
import HomeEvidencePreview from '../components/HomeEvidencePreview';
import HomeTrendingHerbs from '../components/HomeTrendingHerbs';
import HomeContributionCta from '../components/HomeContributionCta';
import { Button } from '../components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-transparent">
      <Navbar />
      <main>
        <HomeHero />
        <HomeEvidencePreview />

        <section className="px-6 py-12 lg:py-14">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 font-serif-custom text-4xl font-semibold text-ink md:text-5xl">Why Herbal-Ai?</h2>
            <div className="grid gap-5 border-y border-line py-6 md:grid-cols-3 md:gap-8">
              <FeatureCard icon={<BookOpen />} title="Preserving Heritage">Digitizing traditional Philippine herbal knowledge for future generations and making it accessible worldwide.</FeatureCard>
              <FeatureCard icon={<Bot />} title="Source-Grounded Assistant">Ask questions about preparation, dosage records, and safety notes connected to the herbal library.</FeatureCard>
              <FeatureCard icon={<ShieldCheck />} title="Evidence Made Visible">See official listings, source records, and safety boundaries without treating education as medical advice.</FeatureCard>
            </div>
          </div>
        </section>

        <HomeTrendingHerbs />

        <section className="px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-[#315f4b] bg-[#1d4b39] text-white shadow-sm lg:grid-cols-[.8fr_1.2fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <Bot className="h-8 w-8 text-[#9bd2ae]" aria-hidden="true" />
              <h2 className="mt-6 max-w-[12ch] font-serif-custom text-4xl font-semibold leading-[1.02] tracking-[-.035em] sm:text-5xl">Ask questions grounded in the herbal library.</h2>
              <p className="mt-5 max-w-[50ch] leading-7 text-white/75">Dr. Ai can respond in the Philippine language or dialect used in your question while preserving source wording, quantities, and safety limits.</p>
              <Button asChild size="lg" variant="outline" className="mt-7 border-white bg-white text-[#1e2922] hover:bg-[#e3efe4]"><Link href="/chat">Open Dr. Ai <ArrowRight className="h-4 w-4" /></Link></Button>
            </div>
            <div className="grid content-center gap-3 border-t border-white/15 bg-white/[.035] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              {['Unsa ang documented preparation sa lagundi?', 'Ano ang safety warnings ng sambong?', 'What evidence is available for bayabas leaves?'].map((question) => (
                <Link key={question} href={`/chat?q=${encodeURIComponent(question)}`} className="home-question-link group flex items-center justify-between gap-4 rounded-xl border border-white/20 px-5 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:text-base"><span>{question}</span><ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1" /></Link>
              ))}
              <p className="mt-3 text-sm leading-6 text-white/65">Educational information only. Dr. Ai does not diagnose, prescribe, or replace licensed medical care.</p>
            </div>
          </div>
        </section>

        <HomeContributionCta />
      </main>
      <Footer showHeroPhotoCredit />
    </div>
  );
}

function FeatureCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white [&>svg]:h-5 [&>svg]:w-5">{icon}</div><div><h3 className="mb-2 text-lg font-bold text-ink">{title}</h3><p className="text-base leading-7 text-muted">{children}</p></div></div>;
}
