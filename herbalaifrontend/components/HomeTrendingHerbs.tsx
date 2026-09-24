'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf } from 'lucide-react';
import { cachedApiGet } from '../lib/request-cache';
import OptimizedFillImage from './OptimizedFillImage';
import { Button } from './ui/button';

interface Herb {
  name: string;
  scientificName: string;
  image: string;
  photoBy: string;
  photoUrl: string;
  searchTerm: string;
  catalogId?: string;
}

interface CatalogHerb {
  id: string;
  localName: string;
  scientificName: string;
}

const featuredHerbs: Herb[] = [
  { name: 'Lagundi', scientificName: 'Vitex negundo', image: '/images/herbs/lagundi.jpg', photoBy: 'Greg III Espera', photoUrl: 'https://www.inaturalist.org/observations/10163763', searchTerm: 'lagundi' },
  { name: 'Sambong', scientificName: 'Blumea balsamifera', image: '/images/herbs/sambong.jpg', photoBy: 'Vreni Gem O. Caasi', photoUrl: 'https://www.inaturalist.org/observations/43861367', searchTerm: 'sambong' },
  { name: 'Bayabas', scientificName: 'Psidium guajava', image: '/images/herbs/bayabas.jpg', photoBy: 'Greg III Espera', photoUrl: 'https://www.inaturalist.org/observations/68443241', searchTerm: 'bayabas' },
];

export default function HomeTrendingHerbs() {
  const [herbs, setHerbs] = useState(featuredHerbs);

  useEffect(() => {
    cachedApiGet('/herbs/catalog', 60_000).then((response) => {
      const catalog: CatalogHerb[] | undefined = response.data?.data?.herbs;
      if (!Array.isArray(catalog)) return;

      setHerbs(featuredHerbs.map((herb) => {
        const record = catalog.find((item) => item.localName?.toLowerCase().trim() === herb.searchTerm);
        return record
          ? { ...herb, name: record.localName, scientificName: record.scientificName || herb.scientificName, catalogId: record.id }
          : herb;
      }));
    }).catch(() => undefined);
  }, []);

  return (
    <section className="px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-end md:justify-between md:gap-8">
          <h2 className="font-serif-custom text-4xl font-semibold text-ink md:text-5xl">Explore medicinal plants.</h2>
          <p className="max-w-[50ch] leading-7 text-muted">Start with familiar Philippine plants, then review each library record for preparation, safety notes, and sources.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {herbs.map((herb) => (
            <article key={herb.searchTerm} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-sm transition-colors hover:border-line-strong">
              <Link href={herb.catalogId ? `/library?id=${encodeURIComponent(herb.catalogId)}` : `/library?search=${encodeURIComponent(herb.searchTerm)}`} className="home-herb-link group flex flex-1 flex-col">
                <div className="relative flex h-44 items-center justify-center overflow-hidden bg-soft sm:h-48">
                  <Leaf className="h-14 w-14 text-accent/40" aria-hidden="true" />
                  <OptimizedFillImage src={herb.image} alt={herb.name} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { (event.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold tracking-tight text-ink">{herb.name}</h3>
                  <p className="mt-1 text-sm italic text-muted">{herb.scientificName}</p>
                  <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent">{herb.catalogId ? 'Open library record' : 'Find in library'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
              <p className="flex flex-wrap items-center gap-x-1 border-t border-line px-5 text-sm text-muted">Photo: <a className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink" href={herb.photoUrl}>{herb.photoBy}</a> · <a className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-ink" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
            </article>
          ))}
        </div>
        <div className="mt-8 text-center"><Button asChild variant="outline"><Link href="/library">View all herbs <ArrowRight aria-hidden="true" /></Link></Button></div>
      </div>
    </section>
  );
}
