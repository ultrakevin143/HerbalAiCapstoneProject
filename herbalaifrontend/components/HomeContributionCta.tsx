'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import OptimizedFillImage from './OptimizedFillImage';
import { Button } from './ui/button';

export default function HomeContributionCta() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-soft shadow-sm md:aspect-[4/3]">
          <OptimizedFillImage src="/images/lagundi.png" alt="Lagundi leaves representing traditional herbal knowledge sharing" sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover" />
        </div>
        <div className="space-y-6">
          <h2 className="font-serif-custom text-4xl font-semibold leading-tight text-ink md:text-5xl">Help us preserve our history</h2>
          <p className="text-base leading-7 text-muted">Join contributors who document local plant names, regional practices, and source publications for administrative review.</p>
          <Button asChild size="lg" className="px-8"><Link href={isAuthenticated ? '/suggest' : '/signup'}>{isAuthenticated ? 'Suggest a plant' : 'Become a contributor'}</Link></Button>
        </div>
      </div>
    </section>
  );
}
