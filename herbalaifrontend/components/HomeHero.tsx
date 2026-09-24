'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import DrAiAvatar from './DrAiAvatar';
import { ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function HomeHero() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const isStaff = user && (user.role === 'admin' || user.role === 'botanist');

  return (
    <section className="home-hero relative flex min-h-0 flex-col justify-between pb-8 pt-8 sm:pb-12 sm:pt-12 md:min-h-[calc(100svh-64px)] lg:pb-16 lg:pt-16">
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-7 px-4 sm:px-6 md:flex-1 md:grid-cols-12 md:gap-6 lg:gap-12">
        <div className="space-y-5 md:col-span-6 md:space-y-4 lg:col-span-7 lg:space-y-6">
          <h1 className="font-serif-custom text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-white sm:text-5xl md:text-[3.5rem] lg:text-[5.5rem] xl:text-[6rem]">
            Herbal <span className="text-[#b9dfbf]">AI</span>
          </h1>

          <p className="max-w-[520px] text-base leading-[1.6] text-white/90 lg:text-xl">
            {isAuthenticated
              ? isStaff
                ? 'Review community submissions from the Admin Panel, or explore the public catalog as a member.'
                : 'Your personalized hub for validated Philippine herbal medicine and AI-assisted preparation guides.'
              : 'Find Philippine medicinal plants, review source-linked preparation guidance, and ask safer questions with Dr. Ai.'}
          </p>

          <div className={`${isAuthenticated ? 'grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:flex lg:flex-wrap' : 'flex flex-wrap'} gap-3 pt-2 lg:gap-4`}>
            <Button asChild size="lg" className={isAuthenticated ? 'w-full lg:w-auto lg:px-8' : 'lg:px-8'}><Link href="/library">Browse herbs</Link></Button>
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline" size="lg" className="w-full border-white/55 bg-[#17251d]/35 text-white hover:bg-[#17251d]/65 lg:w-auto lg:px-8"><Link href="/suggest">Suggest Herb</Link></Button>
                {isStaff && <Button asChild variant="outline" size="lg" className="w-full border-white/55 bg-[#17251d]/35 text-white hover:bg-[#17251d]/65 min-[360px]:col-span-2 sm:col-span-1 md:col-span-2 lg:w-auto lg:px-8"><Link href="/admin">Admin Panel</Link></Button>}
              </>
            ) : null}
          </div>
        </div>

        <div className="w-full md:col-span-6 lg:col-span-5">
          <div className="flex flex-col rounded-2xl bg-panel p-5 shadow-sm lg:p-6">
            <div className="flex items-center gap-3">
              <DrAiAvatar className="h-12 w-12 text-ink" />
              <div><h2 className="text-base font-bold text-ink">Dr. Ai</h2><span className="text-sm text-muted">Herbal library assistant</span></div>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted">
              {isAuthenticated ? 'Ask about documented plant uses, preparation, or safety notes.' : 'Sign in to ask about documented plant uses, preparation, or safety notes.'}
            </p>

            {isAuthenticated ? (
              <>
                <form onSubmit={(event) => { event.preventDefault(); if (query.trim()) router.push(`/chat?q=${encodeURIComponent(query.trim())}`); }} className="mt-4 hidden gap-2 md:flex">
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} type="text" placeholder="e.g. What is lagundi used for?" className="h-12 min-w-0 flex-1 bg-canvas" aria-label="Ask Dr. Ai about a plant" />
                  <Button type="submit" size="icon" className="h-12 w-12 shrink-0" aria-label="Send query" disabled={!query.trim()}><ArrowUp aria-hidden="true" /></Button>
                </form>
                <Button asChild variant="secondary" className="mt-5 h-auto min-h-12 justify-between px-4 md:hidden"><Link href="/chat"><span>Open Dr. Ai</span><ArrowUp className="rotate-45" aria-hidden="true" /></Link></Button>
              </>
            ) : (
              <Button asChild variant="secondary" className="mt-4 h-auto min-h-12 justify-between px-4"><Link href="/chat"><span>Sign in to ask Dr. Ai</span><ArrowUp className="rotate-45" aria-hidden="true" /></Link></Button>
            )}
            <p className="mt-4 text-xs leading-5 text-muted">Educational information only. Dr. Ai does not diagnose or prescribe.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
