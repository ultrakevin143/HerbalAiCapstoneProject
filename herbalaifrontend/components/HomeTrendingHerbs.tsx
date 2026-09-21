'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cachedApiGet } from '../lib/request-cache';
import OptimizedFillImage from './OptimizedFillImage';

interface Herb {
  id: string;
  name: string;
  scientificName: string;
  akaName: string;
  verified: boolean;
  image: string;
}

const fallbackHerbs: Herb[] = [
  { id: 'lagundi', name: 'LAGUNDI', scientificName: 'Vitex negundo', akaName: 'Aka Five-leaved Chaste Tree', verified: true, image: '/images/lagundi.png' },
  { id: 'sambong', name: 'SAMBONG', scientificName: 'Blumea balsamifera', akaName: 'Aka Ngai Camphor', verified: true, image: '/images/sambong.png' },
  { id: 'yerba-buena', name: 'YERBA BUENA', scientificName: 'Clinopodium douglasii', akaName: 'Aka Peppermint', verified: true, image: '' },
  { id: 'bayabas', name: 'BAYABAS', scientificName: 'Psidium guajava', akaName: 'Aka Guava', verified: true, image: '/images/bayabas.png' },
];

export default function HomeTrendingHerbs() {
  const router = useRouter();
  const [herbs, setHerbs] = useState(fallbackHerbs);

  useEffect(() => {
    cachedApiGet('/herbs/catalog', 60_000).then((response) => {
      const list = response.data?.data?.herbs ?? [];
      const mapped = ['lagundi', 'sambong', 'yerba buena', 'bayabas'].map((target) => {
        const found = list.find((herb: { localName: string }) => herb.localName.toLowerCase().trim().includes(target));
        return found ? {
          id: found.id,
          name: found.localName.toUpperCase(),
          scientificName: found.scientificName,
          akaName: found.cebuanoName ? `Aka ${found.cebuanoName}` : '',
          verified: true,
          image: found.imageUrl || '',
        } : null;
      }).filter(Boolean) as Herb[];
      if (mapped.length) setHerbs(mapped);
    }).catch(() => undefined);
  }, []);

  return (
    <section className="px-6 py-16 bg-transparent">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif-custom italic font-normal text-center text-4xl md:text-5xl text-[#1b4332] dark:text-ink mb-4">
          Trending Medicinal Plants
        </h2>
        <p className="text-center font-bold text-[#2d6a4f] dark:text-muted mb-12 max-w-md mx-auto">
          Explore some of the most popular scientifically backed traditional plants in the Philippines.
        </p>
        <div className="herb-figma-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {herbs.map((herb) => (
            <article
              key={herb.id}
              onClick={() => router.push(herb.id.startsWith('h-') ? `/library?id=${herb.id}` : `/library?search=${encodeURIComponent(herb.name.toLowerCase())}`)}
              className="glass-card herb-figma-card bg-white/45 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer flex flex-col group"
            >
              <div className="herb-figma-img h-52 bg-gradient-to-r from-[#40916c] to-[#74c69d] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40">🌿</div>
                {herb.image && (
                  <OptimizedFillImage
                    src={herb.image}
                    alt={herb.name}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105 opacity-85"
                    onError={(event) => {
                      (event.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {herb.verified && (
                  <span className="herb-figma-badge absolute top-4 right-4 bg-[#2d6a4f] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full z-10 shadow-sm">
                    Verified
                  </span>
                )}
              </div>
              <div className="herb-figma-body p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif-custom italic font-normal text-xl text-[#1b4332] dark:text-ink mb-1">
                    {herb.name}
                  </h3>
                  <p className="herb-figma-sci text-xs italic text-gray-500 dark:text-muted">
                    {herb.scientificName}
                  </p>
                </div>
                <p className="herb-figma-aka text-xs text-[#40916c] dark:text-[#74c69d] border-t border-[#1b4332]/10 dark:border-line pt-3 mt-2 line-clamp-2 font-medium">
                  {herb.akaName}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/library"
            className="btn btn-outline border-2 border-[#2d6a4f] dark:border-[#74c69d] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-[#2d6a4f]/10 transition-all inline-block"
          >
            View All Herbs →
          </Link>
        </div>
      </div>
    </section>
  );
}
