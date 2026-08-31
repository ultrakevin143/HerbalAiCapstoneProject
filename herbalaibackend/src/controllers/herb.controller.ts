import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { createAuditLog } from '../repositories/audit.repository.js';

import * as herbRepo from '../repositories/herb.repository.js';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export class HerbController {
  /**
   * Get all approved herbs for the library with optional filtering and pagination.
   */
  public getAllHerbs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query["search"] as string | undefined;
      const category = req.query["category"] as string | undefined;
      const isDoh = req.query["isDohApproved"] !== undefined ? req.query["isDohApproved"] === "true" : undefined;
      const page = req.query["page"] ? parseInt(req.query["page"] as string, 10) : undefined;
      const limit = req.query["limit"] ? parseInt(req.query["limit"] as string, 10) : undefined;

      const { herbs, total } = await herbRepo.findAllHerbs({
        search,
        category,
        isDohApproved: isDoh,
        page,
        limit,
      });

      const totalPages = limit && limit > 0 ? Math.ceil(total / limit) : 1;

      res.status(200).json({
        status: 'success',
        code: 200,
        data: {
          herbs,
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
   * Get a single herb by its ID.
   */
  public getHerbById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const herb = await prisma.herb.findUnique({
        where: { id: id as string },
      });

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
      
      const comments = await prisma.herbComment.findMany({
        where: { herbId: id, isDeleted: false },
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
      const { content, parentCommentId } = req.body;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId || !content) {
        res.status(400).json({ status: 'error', message: 'User ID and content are required' });
        return;
      }

      const newComment = await prisma.herbComment.create({
        data: {
          herbId: id,
          authorId: userId,
          content,
          parentCommentId: parentCommentId || null,
        },
        include: {
          author: { select: { id: true, name: true, username: true, avatar: true, role: true } },
          userLikes: { select: { userId: true } },
        },
      });

      // Broadcast the new comment via Socket.io
      const { io } = await import('../server.js');
      io.emit('new_comment', newComment);

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
      const commentId = req.params.commentId as string;
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const commentIdInt = parseInt(commentId, 10);
      
      // Check if user already liked it
      const existingLike = await prisma.herbCommentLike.findUnique({
        where: { commentId_userId: { commentId: commentIdInt, userId } },
      });

      let increment = 0;

      if (existingLike) {
        // Unlike
        await prisma.herbCommentLike.delete({
          where: { commentId_userId: { commentId: commentIdInt, userId } },
        });
        increment = -1;
      } else {
        // Like
        await prisma.herbCommentLike.create({
          data: { commentId: commentIdInt, userId },
        });
        increment = 1;
      }

      const updatedComment = await prisma.herbComment.update({
        where: { id: commentIdInt },
        data: { likes: { increment } },
        include: {
          userLikes: { select: { userId: true } },
        },
      });

      // Broadcast the like update
      const { io } = await import('../server.js');
      io.emit('comment_liked', { 
        commentId: commentIdInt, 
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
      const commentId = parseInt(req.params.commentId as string, 10);
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.userId;
      const userRole = authReq.user?.role;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Authentication required' });
        return;
      }

      const comment = await prisma.herbComment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        res.status(404).json({ status: 'error', message: 'Comment not found' });
        return;
      }

      if (comment.authorId !== userId && userRole !== 'admin') {
        res.status(403).json({ status: 'error', message: 'Not authorized to delete this comment' });
        return;
      }

      // Soft delete: Mark as deleted and clear content OR hard delete?
      // Let's hard delete it if it has no replies, otherwise soft delete?
      // Since onDelete: Cascade/SetNull is configured, hard delete is fine and cleaner for a simple app.
      await prisma.herbComment.delete({
        where: { id: commentId },
      });

      // Broadcast delete
      const { io } = await import('../server.js');
      io.emit('comment_deleted', commentId);

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

      const updatedHerb = await prisma.herb.update({
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

      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.userId;
      if (adminId) {
        createAuditLog({
          adminId,
          action: "UPDATE_HERB",
          targetType: "Herb",
          targetId: id,
          details: { localName: updatedHerb.localName, scientificName: updatedHerb.scientificName },
        }).catch((e) => console.error("Failed to write audit log:", e));
      }

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
      const herb = await prisma.herb.findUnique({
        where: { id },
      });

      if (!herb) {
        res.status(404).json({ status: 'error', message: 'Herb not found' });
        return;
      }

      await prisma.herb.delete({
        where: { id },
      });

      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.userId;
      if (adminId) {
        createAuditLog({
          adminId,
          action: "DELETE_HERB",
          targetType: "Herb",
          targetId: id,
          details: { localName: herb.localName, scientificName: herb.scientificName },
        }).catch((e) => console.error("Failed to write audit log:", e));
      }

      res.status(200).json({ status: 'success', code: 200, message: 'Herb deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}


