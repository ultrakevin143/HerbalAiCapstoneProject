'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import api from '../../../lib/axios';
import io from 'socket.io-client';
import UserProfileModal from '../../../components/UserProfileModal';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Trash2,
  AlertCircle,
  ShieldCheck,
  CornerUpLeft,
  X,
} from 'lucide-react';

interface Comment {
  id: number;
  threadId: number;
  authorId: string;
  parentCommentId: number | null;
  content: string;
  likes: number;
  isDeleted: boolean;
  date: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    role: string;
  };
}

interface ThreadDetail {
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

export default function ThreadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Likes state
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<number>>(new Set());
  const [likingCommentIds, setLikingCommentIds] = useState<Set<number>>(new Set());

  // Comment input state
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const commentFormRef = useRef<HTMLFormElement>(null);
  const commentIdsRef = useRef<Set<number>>(new Set());

  // Profile modal popup state
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
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/forum/threads/${id}`);
      if (res.data?.status === 'success') {
        setThread(res.data.data.thread);
        const fetchedComments: Comment[] = res.data.data.comments || [];
        const fetchedIds = new Set(fetchedComments.map((comment) => comment.id));
        fetchedIds.forEach((commentId) => commentIdsRef.current.add(commentId));
        setComments((current) => {
          const merged = [...fetchedComments, ...current.filter((comment) => comment.threadId === Number(id) && !fetchedIds.has(comment.id))];
          commentIdsRef.current = new Set(merged.map((comment) => comment.id));
          return merged;
        });
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
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    const socket = io(backendUrl);
    const threadId = Number(id);
    socket.on('connect', () => socket.emit('forum:join', threadId));
    socket.on('forum:comment', (event: { threadId: number; comment: Comment }) => {
      if (event.threadId !== threadId || commentIdsRef.current.has(event.comment.id)) return;
      commentIdsRef.current.add(event.comment.id);
      setComments((current) => [...current, event.comment]);
      setThread((current) => current ? { ...current, replies: current.replies + 1 } : current);
    });
    return () => {
      socket.emit('forum:leave', threadId);
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    const scrollToReply = () => {
      if (!/^#comment-\d+$/.test(window.location.hash)) return;
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const handleHashChange = () => {
      void fetchThreadDetail();
    };
    requestAnimationFrame(scrollToReply);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [comments, fetchThreadDetail]);

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
      console.error('Failed to like comment:', err);
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
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
        ...(replyingTo ? { parentCommentId: replyingTo.id } : {}),
      });

      if (res.data?.status === 'success') {
        const postedComment = res.data.data.comment as Comment;
        if (!commentIdsRef.current.has(postedComment.id)) {
          commentIdsRef.current.add(postedComment.id);
          setComments((prev) => [...prev, postedComment]);
          setThread((current) => current ? { ...current, replies: current.replies + 1 } : current);
        }
        setCommentContent('');
        setReplyingTo(null);
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Failed to post comment:', err);
      alert(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    commentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => document.getElementById('comment')?.focus(), 350);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this reply?')) return;
    try {
      const res = await api.delete(`/forum/comments/${commentId}`);
      if (res.data?.status === 'success') {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, isDeleted: true, content: '[This reply has been deleted by the author or moderator.]' } : c))
        );
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
      <div className="min-h-screen flex flex-col bg-[#f0f7f2] dark:bg-canvas font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#2d6a4f] border-t-transparent"></div>
            <p className="text-[#2d6a4f] font-bold text-xs">Loading discussion detail...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent font-sans">
        <Navbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#1b4332] dark:text-ink mb-2">Discussion Missing</h2>
          <p className="text-xs text-gray-500 dark:text-muted font-medium mb-6">{error || 'Thread not found.'}</p>
          <button
            onClick={() => router.push('/community')}
            className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-xs px-5 py-2 rounded-full hover:bg-[#2d6a4f]/10"
          >
            Return to Forum
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = user && thread.authorId === user.id;
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-transparent font-sans text-ink">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3 py-6 sm:px-6 sm:py-10">
        {/* Navigation back link */}
        <button
          onClick={() => router.push('/community')}
          className="text-xs font-bold text-[#2d6a4f] dark:text-[#74c69d] hover:underline inline-flex items-center gap-1.5 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Discussions</span>
        </button>

        {/* THREAD CONTAINER */}
        <article className="glass-card bg-white/55 dark:bg-panel/80 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm mb-6">
          {/* Top row metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1b4332]/10 dark:border-line pb-4 mb-5">
            <div className="flex min-w-0 items-center gap-3">
              <div 
                className="h-10 w-10 shrink-0 rounded-full bg-[#eef5f0] dark:bg-soft border border-black/10 dark:border-line text-xs font-bold text-[#1b4332] dark:text-ink flex items-center justify-center shadow-xs cursor-pointer"
                onClick={() => handleUserClick(thread.author)}
              >
                {thread.author?.avatar?.startsWith('http') ? (
                  <img src={thread.author.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span>{thread.author?.name?.[0]?.toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="min-w-0">
                <p 
                  className="text-xs font-bold text-[#1b4332] dark:text-ink cursor-pointer hover:underline inline-flex max-w-full flex-wrap items-center gap-1.5 [overflow-wrap:anywhere]"
                  onClick={() => handleUserClick(thread.author)}
                >
                  <span>{thread.author?.name}</span>
                  {thread.author?.role === 'admin' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-[#eef5f0] text-[#2d6a4f] font-bold px-1.5 py-0.2 rounded-full">
                      <ShieldCheck className="h-2.5 w-2.5 text-[#40916c]" />
                      Admin
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-muted">{formatDate(thread.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-[#eef5f0] dark:bg-soft border border-[#2d6a4f]/20 text-[#2d6a4f] dark:text-[#74c69d] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {getCategoryLabel(thread.category)}
              </span>
              {(isOwner || isAdmin) && (
                <button
                  onClick={handleDeleteThread}
                  className="text-xs text-rose-600 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Thread</span>
                </button>
              )}
            </div>
          </div>

          {/* Title & Body */}
          <h1 className="font-serif-custom italic text-2xl sm:text-4xl font-bold text-[#1b4332] dark:text-ink tracking-tight mb-4 [overflow-wrap:anywhere]">
            {thread.title}
          </h1>

          <div className="text-gray-700 dark:text-muted text-sm leading-relaxed whitespace-pre-wrap mb-6 [overflow-wrap:anywhere]">
            {thread.content}
          </div>

          {/* Bottom actions stats bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#1b4332]/10 dark:border-line pt-3.5 text-xs font-bold text-gray-500 dark:text-muted">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`inline-flex min-h-10 items-center gap-1.5 px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                  hasLiked
                    ? 'border-[#40916c] bg-[#40916c] text-white'
                    : 'border-black/10 hover:border-[#40916c] text-[#1b4332] dark:text-ink'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current' : ''}`} />
                <span>{thread.likes} {hasLiked ? 'Liked' : 'Like'}</span>
              </button>
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-gray-500">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{thread.replies} Replies</span>
              </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-gray-400 sm:ml-auto">
              <Eye className="h-3.5 w-3.5" />
              <span>{thread.views} Views</span>
            </span>
          </div>
        </article>

