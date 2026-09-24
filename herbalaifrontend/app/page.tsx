import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HomeHero from '../components/HomeHero';
import HomeTrendingHerbs from '../components/HomeTrendingHerbs';
import HomeContributionCta from '../components/HomeContributionCta';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />
      <main className="flex-1">
        <HomeHero />
        <section className="px-6 py-16 bg-transparent">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif-custom italic font-normal text-center text-4xl md:text-5xl text-[#1b4332] dark:text-ink mb-12">
              Why Herbal-Ai?
            </h2>
            <div className="feature-grid-3 grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard icon="📚" title="Preserving Heritage">
                Digitizing traditional Philippine herbal knowledge for future generations and making it accessible worldwide.
              </FeatureCard>
              <FeatureCard icon="🤖" title="AI-Assisted">
                Get instant guidance on herbal preparation methods, dosages, and usage through our intelligent chatbot.
              </FeatureCard>
              <FeatureCard icon="🛡️" title="Verified & Safe">
                All information is reviewed by experts and cross-referenced with scientific research for your safety.
              </FeatureCard>
            </div>
          </div>
        </section>
        <HomeTrendingHerbs />
        <HomeContributionCta />
      </main>
      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card feature-card bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-8 min-h-[250px] shadow-sm hover:shadow-md transition-all">
      <div className="feature-icon-wrap flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-3xl text-white mb-5 shadow-sm">
        {icon}
      </div>
      <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] dark:text-ink mb-3">
        {title}
      </h3>
      <p className="text-sm text-[#2d6a4f] dark:text-muted leading-relaxed">
        {children}
      </p>
    </div>
  );
}
