import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import * as forumRepo from '../repositories/forum.repository.js';
import { publicPagination } from '../utils/public-pagination.js';

const parsePositiveId = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

export class ForumController {
  /**
   * Create a new discussion thread.
   */
  public createThread = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const authorId = authReq.user?.userId;

      if (!authorId) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required to post discussions.',
        });
      }

      const { title, category, content } = req.body ?? {};

      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Title is required.',
        });
      }

      if (typeof category !== 'string' || !['growing', 'safety', 'recipes'].includes(category)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid category. Must be: growing, safety, or recipes.',
        });
      }

      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Content is required.',
        });
      }

      const thread = await forumRepo.createThread({
        authorId,
        title: title.trim(),
        category,
        content: content.trim(),
      });

      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Discussion thread created successfully!',
        data: { thread },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all threads, optionally filtered by category, search term, and paginated.
   */
  public getThreads = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      if ((req.query.category !== undefined && typeof req.query.category !== 'string') ||
          (req.query.search !== undefined && typeof req.query.search !== 'string')) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Invalid discussion filters.' });
      }
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const { page, limit } = publicPagination(req.query);

      const { threads, total } = await forumRepo.findAllThreads({
        category,
        search,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          threads,
          total,
          page,
          limit,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get thread detail with views increment and nested comment listings.
   */
  public getThreadDetail = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const id = parsePositiveId(req.params.id);
      if (id === null) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      const updated = await forumRepo.incrementThreadViews(id);
      if (updated.count === 0) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Discussion thread not found.',
        });
      }

      const thread = await forumRepo.findThreadById(id);
      if (!thread) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Discussion thread not found.',
        });
      }

      const comments = await forumRepo.findCommentsByThreadId(id);

      return res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          thread,
          comments,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Like a thread (increment likes counter).
   */
  public likeThread = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
      }
      const id = parsePositiveId(req.params.id);
      if (id === null) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      const updated = await forumRepo.toggleThreadLike(id, userId);
      if (!updated) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Discussion thread not found.' });
      }

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: updated.hasLiked ? 'Thread liked successfully.' : 'Thread unliked successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public getThreadLikeStatus = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const id = parsePositiveId(req.params.id);
      if (!userId) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
      }
      if (id === null) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Invalid thread ID.' });
      }

      const hasLiked = await forumRepo.hasUserLikedThread(id, userId);
      return res.status(200).json({ status: 'success', code: 200, data: { hasLiked } });
    } catch (error) {
      next(error);
    }
  };

  public getCommentLikeStatuses = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const threadId = parsePositiveId(req.params.id);
      if (!userId) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
      }
      if (threadId === null) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Invalid thread ID.' });
      }

      const likedCommentIds = await forumRepo.findUserLikedCommentIds(threadId, userId);
      return res.status(200).json({ status: 'success', code: 200, data: { likedCommentIds } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft-delete a discussion thread.
   */
  public deleteThread = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const userRole = authReq.user?.role;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required.',
        });
      }

      const id = parsePositiveId(req.params.id);
      if (id === null) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      const thread = await forumRepo.findThreadById(id);
      if (!thread) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Thread not found.',
        });
      }

      // Check permissions: author of the thread OR admin
      if (thread.authorId !== userId && userRole !== 'admin') {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: 'Forbidden. You do not have permission to delete this thread.',
        });
      }

      await forumRepo.deleteThread(id, userRole === 'admin' ? userId : undefined);

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Discussion thread deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Post a comment reply on a thread.
   */
  public createComment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const authorId = authReq.user?.userId;

      if (!authorId) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required to post replies.',
        });
      }

      const threadId = parsePositiveId(req.params.id);
      if (threadId === null) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      const { content, parentCommentId } = req.body ?? {};

      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Comment content is required.',
        });
      }

      const thread = await forumRepo.findThreadById(threadId);
      if (!thread) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Thread not found.',
        });
      }

      const commentData: {
        threadId: number;
        authorId: string;
        content: string;
        parentCommentId?: number;
      } = {
        threadId,
        authorId,
        content: content.trim(),
      };

      if (parentCommentId !== undefined && parentCommentId !== null) {
        const parsedParentCommentId = parsePositiveId(parentCommentId);
        if (parsedParentCommentId === null) {
          return res.status(400).json({
            status: 'error',
            code: 400,
            message: 'Invalid parent comment ID.',
          });
        }

        const parentComment = await forumRepo.findCommentById(parsedParentCommentId);
        if (!parentComment || parentComment.threadId !== threadId || parentComment.isDeleted) {
          return res.status(400).json({
            status: 'error',
            code: 400,
            message: 'The comment you are replying to was not found.',
          });
        }
        commentData.parentCommentId = parsedParentCommentId;
      }

      const { comment, notifications } = await forumRepo.createComment(commentData);

      try {
        const { io } = await import('../server.js');
        notifications.forEach((notification) => {
          io.to(notification.userId).emit('notification', notification);
        });
        io.to(`forum:thread:${threadId}`).emit('forum:comment', { threadId, comment });
      } catch (socketError) {
        console.error('Failed to emit community notification:', socketError);
      }

      return res.status(201).json({
        status: 'success',
        code: 201,
        message: 'Reply posted successfully!',
        data: { comment },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Like a comment.
   */
  public likeComment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      if (!userId) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
      }
      const id = parsePositiveId(req.params.id);
      if (id === null) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid comment ID.',
        });
      }

      const updated = await forumRepo.toggleCommentLike(id, userId);
      if (!updated) {
        return res.status(404).json({ status: 'error', code: 404, message: 'Comment not found.' });
      }

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: updated.hasLiked ? 'Comment liked successfully.' : 'Comment unliked successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a comment (soft-delete).
   */
  public deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const userRole = authReq.user?.role;

      if (!userId) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Authentication required.',
        });
      }

      const id = parsePositiveId(req.params.id);
      if (id === null) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid comment ID.',
        });
      }

      const comment = await forumRepo.findCommentById(id);
      if (!comment || comment.isDeleted) {
        return res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Comment not found.',
        });
      }

      // Check permissions: author of comment OR admin
      if (comment.authorId !== userId && userRole !== 'admin') {
        return res.status(403).json({
          status: 'error',
          code: 403,
          message: 'Forbidden. You do not have permission to delete this comment.',
        });
      }

      await forumRepo.deleteComment(id, userRole === 'admin' ? userId : undefined);

      return res.status(200).json({
        status: 'success',
        code: 200,
        message: 'Comment deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  };
}
