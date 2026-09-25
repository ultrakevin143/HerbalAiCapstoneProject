'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../lib/axios';
import UserProfileModal from '../../components/UserProfileModal';
import EmptyState from '../../components/EmptyState';
import {
  Search,
  AlertCircle,
  MessageSquare,
  Pin,
  Heart,
  Eye,
} from 'lucide-react';

interface Thread {
  id: number;
  authorId: string;
  title: string;
  category: string;
  content: string;
  views: number;
  likes: number;
  replies: number;
  pinned: boolean;
  date: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    role: string;
  };
}

export default function CommunityPage() {
  const { isAuthenticated } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'growing' | 'safety' | 'recipes'>('all');

  // Profile popup state
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; name: string; avatar?: string | null; role: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleUserClick = (author: { id: string; name: string; avatar: string | null; role: string }) => {
    if (!author) return;
    setSelectedProfile({
      id: author.id,
      name: author.name,
      avatar: author.avatar,
      role: author.role,
    });
    setIsProfileModalOpen(true);
  };

  const categories = [
    { id: 'all', name: 'All Discussions', icon: '💬' },
    { id: 'growing', name: 'Growing & Care', icon: '🌱' },
    { id: 'safety', name: 'Dosage & Safety', icon: '🛡️' },
    { id: 'recipes', name: 'Herbal Recipes', icon: '🍵' },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const fetchThreads = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/forum/threads';
      const params = new URLSearchParams();
      if (activeCategory !== 'all') {
        params.append('category', activeCategory);
      }
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      const queryStr = params.toString();
      if (queryStr) {
        url += `?${queryStr}`;
      }

      const res = await api.get(url);
      if (res.data?.status === 'success') {
        setThreads(res.data.data.threads || []);
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to fetch threads:', err);
      setError(err.response?.data?.message || 'Failed to load discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchThreads();
  }, [fetchThreads]);

  const getCategoryLabel = (catId: string) => {
    switch (catId) {
      case 'growing':
        return 'Growing & Care';
      case 'safety':
        return 'Dosage & Safety';
      case 'recipes':
        return 'Herbal Recipes';
      default:
        return 'General Discussion';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="operational-page community-page min-h-screen flex flex-col font-sans text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Header Block */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-sans font-bold text-[#1b4332] dark:text-ink tracking-tight sm:text-4xl">
              Traditional Medicine Forum
            </h1>
            <p className="text-[#2d6a4f] dark:text-muted text-sm font-bold mt-1 max-w-xl">
              Share observations, recipe logs, and discuss safe preparations of Philippine medicinal plants.
            </p>
          </div>

          <div className="shrink-0">
            {isAuthenticated ? (
              <Link
                href="/community/new"
                className="btn inline-flex items-center gap-2 rounded-xl border-[#2d6a4f] bg-[#2d6a4f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1b4332]"
              >
                <span>Start discussion</span>
              </Link>
            ) : (
              <Link
                href="/signin?callbackUrl=/community/new"
                className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-sm px-6 py-3 rounded-full hover:bg-[#2d6a4f]/10 transition-all"
              >
                Sign In to Post
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column Sidebar: Categories */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-line bg-panel p-3 shadow-sm lg:p-5">
              <h2 className="hidden text-sm font-black text-[#1b4332] dark:text-ink uppercase tracking-wider border-b border-gray-100 dark:border-line pb-3 mb-4 lg:block">
                Categories
              </h2>
              <div className="category-rail flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:pb-0">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                      className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors lg:w-full lg:px-4 lg:py-3 ${
                        isActive
                          ? 'bg-[#eef5f0] dark:bg-soft text-[#1b4332] dark:text-ink border-[#2d6a4f]'
                          : 'border-line text-[#2d6a4f] dark:text-muted hover:bg-[#eef5f0] dark:hover:bg-soft hover:text-[#1b4332]'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guideline Banner */}
            <details className="rounded-2xl border border-line bg-panel p-4 text-sm text-muted lg:hidden">
              <summary className="cursor-pointer font-bold text-ink">Community safety guidelines</summary>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Respect traditional herbal heritage practices.</li>
                <li>Share observations rather than prescriptions.</li>
                <li>Cite DOH or PITAHC publications where possible.</li>
              </ul>
            </details>
            <div className="hidden rounded-2xl border border-line bg-panel p-5 text-xs font-semibold text-muted shadow-sm space-y-3 lg:block">
              <p className="font-black text-[#1b4332] dark:text-ink text-sm flex items-center gap-1.5">
                🛡️ Platform Guidelines
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-500 dark:text-muted">
                <li>Be respectful of traditional herbal heritage practices.</li>
                <li>Never prescribe; always speak of personal experiences or cited logs.</li>
                <li>Cite DOH or PITAHC publications where possible.</li>
              </ul>
            </div>
          </aside>

          {/* Right Column: Search & Thread list */}
          <section className="lg:col-span-3 space-y-6">
            {/* Search Input */}
            <div className="relative w-full bg-white/70 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-full p-3 px-4 shadow-sm flex items-center gap-3">
              <Search className="h-4 w-4 text-[#2d6a4f] dark:text-[#74c69d] shrink-0" />
              <input
                type="text"
                placeholder="Search discussion titles or content..."
                aria-label="Search discussion titles or content"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-[#1b4332] dark:text-ink font-semibold text-sm placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-gray-500 hover:text-[#1b4332] font-bold px-2 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error View */}
            {error && (
              <div className="p-4 border border-rose-200 bg-rose-50 text-rose-800 font-bold rounded-2xl text-sm flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Spinner */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-panel/60 border border-black/10 dark:border-line rounded-3xl shadow-sm gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2d6a4f] border-t-transparent"></div>
                <p className="text-[#2d6a4f] font-bold text-xs">Loading discussions...</p>
              </div>
            ) : threads.length === 0 ? (
              /* EMPTY STATE */
              <EmptyState
                icon={<MessageSquare />}
                title="No discussions match this view"
                description="Clear the search, choose another category, or start a discussion about Philippine medicinal-plant knowledge."
                action={isAuthenticated ? (
                  <Link
                    href="/community/new"
                    className="empty-state-primary-action"
                  >
                    Start a discussion
                  </Link>
                ) : undefined}
              />
            ) : (
              /* THREADS LIST */
              <div className="space-y-4">
                {threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/community/${thread.id}`}
                    className="block glass-card bg-white/50 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Avatar */}
                      <div 
                        className="h-11 w-11 rounded-full bg-[#eef5f0] dark:bg-soft border border-black/10 dark:border-line text-xs font-bold text-[#1b4332] dark:text-ink flex items-center justify-center shadow-xs cursor-pointer shrink-0 mt-0.5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUserClick(thread.author);
                        }}
                      >
                        {thread.author?.avatar?.startsWith('http') ? (
                          <img src={thread.author.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span>{thread.author?.name?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span 
                            className="text-xs font-bold text-[#1b4332] dark:text-ink hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUserClick(thread.author);
                            }}
                          >
                            {thread.author?.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-muted">
                            • {formatDate(thread.date)}
                          </span>
                          {thread.pinned && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1">
                              <Pin className="h-2.5 w-2.5" />
                              Pinned
                            </span>
                          )}
                          <span className="text-[10px] bg-[#eef5f0] dark:bg-soft border border-[#2d6a4f]/20 text-[#2d6a4f] dark:text-[#74c69d] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            {getCategoryLabel(thread.category)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[#1b4332] dark:text-ink group-hover:text-[#40916c] transition-colors line-clamp-2 sm:line-clamp-1 mb-1 font-serif-custom italic [overflow-wrap:anywhere]">
                          {thread.title}
                        </h3>

                        <p className="text-gray-600 dark:text-muted text-xs leading-relaxed line-clamp-2">
                          {thread.content}
                        </p>

                        {/* Counts Row */}
                        <div className="flex items-center gap-5 mt-3 text-xs font-semibold text-gray-500 dark:text-muted">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-gray-400" />
                            <span>{thread.likes}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                            <span>{thread.replies}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-gray-400" />
                            <span>{thread.views}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Floating Action Button */}
      <Link
        href="/chat"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#2d6a4f] px-5 py-3 text-xs font-bold text-white shadow-lg transition-colors hover:bg-[#1b4332]"
      >
        <span>Ask Dr. Ai</span>
      </Link>

      <UserProfileModal 
        userProfile={selectedProfile} 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <Footer />
    </div>
  );
}