        {/* COMMENTS / REPLIES BLOCK */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#1b4332] dark:text-ink uppercase tracking-wider border-b border-[#1b4332]/10 dark:border-line pb-2">
            Comments ({comments.length})
          </h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <form ref={commentFormRef} onSubmit={handleSubmitComment} className="glass-card bg-white/50 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
              <label htmlFor="comment" className="block text-xs font-bold text-[#1b4332] dark:text-ink uppercase tracking-wider">
                {replyingTo ? 'Write a Reply' : 'Leave a Comment'}
              </label>
              {replyingTo && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-[#40916c]/25 bg-[#eef5f0] px-3 py-2 text-xs text-[#1b4332] dark:border-line dark:bg-soft dark:text-ink">
                  <span className="min-w-0 truncate">
                    Replying to <strong>{replyingTo.author.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    aria-label="Cancel reply"
                    className="shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <textarea
                id="comment"
                required
                rows={3}
                disabled={isSubmittingComment}
                placeholder={replyingTo ? `Reply to ${replyingTo.author.name}...` : 'Write a helpful response...'}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full border border-black/10 dark:border-line bg-white/70 dark:bg-soft rounded-2xl px-4 py-3 text-sm text-[#1b4332] dark:text-ink focus:outline-none focus:ring-2 focus:ring-[#40916c]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentContent.trim()}
                  className="btn btn-gradient bg-gradient-to-r from-[#40916c] to-[#74c69d] text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-sm hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingComment ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                </button>
              </div>
            </form>
          ) : (
            <div className="glass-card bg-white/40 dark:bg-panel/60 border border-black/10 dark:border-line rounded-3xl p-4 text-center sm:p-6">
              <p className="text-xs text-gray-500 dark:text-muted font-medium mb-3">
                Sign in to leave a comment and join the discussion.
              </p>
              <Link
                href={`/signin?callbackUrl=/community/${id}`}
                className="btn btn-outline border-2 border-[#2d6a4f] text-[#2d6a4f] dark:text-[#74c69d] font-semibold text-xs px-5 py-2 rounded-full hover:bg-[#2d6a4f]/10 transition-all inline-block"
              >
                Sign In to Comment
              </Link>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-muted font-medium text-center py-6">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const isCommentAuthor = user && comment.authorId === user.id;
                const isCommentDeletable = (isCommentAuthor || isAdmin) && !comment.isDeleted;
                const parentComment = comment.parentCommentId
                  ? comments.find((candidate) => candidate.id === comment.parentCommentId)
                  : null;

                return (
                  <div
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className={`glass-card bg-white/50 dark:bg-panel/75 backdrop-blur-md border border-black/10 dark:border-line rounded-2xl p-3 shadow-xs target:ring-2 target:ring-[var(--primary)] sm:p-4 ${
                      comment.isDeleted ? 'opacity-60' : ''
                    } ${comment.parentCommentId ? 'sm:ml-10 border-l-2 border-l-[#40916c]/45' : ''} scroll-mt-24`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div 
                        className="h-8 w-8 shrink-0 rounded-full bg-[#eef5f0] dark:bg-soft border border-black/10 dark:border-line text-[11px] font-bold text-[#1b4332] dark:text-ink flex items-center justify-center shadow-xs cursor-pointer mt-0.5"
                        onClick={() => handleUserClick(comment.author)}
                      >
                        {comment.author?.avatar?.startsWith('http') ? (
                          <img src={comment.author.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <span>{comment.author?.name?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span 
                            className="text-xs font-bold text-[#1b4332] dark:text-ink cursor-pointer hover:underline"
                            onClick={() => handleUserClick(comment.author)}
                          >
                            {comment.author?.name}
                          </span>
                          {comment.author?.role === 'admin' && (
                            <span className="text-[10px] bg-[#eef5f0] border border-[#2d6a4f]/20 text-[#2d6a4f] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400 dark:text-muted">
                            • {formatDate(comment.date)}
                          </span>
                        </div>

                        <p className={`text-xs leading-relaxed text-gray-700 dark:text-muted whitespace-pre-wrap [overflow-wrap:anywhere] ${
                          comment.isDeleted ? 'italic text-gray-400' : ''
                        }`}>
                          {comment.content}
                        </p>

                        {parentComment && (
                          <p className="mt-1.5 text-[11px] font-medium text-[#40916c] dark:text-[#74c69d]">
                            Reply to {parentComment.author.name}
                          </p>
                        )}

                        {/* Comment actions row */}
                        {!comment.isDeleted && (
                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-2.5 pt-2 border-t border-[#1b4332]/10 dark:border-line text-xs font-medium text-gray-500">
                            <button
                              type="button"
                              onClick={() => handleCommentLike(comment.id)}
                              disabled={likingCommentIds.has(comment.id)}
                              className={`inline-flex items-center gap-1 transition-colors cursor-pointer ${
                                likedCommentIds.has(comment.id) ? 'text-[#40916c] font-bold' : 'hover:text-[#1b4332]'
                              }`}
                            >
                              <Heart className={`h-3 w-3 ${likedCommentIds.has(comment.id) ? 'fill-current text-[#40916c]' : ''}`} />
                              <span>{comment.likes} {likedCommentIds.has(comment.id) ? 'liked' : 'likes'}</span>
                            </button>
                            <div className="ml-auto flex flex-wrap items-center gap-3">
                              {isAuthenticated && (
                                <button
                                  type="button"
                                  onClick={() => handleReply(comment)}
                                  className="inline-flex items-center gap-1 font-bold text-[#2d6a4f] hover:underline dark:text-[#74c69d]"
                                >
                                  <CornerUpLeft className="h-3 w-3" />
                                  Reply
                                </button>
                              )}
                              {isCommentDeletable && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-rose-600 hover:underline text-xs font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
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
