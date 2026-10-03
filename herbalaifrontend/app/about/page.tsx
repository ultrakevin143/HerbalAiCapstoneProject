'use client';

import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import HerbReferences from '../../components/HerbReferences';
import { cachedApiGet } from '../../lib/request-cache';
import { aboutHerbRecords, type AboutHerb } from '../../lib/about-herb-records';

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const [pitahcHerbs, setPitahcHerbs] = useState<AboutHerb[]>([]);
  const [activeHerbId, setActiveHerbId] = useState<string | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [retryRecords, setRetryRecords] = useState(0);
  const activeHerb = pitahcHerbs.find((herb) => herb.id === activeHerbId) ?? pitahcHerbs[0];

  useEffect(() => {
    let cancelled = false;
    const loadRecords = async () => {
      setRecordsLoading(true);
      setRecordsError(null);
      try {
        const response = await cachedApiGet('/herbs?isDohApproved=true&limit=20', 60_000, retryRecords > 0);
        const records = aboutHerbRecords(response.data);
        if (!records.length) throw new Error('No reviewed records available');
        if (!cancelled) setPitahcHerbs(records);
      } catch {
        if (!cancelled) setRecordsError('Reviewed plant records are temporarily unavailable. Try again or open the Library.');
      } finally {
        if (!cancelled) setRecordsLoading(false);
      }
    };
    void loadRecords();
    return () => { cancelled = true; };
  }, [retryRecords]);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 md:py-20">
        <div className="mx-auto max-w-7xl space-y-12 md:space-y-24">
          
          {/* Page Hero Section */}
          <section className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center bg-white/55 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line text-[#2d6a4f] dark:text-[#74c69d] text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm">
              <Leaf className="h-3.5 w-3.5 mr-1.5 text-[#2d6a4f] dark:text-[#74c69d]" />
              Preserving Traditional Wisdom
            </div>
            
            <h1 className="about-title mx-auto max-w-4xl font-serif-custom font-semibold text-[#1b4332] dark:text-ink">
              Bridging Heritage &{' '}
              <span className="text-[var(--ui-brand)] dark:text-accent">
                Technology
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#2d6a4f]/80 dark:text-muted leading-relaxed max-w-2xl mx-auto">
              Herbal-Ai is an educational repository for Philippine medicinal-plant knowledge, with source-linked preparation and safety information presented in a clearer digital format.
            </p>

            <div className="flex flex-col justify-center gap-3 pt-4 min-[360px]:flex-row min-[360px]:gap-4">
              <Link
                href="/library"
                className="btn border-[#2d6a4f] bg-[#2d6a4f] text-white font-semibold text-sm px-8 py-3 rounded-full shadow-sm hover:bg-[#1b4332] transition-colors"
              >
                Browse Library
              </Link>
              <Link
                href="/chat"
                className="btn btn-glass bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-white/60 dark:border-line text-[#2d6a4f] dark:text-ink font-semibold text-sm px-8 py-3 rounded-full hover:bg-white/65 dark:hover:bg-panel transition-all shadow-sm"
              >
                Ask Dr. Ai
              </Link>
            </div>
          </section>

          {/* Philosophy / Features Grid */}
          <section className="space-y-12">
            <div className="text-center space-y-3">
              <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl text-[#1b4332] dark:text-ink">
                Our Core Philosophy
              </h2>
              <p className="text-[#2d6a4f] dark:text-muted font-bold text-sm max-w-md mx-auto">
                How we preserve traditional knowledge while keeping evidence and safety boundaries visible.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="glass-card bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2d6a4f] text-white mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] dark:text-ink mb-3">
                    Heritage Digitization
                  </h3>
                  <p className="text-sm text-[#2d6a4f] dark:text-muted leading-relaxed">
                    Traditional knowledge is often passed down orally, leaving it vulnerable to being forgotten. Herbal-Ai indexes local naming variations (Tagalog, Cebuano, Ilocano) and ancient preparation techniques to build an everlasting digital archive.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="glass-card bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2d6a4f] text-white mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] dark:text-ink mb-3">
                    Evidence Review
                  </h3>
                  <p className="text-sm text-[#2d6a4f] dark:text-muted leading-relaxed">
                    We align entries with publicly available Department of Health and PITAHC reference materials. Each record presents its cited uses, preparation guidance, dosage information, and safety precautions for educational review.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="glass-card bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#2d6a4f] text-white mb-6 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="font-serif-custom italic font-normal text-2xl text-[#1b4332] dark:text-ink mb-3">
                    Interactive Dr. Ai
                  </h3>
                  <p className="text-sm text-[#2d6a4f] dark:text-muted leading-relaxed">
                    Ask questions using everyday language. Dr. Ai organizes matching repository records into clearer educational answers and avoids unsupported herb-specific guidance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive PITAHC Herbs Section */}
          <section className="space-y-12">
            <div className="text-center space-y-3">
              <div className="inline-block bg-[#2d6a4f] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                DOH/PITAHC Reference-Based Remedies
              </div>
              <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl text-[#1b4332] dark:text-ink">
                The 10 Medicinal Plants
              </h2>
              <p className="text-[#2d6a4f] dark:text-muted font-bold text-sm max-w-xl mx-auto">
                These plants are included in Philippine government medicinal-plant reference materials. Click a plant to review the educational preparation and safety information stored in Herbal-Ai.
              </p>
            </div>

            {/* Interactive Grid & Detail Panel */}
            {recordsLoading && <p role="status" className="text-muted">Loading reviewed plant records...</p>}
            {recordsError && <div role="alert" className="space-y-3 text-error-ink">
              <p>{recordsError}</p>
              <button type="button" className="flat-button flat-button-secondary" onClick={() => setRetryRecords((current) => current + 1)}>Try again</button>
            </div>}
            {activeHerb && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Plant selection menu */}
              <div className="lg:col-span-5 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                {pitahcHerbs.map((herb) => {
                  const isActive = activeHerb.id === herb.id;
                  return (
                    <button
                      key={herb.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveHerbId(herb.id)}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2 min-h-[110px] group cursor-pointer ${
                        isActive
                          ? 'bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-sm'
                          : 'bg-white/45 dark:bg-panel/75 hover:bg-white/70 dark:hover:bg-panel border-black/10 dark:border-line text-[#1b4332] dark:text-ink hover:-translate-y-0.5'
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                          {herb.englishName}
                        </span>
                        <h3 className="font-serif-custom italic font-bold text-lg leading-tight mt-0.5">
                          {herb.name}
                        </h3>
                      </div>
                      <span className={`text-[10px] italic line-clamp-1 ${isActive ? 'text-white/70' : 'text-[#40916c]'}`}>
                        {herb.scientificName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Plant Monograph Details */}
              <div className="lg:col-span-7">
                <div className="glass-card bg-white/55 dark:bg-panel/85 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col min-[360px]:flex-row items-start min-[360px]:items-center justify-between gap-3 border-b border-[#1b4332]/10 dark:border-line pb-4">
                      <div className="min-w-0 break-words">
                        <span className="text-xs font-black uppercase tracking-widest text-[#40916c]">
                          {activeHerb.englishName}
                        </span>
                        <h3 className="font-serif-custom italic font-normal text-3xl sm:text-4xl text-[#1b4332] dark:text-ink mt-1">
                          {activeHerb.name}
                        </h3>
                        <p className="text-sm italic text-[#2d6a4f] dark:text-muted mt-0.5">
                          {activeHerb.scientificName}
                        </p>
                      </div>

                      {/* Plant graphic */}
                      <div className="relative h-20 w-20 bg-soft rounded-2xl flex items-center justify-center border border-line overflow-hidden shrink-0">
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
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Documented Uses
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {activeHerb.indications.map((ind, idx) => (
                          <span
                            key={idx}
                            className="bg-[#eef5f0] dark:bg-soft border border-[#2d6a4f]/15 dark:border-line text-[#1b4332] dark:text-ink font-semibold text-xs px-3 py-1 rounded-full"
                          >
                            ✓ {ind}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Preparation */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                        Preparation & Dosage
                      </h4>
                      <p className="text-sm font-semibold text-[#1b4332] dark:text-ink leading-relaxed bg-[#eef5f0]/40 dark:bg-soft border border-[#2d6a4f]/10 dark:border-line rounded-2xl p-4">
                        {activeHerb.preparation}
                      </p>
                    </div>

                    {/* Evidence note */}
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        Safety & Evidence
                      </h4>
                      <p className="text-xs font-semibold text-[#2d6a4f] dark:text-[#74c69d] italic bg-[#74c69d]/10 border border-[#74c69d]/25 rounded-2xl p-4 flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 shrink-0 text-[#40916c] mt-0.5" />
                        <span>{activeHerb.safetyNotes}</span>
                      </p>
                      <div className="mt-4"><HerbReferences sources={activeHerb.sources} /></div>
                    </div>
                  </div>

                  <div className="border-t border-[#1b4332]/10 dark:border-line pt-4 mt-6 flex justify-end">
                    <Link
                      href={`/library?id=${encodeURIComponent(activeHerb.id)}`}
                      className="text-xs font-bold text-[#40916c] hover:underline flex items-center gap-1.5"
                    >
                      <span>View full research & comments in the Library</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
            )}
          </section>

          {/* Collaborative Capstone Section */}
          <section className="glass-card grid grid-cols-1 items-center gap-8 rounded-3xl border border-black/10 bg-white/45 p-6 shadow-sm backdrop-blur-md dark:border-line dark:bg-panel/75 sm:p-8 md:grid-cols-12 md:p-12">
            <div className="md:col-span-7 space-y-6">
              <div className="inline-flex items-center bg-[#c9a040]/10 border border-[#c9a040]/30 text-[#c9a040] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-[#c9a040]" />
                Academic Capstone Project
              </div>
              
              <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl text-[#1b4332] dark:text-ink leading-tight">
                Empowering Communities Through Knowledge
              </h2>

              <p className="text-sm md:text-base font-bold text-[#2d6a4f] dark:text-muted leading-relaxed">
                Herbal-Ai is a capstone initiative addressing the gap between traditional folk knowledge and accessible digital health education. It provides a reviewed repository that keeps sources, preparation notes, and safety limits visible while honoring local botanical heritage.
              </p>
              
              <div className="grid grid-cols-1 gap-4 text-xs font-semibold text-[#1b4332] dark:text-ink pt-2 min-[360px]:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52b788] shrink-0" />
                  <span>Community-submitted data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52b788] shrink-0" />
                  <span>Administrator-reviewed plant records</span>
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
                src="/images/lagundi.png"
                alt="Lagundi leaves documented in the Herbal-Ai medicinal-plant library"
                sizes="(max-width: 768px) 100vw, 42vw"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </section>

          {/* Final Call to Action */}
          {!isAuthenticated && (
            <section className="relative space-y-6 overflow-hidden rounded-2xl bg-[#1b4332] p-6 text-center text-white shadow-md sm:p-8 md:p-12">
              <div className="absolute top-0 left-0 h-32 w-32 -translate-x-12 -translate-y-12 rounded-full bg-white/5"></div>
              <div className="absolute right-0 bottom-0 h-48 w-48 translate-x-16 translate-y-16 rounded-full bg-white/5"></div>

            <span className="text-xs font-black uppercase tracking-widest text-[#74c69d]">
              Ready to Explore?
            </span>
            
            <h2 className="font-serif-custom italic font-normal text-3xl md:text-5xl max-w-2xl mx-auto leading-tight">
              Explore documented Philippine herbal knowledge
            </h2>
            
            <p className="text-white/80 max-w-md mx-auto text-sm">
              Create an account to suggest herbs, or ask Dr. Ai for source-grounded preparation and safety information from the repository.
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
                Ask Dr. Ai
              </Link>
            </div>
            </section>
          )}

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
