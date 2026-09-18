'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import api from '../../../lib/axios';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function NewThreadPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories match database expectations
  const categories = [
    { id: 'growing', name: 'Growing & Care' },
    { id: 'safety', name: 'Dosage & Safety' },
    { id: 'recipes', name: 'Herbal Recipes' },
  ];

  // Protect client side transition
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?callbackUrl=/community/new');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!title.trim()) {
      setError('Title is required.');
      setIsSubmitting(false);
      return;
    }

    if (!category) {
      setError('Please select a discussion category.');
      setIsSubmitting(false);
      return;
    }

    if (!content.trim()) {
      setError('Discussion content is required.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/forum/threads', {
        title: title.trim(),
        category,
        content: content.trim(),
      });

      if (res.data?.status === 'success') {
        const newThread = res.data.data.thread;
        router.push(`/community/${newThread.id}`);
      } else {
        throw new Error(res.data?.message || 'Failed to publish thread.');
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to create thread:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'An unexpected error occurred while posting your discussion. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f0f7f2] dark:bg-canvas">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
            <p className="font-extrabold text-[#1b4332] dark:text-ink">Verifying session details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans text-ink">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        {/* Header section */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/community')}
              className="text-xs font-bold text-[#2d6a4f] dark:text-[#74c69d] hover:underline inline-flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Discussions</span>
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 dark:border-line bg-green-50 dark:bg-soft px-3 py-1 text-xs font-black text-green-700 dark:text-green-300 uppercase tracking-wider mb-2 block w-fit shadow-xs">
              <span>💬 Community Forum</span>
            </div>
            <h1 className="font-serif-custom italic text-3xl sm:text-4xl font-black text-[#1b4332] dark:text-ink tracking-tight">
              Start a Discussion
            </h1>
            <p className="text-[#2d6a4f] dark:text-muted text-sm font-semibold mt-1">
              Ask questions, share traditional plant wisdom, or start a dialogue with the community.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-bold rounded-2xl shadow-xs text-sm flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Discussion Editor Form */}
        <form onSubmit={handleSubmit} className="glass-card bg-white/55 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="title">
              Discussion Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              disabled={isSubmitting}
              placeholder="e.g. Experiences with Lagundi tea for persistent cough?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c]"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="category">
              Select Category <span className="text-rose-600">*</span>
            </label>
            <select
              id="category"
              required
              disabled={isSubmitting}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-[#40916c]"
            >
              <option value="" disabled>Select a topic...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-[#1b4332] dark:text-ink mb-2" htmlFor="content">
              Discussion Content <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="content"
              required
              rows={8}
              disabled={isSubmitting}
              placeholder="Share your detailed thoughts, observations, preparation steps, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink font-semibold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#40916c] leading-relaxed"
            />
          </div>

          {/* Form Actions */}
          <div className="border-t border-[#1b4332]/10 dark:border-line pt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.push('/community')}
              disabled={isSubmitting}
              className="btn btn-outline border border-black/20 text-[#1b4332] dark:text-ink font-semibold text-sm px-6 py-3 rounded-full hover:bg-black/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-sm px-8 py-3 rounded-full shadow-sm hover:brightness-105 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Publishing Topic...' : 'Publish Discussion'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
