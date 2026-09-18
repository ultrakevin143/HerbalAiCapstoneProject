'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import OptimizedFillImage from './OptimizedFillImage';

export default function HomeContributionCta() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="px-6 py-16 bg-transparent">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="relative border border-black/10 dark:border-line rounded-3xl overflow-hidden shadow-md aspect-video md:aspect-[4/3] bg-gradient-to-br from-[#d8f3dc] to-[#74c69d]">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1b4332]" aria-hidden="true">
            <span className="text-7xl">🌿</span>
            <span className="mt-3 font-serif-custom italic text-xl">Traditional herbal knowledge</span>
          </div>
          <OptimizedFillImage
            src="/images/lagundi.png"
            alt="Lagundi leaves representing traditional herbal knowledge sharing"
            sizes="(max-width: 768px) 100vw, 50vw"
            className="z-10 w-full h-full object-cover"
          />
        </div>
        <div className="space-y-6">
          <h2 className="font-serif-custom italic font-normal text-4xl md:text-5xl text-[#1b4332] dark:text-ink leading-tight">
            Help us Preserve our History
          </h2>
          <p className="text-base font-bold text-[#2d6a4f] dark:text-muted leading-relaxed">
            Join our community of contributors and share your knowledge of traditional Philippine herbal medicine. Together, we can build a comprehensive digital repository that honors our ancestors&apos; wisdom and makes it accessible for generations to come.
          </p>
          <Link
            href={isAuthenticated ? '/suggest' : '/signup'}
            className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-base px-8 py-3.5 rounded-full shadow-sm hover:brightness-105 transition-all inline-block"
          >
            {isAuthenticated ? 'Suggest a New Herb' : 'Become a Contributor'}
          </Link>
        </div>
      </div>
    </section>
  );
}
