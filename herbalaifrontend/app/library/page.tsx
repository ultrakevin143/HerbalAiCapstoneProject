'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import AccessibleDialog from '../../components/AccessibleDialog';
import HerbComments from '../../components/HerbComments';
import HerbReferences, { type HerbSource } from '../../components/HerbReferences';
import {
  ShieldCheck,
  Search,
  Leaf,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { cachedApiGet } from '../../lib/request-cache';
import OptimizedFillImage from '../../components/OptimizedFillImage';
import EmptyState from '../../components/EmptyState';

interface Herb {
  id: string;
  localName: string;
  cebuanoName?: string;
  scientificName: string;
  category: string;
  medicinalUses: string;
  preparationMethod: string;
  dosage: string;
  regionFound?: string;
  warnings?: string;
  imageUrl?: string;
  imageCreator?: string;
  imageSourceUrl?: string;
  imageLicense?: string;
  imageLicenseUrl?: string;
  imageModification?: string;
  isDohApproved?: boolean;
  evidenceClass?: string;
  sources?: HerbSource[];
  createdAt: string;
}

function LibraryContent() {
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHerbs, setTotalHerbs] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Search and Filter State
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || searchParams.get('search');
  const idQuery = searchParams.get('id');
  const [searchTerm, setSearchTerm] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyDohApproved, setOnlyDohApproved] = useState(false);
  
  // Modal for viewing details
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    cachedApiGet('/herbs/categories', 60_000).then((response) => {
      setCategories(['All', ...(response.data.data.categories || [])]);
    }).catch(() => setError('Unable to load herb categories.'));
  }, []);

  // Open linked herbs even when they are not on the current list page.
  useEffect(() => {
    if (!idQuery) return;
    let cancelled = false;
    cachedApiGet(`/herbs/${encodeURIComponent(idQuery)}`, 60_000).then((response) => {
      if (!cancelled && response.data.status === 'success') setSelectedHerb(response.data.data.herb);
    }).catch(() => { if (!cancelled) setError('Linked herb was not found.'); });
    return () => { cancelled = true; };
  }, [idQuery]);

  useEffect(() => {
    if (!searchQuery) return;
    const timer = window.setTimeout(() => { setSearchTerm(searchQuery); setPage(1); }, 0);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const fetchHerbs = async () => {
      try {
        setFetching(true);
        setError(null);
        const params = new URLSearchParams({ page: String(page), limit: '12' });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedCategory !== 'All') params.set('category', selectedCategory);
        if (onlyDohApproved) params.set('isDohApproved', 'true');
        const response = await cachedApiGet(`/herbs?${params}`, 60_000);
        if (cancelled) return;
        const res = response.data;
        if (res.status === 'success') {
          setHerbs(res.data.herbs || []);
          if (searchQuery && debouncedSearch.toLowerCase() === searchQuery.trim().toLowerCase()) {
            const query = searchQuery.trim().toLowerCase();
            const match = (res.data.herbs as Herb[]).find((herb) => herb.localName.toLowerCase() === query || herb.scientificName.toLowerCase() === query);
            if (match) setSelectedHerb(match);
          }
          setTotalPages(Math.max(1, res.data.totalPages || 1));
          setTotalHerbs(res.data.total || 0);
        } else {
          setError('Failed to fetch herbs.');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Error connecting to server.';
        setError(message);
      } finally {
        if (!cancelled) { setLoading(false); setFetching(false); }
      }
    };

    fetchHerbs();
    return () => { cancelled = true; };
  }, [page, debouncedSearch, selectedCategory, onlyDohApproved, searchQuery]);

  const filteredHerbs = herbs;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex-1 w-full" role="status" aria-label="Loading herbal library">
          <div className="mb-8 text-center">
            <h1 className="font-serif-custom italic text-3xl text-[#1b4332] dark:text-ink md:text-5xl">Herbal Library</h1>
            <p className="mt-4 text-sm text-muted">Loading Philippine medicinal plants...</p>
          </div>
          <div className="mx-auto mb-8 h-12 max-w-4xl rounded-full bg-[#2d6a4f]/10 dark:bg-panel animate-pulse motion-reduce:animate-none" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-black/10 dark:border-line bg-white/45 dark:bg-panel/75">
                <div className="h-52 bg-[#2d6a4f]/10 dark:bg-soft animate-pulse motion-reduce:animate-none" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 rounded bg-[#2d6a4f]/10 dark:bg-soft animate-pulse motion-reduce:animate-none" />
                  <div className="h-3 w-1/2 rounded bg-[#2d6a4f]/10 dark:bg-soft animate-pulse motion-reduce:animate-none" />
                  <div className="h-12 rounded bg-[#2d6a4f]/10 dark:bg-soft animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ink">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Header */}
        <div className="library-header mb-8 text-center">
          <h1 className="font-serif-custom italic font-normal text-3xl text-[#1b4332] dark:text-ink md:text-5xl mb-4 leading-none">
            Herbal Library
          </h1>
          <p className="mt-2 text-sm text-[#2d6a4f] dark:text-muted font-medium max-w-2xl mx-auto">
            Explore validated Philippine medicinal plants, their traditional uses, DOH guidelines, and preparations.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row items-center gap-3 max-w-4xl mx-auto w-full">
          {/* Search Input */}
          <div className="library-search flex-1 relative flex items-center bg-white/70 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-full h-[48px] px-4 w-full shadow-xs">
            <input
              type="text"
              placeholder="Search by name, scientific name, or uses..."
              aria-label="Search herbs by name, scientific name, or medicinal use"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="search-input w-full bg-transparent border-none text-sm text-[#1b4332] dark:text-ink placeholder-gray-500 pl-8 focus:outline-none"
            />
            <span className="absolute left-4 text-gray-500 pointer-events-none">
              <Search className="h-4 w-4" />
            </span>
          </div>

          {/* DOH Validated Filter Toggle */}
          <button
            type="button"
            onClick={() => { setOnlyDohApproved(!onlyDohApproved); setPage(1); }}
            className={`h-[48px] px-5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 border ${
              onlyDohApproved
                ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-sm'
                : 'bg-white/70 dark:bg-panel/75 text-[#1b4332] dark:text-ink border-black/10 dark:border-line hover:bg-[#eef5f0] dark:hover:bg-soft'
            }`}
          >
            <ShieldCheck className={`h-4 w-4 ${onlyDohApproved ? 'text-[#74c69d]' : 'text-[#2d6a4f]'}`} />
            <span>DOH Validated</span>
          </button>

          {/* Category Selector */}
          <div className="w-full md:w-56 shrink-0">
            <select
              aria-label="Filter herbs by category"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="library-filter-btn h-[48px] w-full border border-black/10 dark:border-line bg-white/70 dark:bg-panel/75 backdrop-blur-md rounded-full px-5 text-sm font-semibold text-[#1b4332] dark:text-ink appearance-none focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%231b4332' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
                backgroundPosition: 'right 16px center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 font-bold shadow-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="mb-4 text-sm text-muted" aria-live="polite">{fetching ? 'Updating herbs...' : `${totalHerbs} herbs found`}</p>

        {/* Herbs Grid */}
        {filteredHerbs.length === 0 ? (
          <EmptyState
            icon={<Leaf />}
            title="No herbs match these filters"
            description="Clear the search or choose another category to view the published Philippine medicinal-plant records."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHerbs.map((herb) => (
              <div
                key={herb.id}
                onClick={() => setSelectedHerb(herb)}
                className="glass-card herb-figma-card library-herb-card group flex flex-col rounded-3xl border border-black/10 dark:border-line bg-white/45 dark:bg-panel/75 backdrop-blur-md overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {/* Image & Category Overlay */}
                <div className="herb-figma-img h-52 w-full bg-gradient-to-r from-[#40916c] to-[#74c69d] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-white/30">
                    <Leaf className="h-16 w-16 stroke-[1.5]" />
                  </div>
                  {herb.imageUrl && herb.imageUrl.trim() !== '' && (
                    <OptimizedFillImage
                      src={herb.imageUrl}
                      alt={herb.localName}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  {/* DOH Badge */}
                  {herb.isDohApproved && (
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-[#1b4332] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full z-10 shadow">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#74c69d]" />
                      <span>DOH Approved</span>
                    </span>
                  )}

                  <span className="herb-figma-badge absolute top-4 right-4 bg-[#2d6a4f] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full z-10">
                    {herb.category}
                  </span>
                </div>

                {/* Info Body */}
                <div className="herb-figma-body p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <h2 className="font-serif-custom italic font-normal text-xl text-[#1b4332] dark:text-ink">
                      {herb.localName}
                    </h2>
                    <p className="herb-figma-sci text-xs italic text-gray-500 dark:text-muted mt-1">
                      {herb.scientificName} {herb.cebuanoName ? `(${herb.cebuanoName})` : ''}
                    </p>
                    
                    <p className="text-sm font-semibold text-[#2d6a4f] dark:text-muted line-clamp-3 mt-3">
                      {herb.medicinalUses}
                    </p>
                  </div>

                  <div className="herb-figma-link mt-4 flex items-center justify-between text-xs text-[#40916c] dark:text-[#74c69d] font-bold border-t border-[#1b4332]/10 dark:border-line pt-3">
                    <span>View preparation & dosage</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Herb pages" className="mt-8 flex items-center justify-center gap-4 text-sm text-ink">
            <button type="button" disabled={page === 1 || fetching} onClick={() => setPage((current) => current - 1)} className="rounded-full border border-line px-4 py-2 disabled:opacity-40">Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages || fetching} onClick={() => setPage((current) => current + 1)} className="rounded-full border border-line px-4 py-2 disabled:opacity-40">Next</button>
          </nav>
        )}

        {/* Detail Modal */}
        {selectedHerb && (
          <AccessibleDialog label={`${selectedHerb.localName} details`} onClose={() => { setSelectedHerb(null); setIsImageExpanded(false); }}>
            <div className="flex flex-col md:flex-row gap-6 border-b-2 border-[#eef5f0] dark:border-line pb-6 mb-6">
              <div
                onClick={() => selectedHerb.imageUrl && selectedHerb.imageUrl.trim() !== '' && setIsImageExpanded(true)}
                className={`h-40 w-full md:w-40 bg-[#eef5f0] dark:bg-soft rounded-xl border border-gray-200 dark:border-line relative overflow-hidden flex items-center justify-center shrink-0 ${
                  selectedHerb.imageUrl && selectedHerb.imageUrl.trim() !== '' ? 'cursor-zoom-in group/img' : ''
                }`}
              >
                {selectedHerb.imageUrl && selectedHerb.imageUrl.trim() !== '' ? (
                  <>
                    <OptimizedFillImage
                      src={selectedHerb.imageUrl}
                      alt={selectedHerb.localName}
                      sizes="(max-width: 768px) 100vw, 160px"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 bg-white/90 text-sm p-2 rounded-full shadow-md pointer-events-none flex items-center justify-center">
                        <Search className="h-4 w-4 text-[#1b4332]" />
                      </span>
                    </div>
                  </>
                ) : (
                  <Leaf className="h-16 w-16 text-[#2d6a4f]/30 stroke-[1.5]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block rounded-full bg-green-50 dark:bg-soft border border-green-200 dark:border-line px-3 py-1 text-xs font-extrabold text-green-700 dark:text-green-300">
                    {selectedHerb.category}
                  </span>
                  {selectedHerb.isDohApproved && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1b4332] text-white px-2.5 py-1 text-xs font-extrabold">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#74c69d]" />
                      <span>DOH Approved</span>
                    </span>
                  )}
                </div>
                <h2 className="font-serif-custom text-3xl font-black text-[#1b4332] dark:text-ink">
                  {selectedHerb.localName}
                </h2>
                <p className="text-sm italic text-[#40916c] dark:text-[#74c69d] font-semibold">
                  {selectedHerb.scientificName} {selectedHerb.cebuanoName ? `(${selectedHerb.cebuanoName})` : ''}
                </p>
              </div>
            </div>

            {/* DOH Official Endorsement Banner */}
            {selectedHerb.isDohApproved && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#e8f5e9] dark:bg-soft border border-[#a3ef95]/60 dark:border-line text-[#1b4332] dark:text-ink text-xs font-bold mb-6">
                <ShieldCheck className="h-5 w-5 text-[#2d6a4f] shrink-0" />
                <span>Included among the medicinal plants recognized in Philippine Department of Health reference materials.</span>
              </div>
            )}

            <div className="space-y-6 text-[#1b4332] dark:text-ink flex-1">
              <div>
                <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#6a7282] dark:text-muted mb-1">Medicinal Uses</h4>
                <p className="text-sm font-semibold leading-relaxed bg-[#eef5f0]/50 dark:bg-soft rounded-xl p-3 border border-[#2d6a4f]/10 dark:border-line">
                  {selectedHerb.medicinalUses}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#6a7282] dark:text-muted mb-1">Preparation Method</h4>
                  <p className="text-sm font-semibold leading-relaxed bg-[#eef5f0]/50 dark:bg-soft rounded-xl p-3 border border-[#2d6a4f]/10 dark:border-line">
                    {selectedHerb.preparationMethod}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#6a7282] dark:text-muted mb-1">Dosage & Frequency</h4>
                  <p className="text-sm font-semibold leading-relaxed bg-[#eef5f0]/50 dark:bg-soft rounded-xl p-3 border border-[#2d6a4f]/10 dark:border-line">
                    {selectedHerb.dosage}
                  </p>
                </div>
              </div>

              {selectedHerb.regionFound && (
                <div>
                  <h4 className="text-xs font-extrabold tracking-wider uppercase text-[#6a7282] dark:text-muted mb-1">Region Found</h4>
                  <p className="text-sm font-semibold bg-[#eef5f0]/50 dark:bg-soft rounded-xl p-3 border border-[#2d6a4f]/10 dark:border-line">
                    {selectedHerb.regionFound}
                  </p>
                </div>
              )}

              {selectedHerb.warnings && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs font-semibold text-amber-800 dark:text-amber-200 shadow-sm">
                  <span className="font-extrabold flex items-center gap-1.5 text-amber-900 dark:text-amber-100 mb-1.5 uppercase tracking-wider">
                    <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>Important Warnings & Precautions:</span>
                  </span>
                  {selectedHerb.warnings}
                </div>
              )}

              <HerbReferences sources={selectedHerb.sources} />
              <HerbComments herbId={selectedHerb.id} />
            </div>
          </AccessibleDialog>
        )}

        {/* Lightbox / Image Full View */}
        {isImageExpanded && selectedHerb?.imageUrl && (
          <AccessibleDialog label={`Image of ${selectedHerb.localName}`} onClose={() => setIsImageExpanded(false)}>
            <div className="relative max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center">
              <img
                src={selectedHerb.imageUrl}
                alt={selectedHerb.localName}
                className="max-w-full md:max-w-3xl lg:max-w-5xl h-auto max-h-[75vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
              <p className="mt-3 text-center text-sm font-bold text-[#1b4332] dark:text-ink">
                {selectedHerb.localName} <span className="italic text-gray-500">({selectedHerb.scientificName})</span>
              </p>
            </div>
          </AccessibleDialog>
        )}
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-transparent">
          <Navbar />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
            <p className="text-[#2d6a4f] font-extrabold animate-pulse">Loading Herbal Library...</p>
          </div>
        </div>
      }
    >
      <LibraryContent />
    </Suspense>
  );
}
