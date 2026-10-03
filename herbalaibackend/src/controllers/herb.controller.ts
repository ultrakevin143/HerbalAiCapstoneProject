import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { runAuditedMutation } from '../repositories/audit.repository.js';

import * as herbRepo from '../repositories/herb.repository.js';
import { createHerbComment, deleteHerbComment, lockPublishedHerb } from '../repositories/herb-comment.repository.js';
import { publicPagination } from '../utils/public-pagination.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

const parseCommentId = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 && value <= 2147483647 ? value : null;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : null;
};

const emitCommentEvent = async (event: string, payload: unknown): Promise<void> => {
  try {
    const { io } = await import('../server.js');
    io.emit(event, payload);
  } catch {
    console.error('Failed to broadcast library comment update.');
  }
};

export class HerbController {
  public getCatalog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const herbs = await herbRepo.findHerbCatalog();
      res.status(200).json({ status: 'success', data: { herbs } });
    } catch (error) {
      next(error);
    }
  };
  public getCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await herbRepo.findHerbCategories();
      res.status(200).json({ status: 'success', data: { categories } });
    } catch (error) {
      next(error);
    }
  };
  /**
   * Get all approved herbs for the library with optional filtering and pagination.
   */
  public getAllHerbs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ((req.query["search"] !== undefined && typeof req.query["search"] !== 'string') ||
          (req.query["category"] !== undefined && typeof req.query["category"] !== 'string') ||
          (req.query["isDohApproved"] !== undefined && req.query["isDohApproved"] !== 'true' && req.query["isDohApproved"] !== 'false')) {
        res.status(400).json({ status: 'error', code: 400, message: 'Invalid herb filters.' });
        return;
      }
      const search = req.query["search"] as string | undefined;
      const category = req.query["category"] as string | undefined;
      const isDoh = req.query["isDohApproved"] !== undefined ? req.query["isDohApproved"] === "true" : undefined;
      const { page, limit } = publicPagination(req.query);

      const { herbs, total } = await herbRepo.findAllHerbs({
        search,
        category,
        isDohApproved: isDoh,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          herbs,
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
   * Get a single herb by its ID.
   */
  public getHerbById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const herb = await herbRepo.findHerbById(id as string);

      if (!herb) {
        res.status(404).json({
          status: 'error',
          code: 404,
          message: 'Herb not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          herb,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all comments for a specific herb
   */
  public getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const herb = await prisma.herb.findFirst({
        where: { id, publicationStatus: 'PUBLISHED', isVerified: true },
        select: { id: true },
      });
      if (!herb) {
        res.status(404).json({ status: 'error', code: 404, message: 'Herb not found' });
        return;
      }
      
      const comments = await prisma.herbComment.findMany({
        where: { herbId: id, isDeleted: false, herb: { publicationStatus: 'PUBLISHED', isVerified: true } },
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true, role: true } },
          userLikes: { select: { userId: true } },
        },
        orderBy: { date: 'asc' },
      });

      res.status(200).json({ status: 'success', code: 200, data: { comments } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add a comment or reply to an herb
   */
  public addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { content, parentCommentId } = req.body ?? {};
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }
      if (typeof content !== 'string' || !content.trim()) {
        res.status(400).json({ status: 'error', message: 'Comment content is required.' });
        return;
      }
      const parsedParentId = parentCommentId === undefined || parentCommentId === null
        ? null : parseCommentId(parentCommentId);
      if (parentCommentId !== undefined && parentCommentId !== null && parsedParentId === null) {
        res.status(400).json({ status: 'error', message: 'Invalid parent comment ID.' });
        return;
      }
      const newComment = await createHerbComment(id, userId, content.trim(), parsedParentId);

      await emitCommentEvent('new_comment', newComment);

      res.status(201).json({ status: 'success', code: 201, data: { comment: newComment } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle a heart reaction on a comment
   */
  public toggleCommentLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const commentIdInt = parseCommentId(req.params.commentId);
      if (commentIdInt === null) {
        res.status(400).json({ status: 'error', message: 'Invalid comment ID.' });
        return;
      }

      const updatedComment = await prisma.$transaction(async (transaction) => {
        const comment = await transaction.herbComment.findUnique({
          where: { id: commentIdInt }, select: { herbId: true },
        });
        if (!comment || !await lockPublishedHerb(transaction, comment.herbId)) return null;
        const target = await transaction.herbComment.updateMany({
          where: {
            id: commentIdInt, isDeleted: false,
            herb: { publicationStatus: 'PUBLISHED', isVerified: true },
          },
          data: { likes: { increment: 0 } },
        });
        if (target.count === 0) return null;

        const key = { commentId_userId: { commentId: commentIdInt, userId } };
        const existingLike = await transaction.herbCommentLike.findUnique({ where: key });
        if (existingLike) {
          await transaction.herbCommentLike.delete({ where: key });
        } else {
          await transaction.herbCommentLike.create({ data: { commentId: commentIdInt, userId } });
        }
        const likes = await transaction.herbCommentLike.count({ where: { commentId: commentIdInt } });
        return transaction.herbComment.update({
          where: { id: commentIdInt }, data: { likes },
          include: { userLikes: { select: { userId: true } } },
        });
      });
      if (!updatedComment) {
        res.status(404).json({ status: 'error', message: 'Comment not found' });
        return;
      }

      await emitCommentEvent('comment_liked', {
        commentId: commentIdInt, 
        herbId: updatedComment.herbId,
        likes: updatedComment.likes, 
        userLikes: updatedComment.userLikes 
      });

      res.status(200).json({ status: 'success', code: 200, data: { comment: updatedComment } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a comment
   */
  public deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const userRole = authReq.user?.role;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const commentId = parseCommentId(req.params.commentId);
      if (commentId === null) {
        res.status(400).json({ status: 'error', message: 'Invalid comment ID.' });
        return;
      }

      await deleteHerbComment(commentId, userId, userRole ?? 'contributor');

      await emitCommentEvent('comment_deleted', commentId);

      res.status(200).json({ status: 'success', code: 200, message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an existing herb (Admin only)
   */
  public updateHerb = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = (req as AuthenticatedRequest).user?.userId;
      if (!adminId) {
        res.status(401).json({ status: 'error', code: 401, message: 'Authentication required' });
        return;
      }
      
      const herb = await prisma.herb.findUnique({
        where: { id },
      });

      if (!herb) {
        res.status(404).json({ status: 'error', message: 'Herb not found' });
        return;
      }

      // Check if new name already exists and it's not the same herb
      const localNameInput = req.body.localName?.trim();
      const scientificNameInput = req.body.scientificName?.trim();

      if (localNameInput && localNameInput !== herb.localName) {
        const existingName = await prisma.herb.findFirst({
          where: { localName: { equals: localNameInput, mode: 'insensitive' } }
        });
        if (existingName) {
          res.status(400).json({ status: 'error', message: `A herb with the name "${localNameInput}" already exists.` });
          return;
        }
      }

      const updatedHerb = await runAuditedMutation({
        adminId,
        action: 'UPDATE_HERB',
        targetType: 'Herb',
      }, async (transaction) => {
        const updated = await transaction.herb.update({
          where: { id },
          data: {
            localName: localNameInput || herb.localName,
            cebuanoName: req.body.cebuanoName !== undefined ? req.body.cebuanoName : herb.cebuanoName,
            scientificName: scientificNameInput || herb.scientificName,
            category: req.body.category || herb.category,
            medicinalUses: req.body.medicinalUses || herb.medicinalUses,
            preparationMethod: req.body.preparationMethod || herb.preparationMethod,
            dosage: req.body.dosage || herb.dosage,
            regionFound: req.body.regionFound !== undefined ? req.body.regionFound : herb.regionFound,
            warnings: req.body.warnings !== undefined ? req.body.warnings : herb.warnings,
            imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : herb.imageUrl,
            isDohApproved: req.body.isDohApproved !== undefined ? req.body.isDohApproved : herb.isDohApproved,
          },
        });
        return {
          result: updated,
          targetId: id,
          details: { localName: updated.localName, scientificName: updated.scientificName },
        };
      });
      herbRepo.invalidateHerbCache();

      res.status(200).json({ status: 'success', code: 200, message: 'Herb updated successfully', data: { herb: updatedHerb } });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete an herb from the database.
   */
  public deleteHerb = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = (req as AuthenticatedRequest).user?.userId;
      if (!adminId) {
        res.status(401).json({ status: 'error', code: 401, message: 'Authentication required' });
        return;
      }
      const herb = await prisma.herb.findUnique({
        where: { id },
      });

      if (!herb) {
        res.status(404).json({ status: 'error', message: 'Herb not found' });
        return;
      }

      await runAuditedMutation({
        adminId,
        action: 'DELETE_HERB',
        targetType: 'Herb',
      }, async (transaction) => {
        const deleted = await transaction.herb.delete({ where: { id } });
        return {
          result: deleted,
          targetId: id,
          details: { localName: deleted.localName, scientificName: deleted.scientificName },
        };
      });
      herbRepo.invalidateHerbCache();

      res.status(200).json({ status: 'success', code: 200, message: 'Herb deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
