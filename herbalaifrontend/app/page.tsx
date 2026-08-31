'use client';
 
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Herb {
  id: string;
  name: string;
  scientificName: string;
  akaName: string;
  verified: boolean;
  image: string;
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [drAiQuery, setDrAiQuery] = useState('');

  const [trendingHerbs, setTrendingHerbs] = useState<Herb[]>([
    {
      id: 'lagundi',
      name: 'LAGUNDI',
      scientificName: 'Vitex negundo',
      akaName: 'Aka Five-leaved Chaste Tree',
      verified: true,
      image: '/images/lagundi.png',
    },
    {
      id: 'sambong',
      name: 'SAMBONG',
      scientificName: 'Blumea balsamifera',
      akaName: 'Aka Ngai Camphor',
      verified: true,
      image: '/images/sambong.png',
    },
    {
      id: 'yerba-buena',
      name: 'YERBA BUENA',
      scientificName: 'Clinopodium douglasii',
      akaName: 'Aka Peppermint',
      verified: true,
      image: '',
    },
    {
      id: 'bayabas',
      name: 'BAYABAS',
      scientificName: 'Psidium guajava',
      akaName: 'Aka Guava',
      verified: true,
      image: '/images/bayabas.png',
    },
  ]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseUrl}/herbs`);
        const res = await response.json();
        if (res.status === 'success') {
          const list = (res.data.herbs || []) as {
            id: string;
            localName: string;
            scientificName: string;
            cebuanoName?: string;
            imageUrl?: string;
          }[];
          const targets = ['lagundi', 'sambong', 'yerba buena', 'bayabas'];
          
          const mapped = targets.map(target => {
            const found = list.find(h => h.localName.toLowerCase().trim().includes(target));
            if (found) {
              return {
                id: found.id,
                name: found.localName,
                scientificName: found.scientificName,
                akaName: found.cebuanoName ? `Aka ${found.cebuanoName}` : '',
                verified: true,
                image: found.imageUrl || ''
              };
            }
            return null;
          }).filter(Boolean);
          
          if (mapped.length > 0) {
            setTrendingHerbs(mapped as Herb[]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch trending herbs:', err);
      }
    };

    fetchTrending();
  }, []);

  const handleDrAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drAiQuery.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(drAiQuery.trim())}`);
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'botanist');

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 flex items-center justify-center bg-transparent min-h-[calc(100vh-80px)] py-12 md:py-20">
          <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dynamic Welcome Badge */}
              {isAuthenticated ? (
                <div className="hero-welcome-badge bg-white/55 border border-black/10 text-[#2d6a4f] text-sm font-semibold px-4 py-2 rounded-full inline-block shadow-sm">
                  <span className="flex items-center gap-2">
                    👋 Welcome back, {user?.name?.split(' ')[0]}!
                    {user?.avatar?.startsWith('http') ? (
                      <img src={user.avatar} alt="Avatar" className="h-5 w-5 rounded-full object-cover shadow-sm inline-block" />
                    ) : (
                      <span>{user?.avatar || '🌱'}</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="hero-welcome-badge bg-white/55 border border-black/10 text-[#2d6a4f] text-sm font-semibold px-4 py-2 rounded-full inline-block shadow-sm">
                  <span>🍃 Philippine Medicinal Plant Repository</span>
                </div>
              )}

              {/* Page Main Heading */}
              <h1 className="hero-figma-title font-serif-custom italic font-normal text-6xl md:text-8xl text-[#1b4332] leading-[1.05]">
                Herbal{' '}
                <span className="gradient-ai block bg-gradient-to-r from-[#40916c] to-[#74c69d] bg-clip-text text-transparent">
                  AI
                </span>
              </h1>

              {/* Subtext */}
              <p className="hero-figma-sub text-lg md:text-xl text-[#2d6a4f]/80 leading-[1.55] max-w-[520px]">
                {isAuthenticated
                  ? user?.role === 'botanist' || user?.role === 'admin'
                    ? 'Review community submissions from the Admin Panel, or explore the public catalog as a member.'
                    : 'Your personalized hub for validated Philippine herbal medicine and AI-assisted preparation guides.'
                  : 'A Digital Repository of Philippine Herbal Medicine with AI-Assisted Preparation Guides.'}
              </p>

              {/* Hero Action buttons */}
              <div className="hero-figma-actions flex flex-wrap gap-4">
                <Link
                  href="/library"
                  className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all"
                >
                  Browse Herbal AI
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      href="/suggest"
                      className="btn btn-glass bg-white/35 backdrop-blur-sm border border-white text-[#2d6a4f] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-white/55 transition-all"
                    >
                      Suggest Herb
                    </Link>
                    {isStaff && (
                      <Link
                        href="/admin"
                        className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-[#2d6a4f]/10 transition-all"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </>
                ) : (
                  <Link
                    href="/chat"
                    className="btn btn-glass bg-white/35 backdrop-blur-sm border border-white text-[#2d6a4f] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-white/55 transition-all"
                  >
                    Ask Dr.Ai
                  </Link>
                )}
              </div>
            </div>

            {/* Dr.Ai Mini Chat Widget */}
            <div className="lg:col-span-5 w-full">
              <div className="glass-card dr-ai-widget bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-6 shadow-md flex flex-col h-[420px]">
                
                {/* Widget Header */}
                <div className="dr-ai-widget-header flex items-center justify-between border-b border-white/50 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="dr-ai-avatar flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-xl text-white">
                      🤖
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#1b4332]">Dr.Ai</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="dr-ai-status text-[#52b788] text-xs font-semibold">● Online</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6a7282] px-2 py-0.5 border border-[#6a7282]/20 rounded-md bg-[#fafaf8]">
                    Assistant
                  </span>
                </div>

                {/* Messages Panel */}
                <div className="dr-ai-messages flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  <div className="flex gap-2">
                    <div className="dr-ai-bubble bot bg-white/60 backdrop-blur-sm text-[#1b4332] rounded-[4px_16px_16px_16px] max-w-[88%] p-3 text-sm">
                      Hello! I&apos;m Dr.Ai. How can I help you with herbal medicine today?
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <div className="dr-ai-bubble user bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white rounded-[16px_16px_4px_16px] max-w-[88%] p-3 text-sm align-self-end">
                      How do I prepare lagundi for cough?
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="dr-ai-bubble bot bg-white/60 backdrop-blur-sm text-[#1b4332] rounded-[4px_16px_16px_16px] max-w-[88%] p-3 text-sm">
                      To prepare lagundi for cough relief: Boil 6–8 fresh lagundi leaves in 2 cups of water for 15 minutes. Let it cool, then strain. Drink ½ cup three times daily.
                    </div>
                  </div>
                </div>

                {/* Form Input Row */}
                <form onSubmit={handleDrAiSubmit} className="dr-ai-input-row mt-3 flex gap-2 pt-2 border-t border-[#1b4332]/10">
                  <input
                    type="text"
                    placeholder="Ask about herbal remedies..."
                    value={drAiQuery}
                    onChange={(e) => setDrAiQuery(e.target.value)}
                    className="flex-1 border border-white/60 bg-white/60 backdrop-blur-sm rounded-full px-5 py-3 text-sm text-[#1b4332] placeholder-emerald-800/40"
                    aria-label="Ask Dr.Ai"
                  />
                  <button
                    type="submit"
                    className="dr-ai-send w-12 h-12 rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white flex items-center justify-center cursor-pointer"
                    aria-label="Send query"
                  >
                    ➤
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Cards Grid Section ("Why Herbal AI?") */}
        <section className="px-6 py-16 bg-transparent">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif-custom italic font-normal text-center text-4xl md:text-5xl text-[#1b4332] mb-12">
              Why Herbal AI?
            </h2>

            <div className="feature-grid-3 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Feature 1 */}
              <div className="glass-card feature-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 min-h-[250px] shadow-sm hover:shadow-md transition-all">
                <div className="feature-icon-wrap flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-3xl text-white mb-5">
                  📚
                </div>
                <h3 className="font-serif-custom italic font-normal text-xl text-[#1b4332] mb-3">Preserving Heritage</h3>
                <p className="text-sm text-[#2d6a4f] leading-relaxed">
                  Digitizing traditional Philippine herbal knowledge for future generations and making it accessible worldwide.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card feature-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 min-h-[250px] shadow-sm hover:shadow-md transition-all">
                <div className="feature-icon-wrap flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-3xl text-white mb-5">
                  🤖
                </div>
                <h3 className="font-serif-custom italic font-normal text-xl text-[#1b4332] mb-3">AI-Assisted</h3>
                <p className="text-sm text-[#2d6a4f] leading-relaxed">
                  Get instant guidance on herbal preparation methods, dosages, and usage through our intelligent chatbot.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card feature-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl p-8 min-h-[250px] shadow-sm hover:shadow-md transition-all">
                <div className="feature-icon-wrap flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-3xl text-white mb-5">
                  🛡️
                </div>
                <h3 className="font-serif-custom italic font-normal text-xl text-[#1b4332] mb-3">Verified & Safe</h3>
                <p className="text-sm text-[#2d6a4f] leading-relaxed">
                  All information is reviewed by experts and cross-referenced with scientific research for your safety.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Trending Medicinal Plants Section */}
        <section className="px-6 py-16 bg-transparent">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-serif-custom italic font-normal text-center text-4xl md:text-5xl text-[#1b4332] mb-4">
              Trending Medicinal Plants
            </h2>
            <p className="text-center font-bold text-[#2d6a4f] mb-12 max-w-md mx-auto">
              Explore some of the most popular scientifically backed traditional plants in the Philippines.
            </p>

            <div className="herb-figma-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingHerbs.map((herb) => (
                <div
                  key={herb.id}
                  onClick={() => {
                    if (herb.id.startsWith('h-')) {
                      router.push(`/library?id=${herb.id}`);
                    } else {
                      router.push(`/library?search=${encodeURIComponent(herb.name.toLowerCase())}`);
                    }
                  }}
                  className="glass-card herb-figma-card bg-white/40 backdrop-blur-md border border-black/10 rounded-3xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col group"
                >
                  {/* Card Image Wrap */}
                  <div className="herb-figma-img h-52 bg-gradient-to-r from-[#40916c] to-[#74c69d] relative overflow-hidden flex items-center justify-center">
                    {/* Centered fallback placeholder in the background */}
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40">
                      🌿
                    </div>
                    {herb.image && herb.image !== '' && (
                      <img
                        src={herb.image}
                        alt={herb.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105 opacity-85"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    
                    {herb.verified && (
                      <span className="herb-figma-badge absolute top-4 right-4 bg-[#52b788] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full z-10">
                        Verified
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="herb-figma-body p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif-custom italic font-normal text-xl text-[#1b4332] mb-1">
                        {herb.name}
                      </h3>
                      <p className="herb-figma-sci text-xs italic text-gray-500">
                        {herb.scientificName}
                      </p>
                    </div>
                    <p className="herb-figma-aka text-xs text-[#40916c] border-t border-[#1b4332]/10 pt-3 mt-2 line-clamp-2">
                      {herb.akaName}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/library"
                className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] font-semibold text-sm px-6 hover:bg-[#2d6a4f]/10"
              >
                View All Herbs →
              </Link>
            </div>
          </div>
        </section>

        {/* History Preservation CTA Section */}
        <section className="px-6 py-16 bg-transparent">
          <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            {/* Left Image Column */}
            <div className="relative border border-black/10 rounded-3xl overflow-hidden shadow-md aspect-video md:aspect-[4/3] bg-white">
              <img
                src="https://images.unsplash.com/photo-1595278069441-2cf29faff7a5?w=800&q=80"
                alt="Traditional herbal knowledge sharing"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Text Column */}
            <div className="space-y-6">
              <h2 className="font-serif-custom italic font-normal text-4xl md:text-5xl text-[#1b4332] leading-tight">
                Help us Preserve our History
              </h2>
              <p className="text-base font-bold text-[#2d6a4f] leading-relaxed">
                Join our community of contributors and share your knowledge of traditional Philippine herbal medicine. 
                Together, we can build a comprehensive digital repository that honors our ancestors&apos; wisdom and makes 
                it accessible for generations to come.
              </p>

              {isAuthenticated ? (
                <Link
                  href="/suggest"
                  className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all"
                >
                  Suggest a New Herb
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all"
                >
                  Become a Contributor
                </Link>
              )}
            </div>

          </div>
        </section>
      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
}
