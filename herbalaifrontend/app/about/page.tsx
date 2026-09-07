'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  Leaf,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import OptimizedFillImage from '../../components/OptimizedFillImage';

interface PitahcHerb {
  id: string;
  name: string;
  scientificName: string;
  englishName: string;
  indications: string[];
  preparation: string;
  scientificFact: string;
  image: string;
}

export default function AboutPage() {
  const pitahcHerbs: PitahcHerb[] = [
    {
      id: 'lagundi',
      name: 'Lagundi',
      scientificName: 'Vitex negundo',
      englishName: 'Five-leaved Chaste Tree',
      indications: ['Cough relief', 'Asthma management', 'Cold & Flu symptoms', 'Fever relief'],
      preparation: 'Boil 1/2 cup of chopped dry leaves (or 1 cup of fresh leaves) in 2 cups of water for 15 minutes. Strain and drink 1/3 cup three times a day.',
      scientificFact: 'Lagundi contains chrysoplenol D, a substance with anti-histaminic and muscle relaxant properties, making it highly effective against respiratory conditions.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555318/herbal_ai_herbs/lagundi_doh.jpg',
    },
    {
      id: 'sambong',
      name: 'Sambong',
      scientificName: 'Blumea balsamifera',
      englishName: 'Ngai Camphor',
      indications: ['Kidney stones dissolution', 'Edema (water retention)', 'Hypertension relief'],
      preparation: 'Boil chopped leaves in water (approx. 1 leaf per cup) for 15 minutes. Drink 1 cup three to four times daily to promote urination.',
      scientificFact: 'Studies show that Sambong extracts act as a natural diuretic and help prevent the formation of calcium oxalate kidney stones.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555319/herbal_ai_herbs/sambong_doh.jpg',
    },
    {
      id: 'ampalaya',
      name: 'Ampalaya',
      scientificName: 'Momordica charantia',
      englishName: 'Bitter Melon',
      indications: ['Mild non-insulin-dependent diabetes', 'Blood sugar regulation'],
      preparation: 'Steam or boil fresh leaves and eat as a vegetable daily, or boil chopped leaves and drink the decoction once a day after a meal.',
      scientificFact: 'Ampalaya contains polypeptide-p, an insulin-like compound, as well as charantin, which has been shown to lower blood glucose levels.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555496/herbal_ai_herbs/ampalaya_doh.jpg',
    },
    {
      id: 'bayabas',
      name: 'Bayabas',
      scientificName: 'Psidium guajava',
      englishName: 'Guava',
      indications: ['Antiseptic wound wash', 'Mouthwash for swollen gums', 'Diarrhea relief'],
      preparation: 'For wounds, boil 1 cup of chopped leaves in 2 cups of water for 15 minutes; use warm decoction to wash wounds. For mouth wash, gargle the warm liquid.',
      scientificFact: 'Guava leaves are rich in flavonoids, tannins, and essential oils that exhibit strong antibacterial, astringent, and anti-inflammatory properties.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555141/herbal_ai_herbs/bayabas_doh.jpg',
    },
    {
      id: 'bawang',
      name: 'Bawang',
      scientificName: 'Allium sativum',
      englishName: 'Garlic',
      indications: ['Hypertension management', 'Blood cholesterol reduction', 'Toothache relief'],
      preparation: 'Eat 1-2 raw cloves or lightly grilled cloves daily with meals. For toothache, crush a fresh clove and apply directly to the affected tooth.',
      scientificFact: 'Crushing garlic releases allicin, a powerful organosulfur compound that acts as a natural vasodilator, antimicrobial, and antioxidant.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555497/herbal_ai_herbs/bawang_doh.jpg',
    },
    {
      id: 'tsaang-gubat',
      name: 'Tsaang Gubat',
      scientificName: 'Carmona retusa',
      englishName: 'Forest Tea / Carmona',
      indications: ['Stomach ache relief', 'Abdominal colic', 'Diarrhea management'],
      preparation: 'Boil 1/2 cup of chopped leaves in 2 cups of water for 15 minutes. Drink 1/2 cup every 4 hours or as needed for abdominal pain.',
      scientificFact: 'Tsaang Gubat contains triterpenes like a-amyrin and b-amyrin, which exhibit antispasmodic activity, relaxing smooth gastrointestinal muscles.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555500/herbal_ai_herbs/tsaang_gubat_doh.jpg',
    },
    {
      id: 'yerba-buena',
      name: 'Yerba Buena',
      scientificName: 'Clinopodium douglasii',
      englishName: 'Mint / Peppermint',
      indications: ['Body pain and arthritis', 'Headache & toothache', 'Cough & cold'],
      preparation: 'Boil chopped leaves in water for 15 minutes. Drink decoction for pain, or crush fresh leaves and apply directly to the forehead for headaches.',
      scientificFact: 'The plant contains significant amounts of menthol, which stimulates cold-sensitive receptors in the skin, producing an analgesic effect.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555499/herbal_ai_herbs/yerba_buena_doh.jpg',
    },
    {
      id: 'niyog-niyogan',
      name: 'Niyog-niyogan',
      scientificName: 'Combretum indicum',
      englishName: 'Yesterday, Today, and Tomorrow',
      indications: ['Intestinal deworming (Ascaris)', 'Parasitic elimination'],
      preparation: 'Eat mature, dried seeds 2 hours after dinner (5-7 seeds for children aged 7-12; 8-10 seeds for adults). Chew thoroughly. If ineffective, repeat after 1 week.',
      scientificFact: 'The seeds contain L-quisqualic acid, an amino acid derivative that acts as an anthelmintic by paralyzing intestinal worms.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555501/herbal_ai_herbs/niyogniogan_doh.jpg',
    },
    {
      id: 'ulasimang-bato',
      name: 'Ulasimang Bato',
      scientificName: 'Peperomia pellucida',
      englishName: 'Shiny Bush / Pansit-pansitan',
      indications: ['Gout management', 'Rheumatoid arthritis', 'Uric acid reduction'],
      preparation: 'Eat a fresh salad of washed leaves (1/2 cup) twice a day, or boil 1 cup of clean leaves in 2 cups of water for 15 minutes and drink twice daily.',
      scientificFact: 'Pharmacological studies demonstrate that Ulasimang Bato contains compounds that inhibit xanthine oxidase, the enzyme responsible for uric acid synthesis.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555502/herbal_ai_herbs/ulasimang_bato_doh.jpg',
    },
    {
      id: 'akapulko',
      name: 'Akapulko',
      scientificName: 'Senna alata',
      englishName: 'Ringworm Bush',
      indications: ['Ringworm & Tinea infections', 'Eczema & Scabies', 'Athlete\'s foot'],
      preparation: 'Crush fresh leaves thoroughly to extract juice. Apply the pure juice directly to the affected skin area twice daily.',
      scientificFact: 'Akapulko leaves contain chrysophanic acid and anthraquinones, which possess potent antifungal properties that combat dermatophyte infections.',
      image: 'https://res.cloudinary.com/dclqw6at7/image/upload/v1787555501/herbal_ai_herbs/akapulko_doh.jpg',
    },
  ];

  const [activeHerb, setActiveHerb] = useState<PitahcHerb>(pitahcHerbs[0]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 py-12 md:py-20 px-6">
        <div className="mx-auto max-w-7xl space-y-16 md:space-y-24">
          
          {/* Page Hero Section */}
          <section className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center bg-white/55 border border-black/10 text-[#2d6a4f] text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
              <Leaf className="h-3.5 w-3.5 mr-1.5 text-[#2d6a4f]" />
              Preserving Traditional Wisdom
            </div>
            
            <h1 className="font-serif-custom italic font-normal text-4xl sm:text-6xl md:text-7xl text-[#1b4332] leading-tight">
              Bridging Heritage &{' '}
              <span className="gradient-ai bg-gradient-to-r from-[#40916c] to-[#74c69d] bg-clip-text text-transparent">
                Technology
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#2d6a4f]/80 leading-relaxed max-w-2xl mx-auto">
              Herbal AI is a digital sanctuary dedicated to preserving Philippine traditional medicinal plant lore while providing scientifically verified preparation guides and interactive AI-driven consultations.
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/library"
                className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-sm px-8 py-3 rounded-full shadow-sm hover:brightness-105 transition-all"
              >
                Browse Library
              </Link>
              <Link
                href="/chat"
                className="btn btn-glass bg-white/35 backdrop-blur-sm border border-white text-[#2d6a4f] font-semibold text-sm px-8 py-3 rounded-full hover:bg-white/55 transition-all"
              >
                Consult Dr. AI
              </Link>
            </div>
          </section>

          {/* Philosophy / Features Grid */}
          <section className="space-y-12">
            <div className="text-center space-y-3">
              <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl text-[#1b4332]">
                Our Core Philosophy
              </h2>
              <p className="text-[#2d6a4f] font-bold text-sm max-w-md mx-auto">
                How we combine ancestral remedies with clinical credibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white mb-6 group-hover:rotate-6 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] mb-3">
                    Heritage Digitization
                  </h3>
                  <p className="text-sm text-[#2d6a4f] leading-relaxed">
                    Traditional knowledge is often passed down orally, leaving it vulnerable to being forgotten. Herbal AI indexes local naming variations (Tagalog, Cebuano, Ilocano) and ancient preparation techniques to build an everlasting digital archive.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="glass-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white mb-6 group-hover:rotate-6 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] mb-3">
                    Clinical Validation
                  </h3>
                  <p className="text-sm text-[#2d6a4f] leading-relaxed">
                    We align entries with publicly available Department of Health and PITAHC reference materials. Each record presents its cited uses, preparation guidance, dosage information, and safety precautions for educational review.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="glass-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white mb-6 group-hover:rotate-6 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] mb-3">
                    Interactive Dr. AI
                  </h3>
                  <p className="text-sm text-[#2d6a4f] leading-relaxed">
                    Access local herbal medicine wisdom on demand. Our smart chat assistant helps translate symptoms into verified preparation methods, translating complex botanical names into actionable, traditional household recipes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive PITAHC Herbs Section */}
          <section className="space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-block bg-[#2d6a4f] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                DOH/PITAHC Reference-Based Remedies
              </div>
              <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl text-[#1b4332]">
                The 10 Medicinal Plants
              </h2>
              <p className="text-[#2d6a4f] font-bold text-sm max-w-xl mx-auto">
                These plants are included in Philippine government medicinal-plant reference materials. Click a plant to review the educational preparation and safety information stored in Herbal AI.
              </p>
            </div>

            {/* Interactive Grid & Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Plant selection menu */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                {pitahcHerbs.map((herb) => {
                  const isActive = activeHerb.id === herb.id;
                  return (
                    <button
                      key={herb.id}
                      onClick={() => setActiveHerb(herb)}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between h-[110px] group ${
                        isActive
                          ? 'bg-gradient-to-br from-[#40916c] to-[#74c69d] text-white border-transparent shadow-md translate-x-1'
                          : 'bg-white/45 hover:bg-white/70 border-black/10 text-[#1b4332] hover:-translate-y-0.5'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-white/80' : 'text-[#40916c]'}`}>
                          {herb.englishName}
                        </span>
                        <h3 className="font-serif-custom italic font-semibold text-lg leading-tight mt-1">
                          {herb.name}
                        </h3>
                      </div>
                      <span className={`text-xs italic ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                        {herb.scientificName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Plant Details */}
              <div className="lg:col-span-7">
                <div className="glass-card bg-white/55 backdrop-blur-md border border-black/10 rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between min-h-[460px] animate-in fade-in duration-300">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1b4332]/10 pb-4">
                      <div>
                        <span className="text-xs font-black uppercase tracking-widest text-[#40916c]">
                          {activeHerb.englishName}
                        </span>
                        <h3 className="font-serif-custom italic font-normal text-3xl md:text-4xl text-[#1b4332] mt-1">
                          {activeHerb.name}
                        </h3>
                        <p className="text-sm italic text-gray-500 mt-1">
                          {activeHerb.scientificName}
                        </p>
                      </div>

                      {/* Plant graphic */}
                      <div className="relative h-20 w-20 bg-gradient-to-tr from-[#40916c]/20 to-[#74c69d]/20 rounded-2xl flex items-center justify-center border border-[#40916c]/10 overflow-hidden shrink-0 shadow-inner">
                        {activeHerb.image ? (
                          <OptimizedFillImage
                            src={activeHerb.image}
                            alt={activeHerb.name}
                            sizes="80px"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Leaf className="h-8 w-8 text-[#40916c]" />
                        )}
                      </div>
                    </div>

                    {/* Indications */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Therapeutic Indications</h4>
                      <div className="flex flex-wrap gap-2">
                        {activeHerb.indications.map((ind, idx) => (
                          <span
                            key={idx}
                            className="bg-[#eef5f0] border border-[#2d6a4f]/15 text-[#1b4332] font-semibold text-xs px-3 py-1 rounded-full"
                          >
                            ✓ {ind}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Preparation */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Preparation & Dosage</h4>
                      <p className="text-sm font-semibold text-[#1b4332] leading-relaxed bg-[#eef5f0]/40 border border-[#2d6a4f]/10 rounded-2xl p-4">
                        {activeHerb.preparation}
                      </p>
                    </div>

                    {/* Scientific Fact */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Scientific Verification</h4>
                      <p className="text-xs font-semibold text-[#2d6a4f] italic bg-[#74c69d]/10 border border-[#74c69d]/25 rounded-2xl p-4 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 shrink-0 text-[#40916c] mt-0.5" />
                        <span>{activeHerb.scientificFact}</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#1b4332]/10 pt-4 mt-6 flex justify-end">
                    <Link
                      href={`/library?q=${activeHerb.name}`}
                      className="text-xs font-bold text-[#40916c] hover:underline flex items-center gap-1.5"
                    >
                      <span>View full research & comments in the Library</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Collaborative Capstone Section */}
          <section className="glass-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 md:p-12 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-6">
              <div className="inline-flex items-center bg-[#c9a040]/10 border border-[#c9a040]/30 text-[#c9a040] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-[#c9a040]" />
                Academic Capstone Project
              </div>
              
              <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl text-[#1b4332] leading-tight">
                Empowering Communities Through Knowledge
              </h2>

              <p className="text-sm md:text-base font-bold text-[#2d6a4f] leading-relaxed">
                Herbal AI represents a dedicated Capstone initiative built to solve a critical issue: the gap between traditional folk wisdom and modern digital health applications. By providing a verified central registry, we aim to eliminate hazardous self-medication practices while honoring local botanical heritage.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#1b4332] pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52b788] shrink-0" />
                  <span>Community-submitted data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52b788] shrink-0" />
                  <span>Botanist-reviewed monographs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52b788] shrink-0" />
                  <span>Real-time chat integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52b788] shrink-0" />
                  <span>Uses public DOH/PITAHC references</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 relative rounded-2xl overflow-hidden shadow-md aspect-video md:aspect-square bg-white border border-black/5">
              <OptimizedFillImage
                src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80"
                alt="Science lab analyzing medicinal leaves"
                sizes="(max-width: 768px) 100vw, 42vw"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </section>

          {/* Final Call to Action */}
          <section className="text-center bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] rounded-3xl p-8 md:p-12 text-white shadow-lg space-y-6 relative overflow-hidden">
            {/* Organic circles background */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-12 -translate-y-12"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-16 translate-y-16"></div>

            <span className="text-xs font-black uppercase tracking-widest text-[#74c69d]">
              Ready to Explore?
            </span>
            
            <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl max-w-2xl mx-auto leading-tight">
              Begin your journey into traditional Philippine therapeutics
            </h2>
            
            <p className="text-white/80 max-w-md mx-auto text-sm">
              Register as a contributor to suggest new herbs, or open Dr. AI to receive guidelines on natural formulations instantly.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4 relative z-10">
              <Link
                href="/signup"
                className="bg-white text-[#1b4332] font-bold text-sm px-8 py-3.5 rounded-full shadow-sm hover:bg-gray-100 transition-all"
              >
                Create Account
              </Link>
              <Link
                href="/chat"
                className="border border-white/45 bg-white/10 text-white font-bold text-sm px-8 py-3.5 rounded-full hover:bg-white/20 transition-all"
              >
                Ask Dr. AI
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
