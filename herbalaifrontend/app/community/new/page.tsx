'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import api from '../../../lib/axios';

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
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
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
      <div className="min-h-screen flex flex-col bg-green-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
            <p className="font-extrabold text-[#1b4332]">Verifying session details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        {/* Header section */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <button
              onClick={() => router.push('/community')}
              className="text-xs font-black text-[#2d6a4f] hover:underline flex items-center gap-1 mb-2"
            >
              ← Back to Discussions
            </button>
            <h1 className="text-3xl font-serif-custom font-black italic text-[#1b4332] tracking-tight">
              Start a New Discussion
            </h1>
            <p className="text-[#2d6a4f] font-bold text-sm mt-0.5">
              Ask questions or log observations about Filipino herbal remedies.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-rose-200 bg-rose-50 text-rose-800 font-extrabold rounded-xl shadow-sm text-sm flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-black text-rose-950">Publishing Issue Detected</p>
              <p className="mt-0.5 font-bold">{error}</p>
            </div>
          </div>
        )}

        {/* Discussion Editor Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 lg:p-8 shadow-xl space-y-6">
          <div>
            <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="title">
              Discussion Title <span className="text-rose-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              disabled={isSubmitting}
              placeholder="e.g. My experience preparing Sambong leaves for kidney support"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flat-input font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="category">
              Forum Category <span className="text-rose-600">*</span>
            </label>
            <select
              id="category"
              required
              disabled={isSubmitting}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flat-input bg-white appearance-none font-bold"
            >
              <option value="" disabled>-- Select a category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-extrabold text-[#1b4332] mb-2" htmlFor="content">
              Topic Content <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="content"
              required
              rows={8}
              disabled={isSubmitting}
              placeholder="Share the details of your traditional herbal preparation methods, recipe observations, dosages, results, or questions here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flat-input font-medium"
            />
          </div>

          {/* Form Actions */}
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/community')}
              disabled={isSubmitting}
              className="flat-button flat-button-secondary sm:w-auto w-full text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flat-button flat-button-primary sm:w-auto w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
                  Publishing Topic...
                </>
              ) : (
                'Publish Discussion'
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
