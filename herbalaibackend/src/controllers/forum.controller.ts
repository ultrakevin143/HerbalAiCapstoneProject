import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import * as forumRepo from '../repositories/forum.repository.js';

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

      const { title, category, content } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Title is required.',
        });
      }

      if (!category || !['growing', 'safety', 'recipes'].includes(category)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid category. Must be: growing, safety, or recipes.',
        });
      }

      if (!content || !content.trim()) {
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
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const { threads, total } = await forumRepo.findAllThreads({
        category,
        search,
        page,
        limit,
      });

      const totalPages = limit && limit > 0 ? Math.ceil(total / limit) : 1;

      return res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          threads,
          total,
          page: page || 1,
          limit: limit || total,
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
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      // Increment views
      await forumRepo.incrementThreadViews(id);

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
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      const updated = await forumRepo.toggleThreadLike(id, userId);

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
      const id = parseInt(req.params.id as string, 10);
      if (!userId) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
      }
      if (isNaN(id)) {
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
      const threadId = parseInt(req.params.id as string, 10);
      if (!userId) {
        return res.status(401).json({ status: 'error', code: 401, message: 'Authentication required.' });
      }
      if (isNaN(threadId)) {
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

      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
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

      await forumRepo.deleteThread(id);

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

      const threadId = parseInt(req.params.id as string, 10);
      if (isNaN(threadId)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid thread ID.',
        });
      }

      const { content, parentCommentId } = req.body;

      if (!content || !content.trim()) {
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

      if (parentCommentId) {
        const parsedParentCommentId = parseInt(parentCommentId, 10);
        if (isNaN(parsedParentCommentId)) {
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
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid comment ID.',
        });
      }

      const updated = await forumRepo.toggleCommentLike(id, userId);

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

      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          status: 'error',
          code: 400,
          message: 'Invalid comment ID.',
        });
      }

      const comment = await forumRepo.findCommentById(id);
      if (!comment) {
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

      await forumRepo.deleteComment(id);

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
