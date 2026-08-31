import { Router } from 'express';
import { ForumController } from '../controllers/forum.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
const forumController = new ForumController();
const authMiddleware = new AuthMiddleware();

// GET /api/forum/threads - Get all threads (public)
router.get('/threads', forumController.getThreads);

// POST /api/forum/threads - Create a thread (auth required)
router.post('/threads', authMiddleware.execute, forumController.createThread);

// GET /api/forum/threads/:id - Get specific thread and comments (public)
router.get('/threads/:id', forumController.getThreadDetail);

// DELETE /api/forum/threads/:id - Soft delete thread (auth required)
router.delete('/threads/:id', authMiddleware.execute, forumController.deleteThread);

// POST /api/forum/threads/:id/like - Like a thread (auth required)
router.post('/threads/:id/like', authMiddleware.execute, forumController.likeThread);

// POST /api/forum/threads/:id/comments - Post comment/reply on a thread (auth required)
router.post('/threads/:id/comments', authMiddleware.execute, forumController.createComment);

// POST /api/forum/comments/:id/like - Like a comment (auth required)
router.post('/comments/:id/like', authMiddleware.execute, forumController.likeComment);

// DELETE /api/forum/comments/:id - Delete comment (auth required)
router.delete('/comments/:id', authMiddleware.execute, forumController.deleteComment);

export default router;
