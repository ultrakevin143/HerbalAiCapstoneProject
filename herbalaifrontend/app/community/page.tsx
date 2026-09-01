'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../lib/axios';
import UserProfileModal from '../../components/UserProfileModal';

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

  const fetchThreads = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/forum/threads';
      const params = new URLSearchParams();
      if (activeCategory !== 'all') {
        params.append('category', activeCategory);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      const queryStr = params.toString();
      if (queryStr) {
        url += `?${queryStr}`;
      }

      const res = await api.get(url);
      if (res.data?.status === 'success') {
        setThreads(res.data.data.threads || []);
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error('Failed to fetch threads:', err);
      setError(err.response?.data?.message || 'Failed to load discussions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchTerm]);

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
        return catId;
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
    <div className="min-h-screen flex flex-col bg-green-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {/* Header Block */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-xs font-black text-green-700 shadow-sm uppercase tracking-wider mb-3">
              👥 Observation & Community Board
            </span>
            <h1 className="text-4xl font-serif-custom font-black italic text-[#1b4332] tracking-tight">
              Traditional Medicine Forum
            </h1>
            <p className="text-[#2d6a4f] text-sm font-bold mt-1 max-w-xl">
              Share observations, recipe logs, and discuss safe preparations of Philippine medicinal plants.
            </p>
          </div>

          <div className="flex-shrink-0">
            {isAuthenticated ? (
              <Link
                href="/community/new"
                className="flat-button flat-button-primary !py-3 !px-6 text-sm"
              >
                ➕ Start Discussion
              </Link>
            ) : (
              <Link
                href="/signin?callbackUrl=/community/new"
                className="flat-button flat-button-secondary !py-3 !px-6 text-sm"
              >
                Sign In to Post
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Column Sidebar: Categories */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-black text-[#1b4332] uppercase tracking-wider border-b border-gray-100 pb-3 mb-4">
                Categories
              </h2>
              <div className="flex flex-col gap-1.5">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold border-2 border-transparent transition-all ${
                        isActive
                          ? 'bg-[#eef5f0] text-[#1b4332] border-[#2d6a4f]'
                          : 'text-[#2d6a4f] hover:bg-[#eef5f0] hover:text-[#1b4332]'
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
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-xs font-semibold text-[#2d6a4f] space-y-3">
              <p className="font-black text-[#1b4332] text-sm flex items-center gap-1.5">
                🛡️ Platform Guidelines
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-500">
                <li>Be respectful of traditional herbal heritage practices.</li>
                <li>Never prescribe; always speak of personal experiences or cited logs.</li>
                <li>Cite DOH or PITAHC publications where possible.</li>
              </ul>
            </div>
          </aside>

          {/* Right Column: Search & Thread list */}
          <section className="lg:col-span-3 space-y-6">
            {/* Search Input */}
            <div className="relative w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <span className="text-xl text-[#2d6a4f]">🔍</span>
              <input
                type="text"
                placeholder="Search discussion titles or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-[#1b4332] font-semibold text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-gray-400 hover:text-gray-600 font-extrabold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error View */}
            {error && (
              <div className="p-4 border border-rose-200 bg-rose-50 text-rose-800 font-extrabold rounded-xl text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Loading Spinner */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
                <p className="text-[#2d6a4f] font-extrabold text-sm animate-pulse">Loading discussion threads...</p>
              </div>
            ) : threads.length === 0 ? (
              /* EMPTY STATE */
              <div className="flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-[#2d6a4f]/25 bg-white p-16 shadow-sm">
                <span className="text-6xl mb-4">🍃</span>
                <h3 className="font-serif-custom text-2xl font-black text-[#1b4332]">No Discussions Yet</h3>
                <p className="mt-2 text-sm text-gray-500 font-bold max-w-sm leading-relaxed">
                  There are currently no discussion threads in this category. The administrator or verified botanical experts will start by creating the platform welcome topic soon!
                </p>
                {isAuthenticated && (
                  <Link
                    href="/community/new"
                    className="flat-button flat-button-primary mt-6 text-sm"
                  >
                    Start the First Discussion
                  </Link>
                )}
              </div>
            ) : (
              /* THREADS LIST */
              <div className="space-y-4">
                {threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/community/${thread.id}`}
                    className="block bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div 
                        className="h-12 w-12 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] border-2 border-white text-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUserClick(thread.author);
                        }}
                      >
                        {thread.author?.avatar || '👤'}
                      </div>

                      {/* Summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span 
                            className="text-xs font-black text-[#1b4332] hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUserClick(thread.author);
                            }}
                          >
                            {thread.author?.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            • {formatDate(thread.date)}
                          </span>
                          {thread.pinned && (
                            <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                              📌 Pinned
                            </span>
                          )}
                          <span className="text-[10px] bg-[#eef5f0] border border-[#2d6a4f]/20 text-[#2d6a4f] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                            {getCategoryLabel(thread.category)}
                          </span>
                        </div>

                        <h3 className="font-serif-custom text-xl font-black text-[#1b4332] group-hover:text-[#2d6a4f] transition-colors line-clamp-1 mb-2">
                          {thread.title}
                        </h3>

                        <p className="text-gray-500 font-semibold text-xs leading-relaxed line-clamp-2">
                          {thread.content}
                        </p>

                        {/* Counts Row */}
                        <div className="flex items-center gap-6 mt-4 text-xs font-bold text-gray-400">
                          <span className="flex items-center gap-1.5">
                            ❤️ {thread.likes} likes
                          </span>
                          <span className="flex items-center gap-1.5">
                            💬 {thread.replies} replies
                          </span>
                          <span className="flex items-center gap-1.5">
                            👁️ {thread.views} views
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

      {/* Floating Action Button (FAB) redirecting to Dr. AI chat */}
      <Link
        href="/chat"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-[#2d6a4f] to-[#52b788] text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:brightness-105 active:scale-95 transition-all text-sm font-extrabold cursor-pointer border-2 border-white/20"
      >
        <span>🤖</span>
        <span>Ask Dr. AI</span>
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
