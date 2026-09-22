'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import DrAiAvatar from './DrAiAvatar';

export default function HomeHero() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const isStaff = user && (user.role === 'admin' || user.role === 'botanist');

  return (
    <section className="relative flex min-h-0 items-start justify-center bg-transparent px-4 pt-7 pb-10 sm:px-6 sm:pt-10 md:min-h-[calc(100vh-80px)] md:items-center md:py-12 lg:py-20">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-7 md:grid-cols-12 md:gap-6 lg:gap-12">
        {/* Left Column: Welcome & Hero Text */}
        <div className="space-y-5 md:col-span-6 md:space-y-4 lg:col-span-7 lg:space-y-6">
          <div className="hero-welcome-badge hidden bg-white/60 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line text-[#2d6a4f] dark:text-[#74c69d] text-sm font-semibold px-4 py-2 rounded-full shadow-sm sm:inline-block">
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

          <h1 className="hero-figma-title font-serif-custom text-4xl font-normal italic leading-[1.05] text-[#1b4332] dark:text-ink sm:text-6xl md:text-[3.5rem] lg:text-8xl">
            Herbal{' '}
            <span className="gradient-ai inline-block bg-gradient-to-r from-[#40916c] to-[#74c69d] bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="hero-figma-sub max-w-[520px] text-base leading-[1.55] text-[#2d6a4f]/80 dark:text-muted md:text-sm lg:text-xl">
            {isAuthenticated
              ? isStaff
                ? 'Review community submissions from the Admin Panel, or explore the public catalog as a member.'
                : 'Your personalized hub for validated Philippine herbal medicine and AI-assisted preparation guides.'
              : 'A Digital Repository of Philippine Herbal Medicine with AI-Assisted Preparation Guides.'}
          </p>

          <div className="hero-figma-actions flex flex-wrap gap-3 pt-2 lg:gap-4">
            <Link
              href="/library"
              className="btn btn-gradient whitespace-nowrap rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 lg:px-8 lg:py-3.5 lg:text-base"
            >
              Browse Herbal-Ai
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/suggest"
                  className="btn btn-glass whitespace-nowrap rounded-full border border-white/60 bg-white/45 px-5 py-3 text-sm font-semibold text-[#2d6a4f] shadow-sm backdrop-blur-md transition-all hover:bg-white/65 dark:border-line dark:bg-panel/75 dark:text-ink dark:hover:bg-panel lg:px-8 lg:py-3.5 lg:text-base"
                >
                  Suggest Herb
                </Link>
                {isStaff && (
                  <Link
                    href="/admin"
                    className="btn btn-outline whitespace-nowrap rounded-full border-2 border-[#2d6a4f] px-5 py-3 text-sm font-semibold text-[#2d6a4f] transition-all hover:bg-[#2d6a4f]/10 dark:border-[#74c69d] dark:text-[#74c69d] lg:px-8 lg:py-3.5 lg:text-base"
                  >
                    Admin Panel
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/chat"
                className="btn btn-glass whitespace-nowrap rounded-full border border-white/60 bg-white/45 px-5 py-3 text-sm font-semibold text-[#2d6a4f] shadow-sm backdrop-blur-md transition-all hover:bg-white/65 dark:border-line dark:bg-panel/75 dark:text-ink dark:hover:bg-panel lg:px-8 lg:py-3.5 lg:text-base"
              >
                Ask Dr. Ai
              </Link>
            )}
          </div>
        </div>

        {/* Right Column: Dr. Ai Widget */}
        <div className="w-full md:col-span-6 lg:col-span-5">
          <div className="glass-card dr-ai-widget flex h-auto flex-col rounded-3xl border border-black/10 bg-white/50 p-4 shadow-md backdrop-blur-md dark:border-line dark:bg-panel/85 sm:p-5 md:h-[400px] lg:h-[420px] lg:p-6">
            <div className="dr-ai-widget-header mb-3 flex items-center justify-between border-b border-white/50 pb-3 dark:border-line md:mb-4 md:pb-4">
              <div className="flex items-center gap-3">
                <DrAiAvatar className="dr-ai-avatar h-12 w-12 text-[#1b4332] dark:text-[#e6f1e7]" />
                <div>
                  <h2 className="font-extrabold text-sm text-[#1b4332] dark:text-ink">Dr. Ai</h2>
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
              className="dr-ai-messages hidden flex-1 space-y-3 overflow-y-auto pr-1 text-xs md:block"
            >
              <div className="flex gap-2">
                <div className="dr-ai-bubble bot max-w-[88%] rounded-[4px_16px_16px_16px] border border-black/5 bg-white/70 p-3 text-xs text-[#1b4332] shadow-sm dark:border-line dark:bg-soft dark:text-ink lg:text-sm">
                  Hello! I&apos;m Dr. Ai. How can I help you with Philippine herbal medicine today?
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="dr-ai-bubble user max-w-[88%] rounded-[16px_16px_4px_16px] bg-gradient-to-r from-[#40916c] to-[#74c69d] p-3 text-xs text-white shadow-sm lg:text-sm">
                  How do I prepare lagundi for cough?
                </div>
              </div>
              <div className="flex gap-2">
                <div className="dr-ai-bubble bot max-w-[88%] rounded-[4px_16px_16px_16px] border border-black/5 bg-white/70 p-3 text-xs text-[#1b4332] shadow-sm dark:border-line dark:bg-soft dark:text-ink lg:text-sm">
                  To prepare lagundi for cough relief: Boil 6–8 fresh lagundi leaves in 2 cups of water for 15 minutes. Let it cool, then strain. Drink ½ cup three times daily.
                </div>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (query.trim()) router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
              }}
              className="dr-ai-input-row mt-3 hidden gap-2 border-t border-[#1b4332]/10 pt-2 dark:border-line md:flex"
            >
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Ask about herbal remedies..."
                className="flex-1 border border-white/60 dark:border-line bg-white/70 dark:bg-soft rounded-full px-5 py-3 text-sm text-[#1b4332] dark:text-ink placeholder-emerald-800/40 dark:placeholder-muted/60 focus:outline-none focus:ring-2 focus:ring-[#40916c]"
                aria-label="Ask Dr. Ai"
              />
              <button
                type="submit"
                className="dr-ai-send w-12 h-12 rounded-full bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white flex items-center justify-center cursor-pointer hover:brightness-105 shadow-sm transition-all"
                aria-label="Send query"
              >
                ➤
              </button>
            </form>

            <Link
              href="/chat"
              className="flex items-center justify-between gap-4 rounded-2xl bg-[#eef5f0]/80 px-4 py-3 text-sm font-bold text-[#1b4332] transition-colors hover:bg-[#d8eee0] dark:bg-soft dark:text-ink dark:hover:bg-[#26352a] md:hidden"
            >
              <span>Open Dr. Ai for herbal questions</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
