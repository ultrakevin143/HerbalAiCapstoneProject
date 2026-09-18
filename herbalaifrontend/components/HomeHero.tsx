'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function HomeHero() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const isStaff = user && (user.role === 'admin' || user.role === 'botanist');

  return (
    <section className="relative px-6 flex items-center justify-center bg-transparent min-h-[calc(100vh-80px)] py-12 md:py-20">
      <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Welcome & Hero Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="hero-welcome-badge bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line text-[#2d6a4f] dark:text-[#74c69d] text-sm font-semibold px-4 py-2 rounded-full inline-block shadow-sm">
            {isAuthenticated ? (
              <span className="flex items-center gap-2">
                👋 Welcome back, {user?.name?.split(' ')[0]}!
                {user?.avatar?.startsWith('http') ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="h-5 w-5 rounded-full object-cover shadow-sm inline-block"
                  />
                ) : (
                  <span>{user?.avatar || '🌱'}</span>
                )}
              </span>
            ) : (
              <span>🍃 Philippine Medicinal Plant Repository</span>
            )}
          </div>

          <h1 className="hero-figma-title font-serif-custom italic font-normal text-6xl md:text-7xl lg:text-8xl text-[#1b4332] dark:text-ink leading-[1.05]">
            Herbal{' '}
            <span className="gradient-ai inline-block bg-gradient-to-r from-[#40916c] to-[#74c69d] bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="hero-figma-sub text-lg md:text-xl text-[#2d6a4f]/80 dark:text-muted leading-[1.55] max-w-[520px]">
            {isAuthenticated
              ? isStaff
                ? 'Review community submissions from the Admin Panel, or explore the public catalog as a member.'
                : 'Your personalized hub for validated Philippine herbal medicine and AI-assisted preparation guides.'
              : 'A Digital Repository of Philippine Herbal Medicine with AI-Assisted Preparation Guides.'}
          </p>

          <div className="hero-figma-actions flex flex-wrap gap-4 pt-2">
            <Link
              href="/library"
              className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all whitespace-nowrap"
            >
              Browse Herbal AI
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/suggest"
                  className="btn btn-glass bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-white/60 dark:border-line text-[#2d6a4f] dark:text-ink font-semibold text-base px-8 py-3.5 rounded-full hover:bg-white/65 dark:hover:bg-panel transition-all shadow-sm whitespace-nowrap"
                >
                  Suggest Herb
                </Link>
                {isStaff && (
                  <Link
                    href="/admin"
                    className="btn btn-outline border-2 border-[#2d6a4f] dark:border-[#74c69d] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-base px-8 py-3.5 rounded-full hover:bg-[#2d6a4f]/10 transition-all whitespace-nowrap"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/chat"
                className="btn btn-glass bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-white/60 dark:border-line text-[#2d6a4f] dark:text-ink font-semibold text-base px-8 py-3.5 rounded-full hover:bg-white/65 dark:hover:bg-panel transition-all shadow-sm whitespace-nowrap"
              >
                Ask Dr.Ai
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Dr. Ai Widget */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-card dr-ai-widget bg-white/50 dark:bg-panel/85 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 shadow-md flex flex-col h-[420px]">
            <div className="dr-ai-widget-header flex items-center justify-between border-b border-white/50 dark:border-line pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="dr-ai-avatar flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-xl text-white shadow-sm">
                  🤖
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-[#1b4332] dark:text-ink">Dr.Ai</h2>
                  <span className="dr-ai-status text-[#52b788] text-xs font-semibold">● Online</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6a7282] dark:text-muted px-2 py-0.5 border border-[#6a7282]/20 rounded-md bg-[#fafaf8] dark:bg-soft">
                Assistant
              </span>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-label="Dr. Ai conversation preview"
              className="dr-ai-messages flex-1 overflow-y-auto space-y-3 pr-1 text-xs"
            >
              <div className="flex gap-2">
                <div className="dr-ai-bubble bot bg-white/70 dark:bg-soft text-[#1b4332] dark:text-ink rounded-[4px_16px_16px_16px] max-w-[88%] p-3 text-sm shadow-sm border border-black/5 dark:border-line">
                  Hello! I&apos;m Dr.Ai. How can I help you with herbal medicine today?
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="dr-ai-bubble user bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white rounded-[16px_16px_4px_16px] max-w-[88%] p-3 text-sm shadow-sm">
                  How do I prepare lagundi for cough?
                </div>
              </div>
              <div className="flex gap-2">
                <div className="dr-ai-bubble bot bg-white/70 dark:bg-soft text-[#1b4332] dark:text-ink rounded-[4px_16px_16px_16px] max-w-[88%] p-3 text-sm shadow-sm border border-black/5 dark:border-line">
                  To prepare lagundi for cough relief: Boil 6–8 fresh lagundi leaves in 2 cups of water for 15 minutes. Let it cool, then strain. Drink ½ cup three times daily.
                </div>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (query.trim()) router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
              }}
              className="dr-ai-input-row mt-3 flex gap-2 pt-2 border-t border-[#1b4332]/10 dark:border-line"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Ask about herbal remedies..."
                className="flex-1 border border-white/60 dark:border-line bg-white/70 dark:bg-soft rounded-full px-5 py-3 text-sm text-[#1b4332] dark:text-ink placeholder-emerald-800/40 dark:placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                aria-label="Ask Dr.Ai"
              />
              <button
                type="submit"
                className="dr-ai-send w-12 h-12 rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white flex items-center justify-center cursor-pointer hover:brightness-105 shadow-sm transition-all"
                aria-label="Send query"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
