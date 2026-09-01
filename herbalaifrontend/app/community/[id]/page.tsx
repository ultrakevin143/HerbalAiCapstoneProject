'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import api from '../../../lib/axios';
import UserProfileModal from '../../../components/UserProfileModal';

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

interface ThreadComment {
  id: number;
  threadId: number;
  authorId: string;
  parentCommentId: number | null;
  content: string;
  likes: number;
  date: string;
  isDeleted: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    role: string;
  };
}

export default function ThreadDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Data states
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form & Action states
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<number>>(new Set());
  const [likingCommentIds, setLikingCommentIds] = useState<Set<number>>(new Set());

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

  const fetchThreadDetail = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/forum/threads/${id}`);
      if (res.data?.status === 'success') {
        setThread(res.data.data.thread);
        setComments(res.data.data.comments || []);
        if (isAuthenticated) {
          const [likeStatus, commentLikeStatuses] = await Promise.all([
            api.get(`/forum/threads/${id}/like-status`),
            api.get(`/forum/threads/${id}/comment-like-statuses`),
          ]);
          setHasLiked(Boolean(likeStatus.data?.data?.hasLiked));
          setLikedCommentIds(new Set(commentLikeStatuses.data?.data?.likedCommentIds || []));
        } else {
          setHasLiked(false);
          setLikedCommentIds(new Set());
        }
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error('Failed to load thread detail:', err);
      setError(
        err.response?.data?.message ||
        'The discussion thread you are looking for does not exist or has been removed.'
      );
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchThreadDetail();
  }, [id, fetchThreadDetail]);

  const handleLike = async () => {
    if (!thread || isLiking) return;
    try {
      setIsLiking(true);
      const res = await api.post(`/forum/threads/${thread.id}/like`);
      if (res.data?.status === 'success') {
        setThread((prev) => prev ? { ...prev, likes: res.data.data.likes } : null);
        setHasLiked(Boolean(res.data.data.hasLiked));
      }
    } catch (err) {
      console.error('Failed to like thread:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    if (likingCommentIds.has(commentId)) return;
    setLikingCommentIds((current) => new Set(current).add(commentId));
    try {
      const res = await api.post(`/forum/comments/${commentId}/like`);
      if (res.data?.status === 'success') {
        setComments((current) => current.map((comment) =>
          comment.id === commentId ? { ...comment, likes: res.data.data.likes } : comment
        ));
        setLikedCommentIds((current) => {
          const next = new Set(current);
          if (res.data.data.hasLiked) next.add(commentId);
          else next.delete(commentId);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to update reply like:', err);
    } finally {
      setLikingCommentIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    if (!confirm('Are you sure you want to delete this discussion thread? This action cannot be undone.')) return;
    try {
      const res = await api.delete(`/forum/threads/${thread.id}`);
      if (res.data?.status === 'success') {
        router.push('/community');
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      alert(err.response?.data?.message || 'Failed to delete thread.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const res = await api.post(`/forum/threads/${id}/comments`, {
        content: commentContent.trim(),
      });

      if (res.data?.status === 'success') {
        setCommentContent('');
        // Re-fetch thread & comments to get complete relational structure
        await fetchThreadDetail();
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await api.delete(`/forum/comments/${commentId}`);
      if (res.data?.status === 'success') {
        // Soft delete locally
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isDeleted: true, content: '[This reply has been deleted by the author or moderator.]' } : c))
        );
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      alert(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-green-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2d6a4f] border-t-transparent"></div>
            <p className="font-extrabold text-[#1b4332]">Loading discussion detail...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen flex flex-col bg-green-50">
        <Navbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-20 text-center">
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="font-serif-custom text-2xl font-black text-[#1b4332] mb-2">Discussion Missing</h2>
          <p className="text-sm font-semibold text-gray-500 mb-6">{error || 'Thread not found.'}</p>
          <button
            onClick={() => router.push('/community')}
            className="flat-button flat-button-primary"
          >
            Return to Forum
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if current user is owner or admin
  const isOwner = user && thread.authorId === user.id;
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-green-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10">
        {/* Navigation back link */}
        <button
          onClick={() => router.push('/community')}
          className="text-xs font-black text-[#2d6a4f] hover:underline flex items-center gap-1 mb-6"
        >
          ← Back to Forum Discussions
        </button>

        {/* THREAD CONTAINER */}
        <article className="bg-white border border-gray-100 rounded-3xl p-6 lg:p-8 shadow-md mb-8">
          {/* Top row metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-85 transition-opacity"
                onClick={() => handleUserClick(thread.author)}
              >
                {thread.author?.avatar || '👤'}
              </div>
              <div>
                <p 
                  className="text-xs font-black text-[#1b4332] cursor-pointer hover:underline"
                  onClick={() => handleUserClick(thread.author)}
                >
                  {thread.author?.name}
                  {thread.author?.role === 'admin' && (
                    <span className="ml-1.5 text-[8px] bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                      Staff
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-gray-400 font-bold">{formatDate(thread.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs bg-[#eef5f0] border border-[#2d6a4f]/20 text-[#2d6a4f] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                {getCategoryLabel(thread.category)}
              </span>
              {(isOwner || isAdmin) && (
                <button
                  onClick={handleDeleteThread}
                  className="text-xs text-rose-700 hover:text-rose-950 font-black"
                >
                  Delete Topic
                </button>
              )}
            </div>
          </div>

          {/* Title & Body */}
          <h1 className="text-3xl font-serif-custom font-black italic text-[#1b4332] tracking-tight mb-4">
            {thread.title}
          </h1>

          <div className="text-[#1b4332] font-medium text-sm leading-relaxed whitespace-pre-wrap mb-8">
            {thread.content}
          </div>

          {/* Bottom actions stats bar */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-50 pt-4 text-xs font-bold text-gray-400">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                  hasLiked
                    ? 'border-[#2d6a4f]/20 bg-[#eef5f0] text-[#1b4332]'
                    : 'border-gray-200 hover:bg-[#eef5f0]/50 text-gray-500'
                }`}
              >
                ❤️ {thread.likes} {hasLiked ? 'Liked' : 'Like'}
              </button>
              <span className="flex items-center gap-1">
                💬 {thread.replies} Replies
              </span>
            </div>
            <span>👁️ {thread.views} Views</span>
          </div>
        </article>

        {/* COMMENTS / REPLIES BLOCK */}
        <section className="space-y-6">
          <h2 className="text-lg font-black text-[#1b4332] border-b border-[#1b4332]/10 pb-2">
            Comments & Observations ({comments.length})
          </h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
              <label htmlFor="comment" className="block text-xs font-black text-[#1b4332] uppercase tracking-wider">
                Post an Observation or Reply
              </label>
              <textarea
                id="comment"
                required
                rows={3}
                disabled={isSubmittingComment}
                placeholder="Share your feedback, safety queries, or observational notes..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flat-input font-medium"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="flat-button flat-button-primary !py-2 !px-5 text-xs"
                >
                  {isSubmittingComment ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent inline-block mr-1"></span>
                      Posting...
                    </>
                  ) : (
                    'Submit Comment'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-gray-500 mb-3">
                You must be logged in to participate in observations and thread discussions.
              </p>
              <Link
                href={`/signin?callbackUrl=/community/${id}`}
                className="flat-button flat-button-secondary !py-2 !px-5 text-xs"
              >
                Sign In to Participate
              </Link>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-xs text-gray-400 font-bold text-center py-6">No observations reported yet. Be the first to leave a comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isCommentAuthor = user && comment.authorId === user.id;
                const isCommentDeletable = (isCommentAuthor || isAdmin) && !comment.isDeleted;

                return (
                  <div
                    key={comment.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                      comment.isDeleted ? 'border-gray-100 opacity-60' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div 
                        className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-[#40916c] to-[#74c69d] text-sm flex items-center justify-center shadow-sm cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={() => handleUserClick(comment.author)}
                      >
                        {comment.author?.avatar || '👤'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span 
                            className="text-xs font-black text-[#1b4332] cursor-pointer hover:underline"
                            onClick={() => handleUserClick(comment.author)}
                          >
                            {comment.author?.name}
                          </span>
                          {comment.author?.role === 'admin' && (
                            <span className="text-[8px] bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                              Staff
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-bold">
                            • {formatDate(comment.date)}
                          </span>
                        </div>

                        <p className={`text-xs font-semibold leading-relaxed text-[#1b4332] whitespace-pre-wrap ${
                          comment.isDeleted ? 'italic text-gray-400' : ''
                        }`}>
                          {comment.content}
                        </p>

                        {/* Comment actions row */}
                        {!comment.isDeleted && (
                          <div className="flex items-center justify-between gap-4 mt-3 pt-2 border-t border-gray-50 text-[10px] font-bold text-gray-400">
                            <button
                              type="button"
                              onClick={() => handleCommentLike(comment.id)}
                              disabled={likingCommentIds.has(comment.id)}
                              className={`flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
                                likedCommentIds.has(comment.id) ? 'text-[#1b4332]' : 'hover:text-[#1b4332]'
                              }`}
                            >
                              ❤️ {comment.likes} {likedCommentIds.has(comment.id) ? 'liked' : 'likes'}
                            </button>
                            {isCommentDeletable && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-rose-700 hover:text-rose-950 font-black cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <UserProfileModal 
        userProfile={selectedProfile} 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <Footer />
    </div>
  );
}
