'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { createDiscussionRefresh, reconcileDeletedComments } from '../lib/library-discussion';
import io, { Socket } from 'socket.io-client';
import { Heart } from 'lucide-react';
import UserProfileModal from './UserProfileModal';

interface Author {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  role: string;
}

interface CommentLike {
  userId: string;
}

interface HerbComment {
  id: number;
  herbId: string;
  authorId: string;
  parentCommentId: number | null;
  content: string;
  likes: number;
  date: string;
  isDeleted: boolean;
  author: Author;
  userLikes: CommentLike[];
  replies?: HerbComment[];
}

interface HerbCommentsProps {
  herbId: string;
}

export default function HerbComments({ herbId }: HerbCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<HerbComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likingCommentIds, setLikingCommentIds] = useState<Set<number>>(() => new Set());
  
  // Profile popup state
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; name: string; avatar?: string | null; role: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleUserClick = (author: Author) => {
    if (!author) return;
    setSelectedProfile({
      id: author.id,
      name: author.name,
      avatar: author.avatar,
      role: author.role,
    });
    setIsProfileModalOpen(true);
  };
  
  const socketRef = useRef<Socket | null>(null);
  const mutationVersion = useRef(0);
  const commentVersions = useRef(new Map<number, number>());
  const deletedCommentIds = useRef(new Set<number>());
  const knownCommentIds = useRef(new Set<number>());
  const pendingLikeIds = useRef(new Set<number>());
  const fetchSequence = useRef(0);
  const fetchAbortController = useRef<AbortController | null>(null);
  const discussionActive = useRef(true);
  const discussionGeneration = useRef(0);
  const refreshQueue = useRef<(() => Promise<void>) | null>(null);
  const markCommentChanged = useCallback((commentId: number) => {
    commentVersions.current.set(commentId, ++mutationVersion.current);
  }, []);
  const markCommentDeleted = useCallback((commentId: number) => {
    deletedCommentIds.current.add(commentId);
    markCommentChanged(commentId);
  }, [markCommentChanged]);
  const removeComment = useCallback((commentId: number) => {
    markCommentDeleted(commentId);
    setComments((current) => reconcileDeletedComments(current, deletedCommentIds.current));
    setReplyingTo((current) => current === commentId ? null : current);
  }, [markCommentDeleted]);
  const appendComment = useCallback((comment: HerbComment) => {
    const retained = reconcileDeletedComments([comment], deletedCommentIds.current)[0];
    if (!retained || knownCommentIds.current.has(comment.id)) return;
    knownCommentIds.current.add(comment.id);
    markCommentChanged(comment.id);
    setComments((current) => current.some((item) => item.id === comment.id) ? current : [...current, retained]);
  }, [markCommentChanged]);

  const fetchCommentsCallback = useCallback(async () => {
    if (!discussionActive.current) return;
    const requestVersion = mutationVersion.current;
    const requestSequence = ++fetchSequence.current;
    fetchAbortController.current?.abort();
    const controller = new AbortController();
    fetchAbortController.current = controller;
    try {
      const res = await api.get(`/herbs/${herbId}/comments`, { signal: controller.signal });
      if (discussionActive.current && !controller.signal.aborted && requestSequence === fetchSequence.current && res.data?.status === 'success') {
        const fetched: HerbComment[] = res.data.data.comments || [];
        for (const comment of fetched) knownCommentIds.current.add(comment.id);
        const changedIds = new Set<number>();
        for (const [commentId, version] of commentVersions.current) {
          if (version > requestVersion) changedIds.add(commentId);
        }
        const deletedIds = new Set(deletedCommentIds.current);
        setComments((current) => {
          return reconcileDeletedComments([
            ...fetched.filter((comment) => !deletedIds.has(comment.id) && !changedIds.has(comment.id)),
            ...current.filter((comment) => changedIds.has(comment.id)),
          ], deletedIds);
        });
      }
    } catch (err) {
      if (discussionActive.current && requestSequence === fetchSequence.current && !controller.signal.aborted) {
        if ((err as { response?: { status?: number } }).response?.status === 404) setComments([]);
        console.error('Failed to fetch comments', err);
      }
    } finally {
      if (discussionActive.current && requestSequence === fetchSequence.current) setLoading(false);
    }
  }, [herbId]);
  const refreshComments = useCallback(() => {
    return discussionActive.current ? refreshQueue.current?.() ?? Promise.resolve() : Promise.resolve();
  }, []);

  useEffect(() => {
    discussionActive.current = true;
    const generation = ++discussionGeneration.current;
    refreshQueue.current = createDiscussionRefresh(fetchCommentsCallback, () => discussionActive.current && discussionGeneration.current === generation);
    void refreshComments();

    // Initialize Socket.io connection
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(backendUrl, {
      withCredentials: true,
    });
    socketRef.current = socket;
    const isCurrentSocket = () => discussionActive.current && socketRef.current === socket;
    socketRef.current.on('connect', () => { if (isCurrentSocket()) void refreshComments(); });

    socketRef.current.on('new_comment', (comment: HerbComment) => {
      if (isCurrentSocket() && comment?.herbId === herbId) {
        appendComment(comment);
        void refreshComments();
      }
    });

    socketRef.current.on('comment_deleted', (commentId: number) => {
      if (isCurrentSocket()) removeComment(commentId);
    });

    socketRef.current.on('comment_liked', (event: { herbId?: string } | null) => {
      if (!isCurrentSocket() || (event?.herbId && event.herbId !== herbId)) return;
      void refreshComments();
    });

    return () => {
      discussionActive.current = false;
      fetchAbortController.current?.abort();
      socket.disconnect();
    };
  }, [herbId, fetchCommentsCallback, refreshComments, appendComment, removeComment]);


  const handleSubmitComment = async (e: React.FormEvent, parentId: number | null = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await api.post<{ data: { comment: HerbComment } }>(`/herbs/${herbId}/comments`, {
        content,
        parentCommentId: parentId,
      });
      if (!discussionActive.current) return;
      appendComment(response.data.data.comment);
      void refreshComments();

      if (parentId) {
        setReplyingTo(null);
        setReplyContent('');
      } else {
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/herbs/comments/${commentId}`);
      removeComment(commentId);
    } catch (err) {
      console.error('Failed to delete comment', err);
      alert('Failed to delete comment.');
    }
  };

  const handleToggleLike = async (commentId: number) => {
    if (!isAuthenticated || !user?.id) {
      alert('Please sign in to react to comments.');
      return;
    }
    
    if (!discussionActive.current || deletedCommentIds.current.has(commentId) || pendingLikeIds.current.has(commentId)) return;
    pendingLikeIds.current.add(commentId);
    setLikingCommentIds((current) => new Set(current).add(commentId));

    try {
      await api.post(`/herbs/comments/${commentId}/like`);
    } catch (err) {
      console.error('Failed to toggle like', err);
    } finally {
      try {
        if (discussionActive.current) await refreshComments();
      } finally {
        pendingLikeIds.current.delete(commentId);
        if (discussionActive.current) setLikingCommentIds((current) => {
          const next = new Set(current);
          next.delete(commentId);
          return next;
        });
      }
    }
  };

  const topLevelComments = useMemo(() => {
    const repliesByParent = new Map<number, HerbComment[]>();
    for (const comment of comments) {
      if (comment.parentCommentId !== null) {
        const replies = repliesByParent.get(comment.parentCommentId) ?? [];
        replies.push(comment);
        repliesByParent.set(comment.parentCommentId, replies);
      }
    }

    return comments
      .filter((comment) => comment.parentCommentId === null)
      .map((comment) => ({ ...comment, replies: repliesByParent.get(comment.id) ?? [] }));
  }, [comments]);

  return (
    <div className="mt-8 border-t-2 border-line pt-6 pb-4">
      <h3 className="font-serif-custom text-2xl font-black text-ink mb-6 flex items-center gap-2">
        <span>💬</span> Discussion & Experiences
      </h3>

      {/* Main Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={(e) => handleSubmitComment(e)} className="mb-8 flex gap-2 sm:gap-4">
          <div className="w-10 h-10 rounded-full bg-soft border-2 border-line flex items-center justify-center shrink-0 overflow-hidden font-black text-ink">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience or ask a question about this herb..."
              className="flat-input w-full min-h-[80px] resize-y"
            />
            <div className="mt-2 flex justify-end">
              <button 
                type="submit" 
                className="flat-button flat-button-primary !py-1.5 !px-4 text-sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl bg-soft border-2 border-line p-4 text-center">
          <p className="text-sm font-bold text-ink">
            Please sign in to join the discussion!
          </p>
        </div>
      )}

      {/* Comment List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-transparent"></div>
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-line rounded-xl">
          <p className="text-muted font-semibold text-sm">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevelComments.map((comment) => (
            <div key={comment.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Top Level Comment */}
              <div className="flex gap-3 group">
                <div 
                  className="w-10 h-10 rounded-full bg-soft border-2 border-line flex items-center justify-center shrink-0 font-black text-ink cursor-pointer hover:opacity-85 transition-opacity"
                  onClick={() => handleUserClick(comment.author)}
                >
                  {comment.author.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="bg-soft rounded-2xl rounded-tl-none p-3 border border-line relative">
                    <div className="flex flex-wrap items-center gap-2 mb-1 break-words">
                      <span 
                        className="font-extrabold text-ink text-sm cursor-pointer hover:underline"
                        onClick={() => handleUserClick(comment.author)}
                      >
                        {comment.author.name}
                      </span>
                      {comment.author.role === 'admin' && (
                        <span className="bg-brand text-on-brand text-sm px-1.5 py-0.5 rounded font-black uppercase tracking-wide">Admin</span>
                      )}
                      <span className="text-sm text-muted font-semibold ml-auto">
                        {new Date(comment.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {comment.content}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-1.5 ml-2">
                    <button 
                      onClick={() => handleToggleLike(comment.id)}
                      disabled={likingCommentIds.has(comment.id)}
                      aria-busy={likingCommentIds.has(comment.id)}
                      aria-label={comment.userLikes?.some(ul => ul.userId === user?.id) ? 'Unlike comment' : 'Like comment'}
                      aria-pressed={comment.userLikes?.some(ul => ul.userId === user?.id)}
                      className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        comment.userLikes?.some(ul => ul.userId === user?.id) 
                          ? 'text-[var(--primary)]'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${comment.userLikes?.some(ul => ul.userId === user?.id) ? 'fill-current' : ''}`} />
                      <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
                    </button>
                    {isAuthenticated && (
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-sm font-bold text-muted hover:text-ink transition-colors"
                      >
                        Reply
                      </button>
                    )}
                    {(user?.id === comment.authorId || user?.role === 'admin') && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-sm font-bold text-muted hover:text-error-ink transition-colors ml-4"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="sm:ml-12 mt-3 flex flex-wrap gap-2 animate-in fade-in zoom-in-95">
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.author.name}...`}
                      className="flat-input !py-1.5 text-sm w-full"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="flat-button flat-button-primary !py-1.5 !px-3 text-sm"
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Replying...' : 'Reply'}
                  </button>
                </form>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-2 sm:ml-5 mt-3 pl-2 sm:pl-7 border-l-2 border-line space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3 group animate-in fade-in duration-300">
                      <div 
                        className="w-8 h-8 rounded-full bg-soft border-2 border-line flex items-center justify-center shrink-0 font-black text-ink text-sm cursor-pointer hover:opacity-85 transition-opacity"
                        onClick={() => handleUserClick(reply.author)}
                      >
                        {reply.author.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="bg-soft rounded-2xl rounded-tl-none p-2.5 border border-line">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5 break-words">
                            <span 
                              className="font-extrabold text-ink text-sm cursor-pointer hover:underline"
                              onClick={() => handleUserClick(reply.author)}
                            >
                              {reply.author.name}
                            </span>
                            {reply.author.role === 'admin' && (
                              <span className="bg-brand text-on-brand text-sm px-1 py-0.5 rounded font-black uppercase tracking-wide">Admin</span>
                            )}
                            <span className="text-sm text-muted font-semibold ml-auto">
                              {new Date(reply.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {reply.content}
                          </p>
                        </div>
                        
                        {/* Reply Actions */}
                        <div className="flex items-center gap-4 mt-1 ml-2">
                          <button 
                            onClick={() => handleToggleLike(reply.id)}
                            disabled={likingCommentIds.has(reply.id)}
                            aria-busy={likingCommentIds.has(reply.id)}
                            aria-label={reply.userLikes?.some(ul => ul.userId === user?.id) ? 'Unlike reply' : 'Like reply'}
                            aria-pressed={reply.userLikes?.some(ul => ul.userId === user?.id)}
                            className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              reply.userLikes?.some(ul => ul.userId === user?.id) 
                                ? 'text-[var(--primary)]'
                                : 'text-muted hover:text-ink'
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${reply.userLikes?.some(ul => ul.userId === user?.id) ? 'fill-current' : ''}`} />
                            <span>{reply.likes > 0 ? reply.likes : 'Like'}</span>
                          </button>
                          {(user?.id === reply.authorId || user?.role === 'admin') && (
                            <button 
                              onClick={() => handleDeleteComment(reply.id)}
                              className="text-sm font-bold text-muted hover:text-error-ink transition-colors ml-4"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <UserProfileModal 
        userProfile={selectedProfile} 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}
