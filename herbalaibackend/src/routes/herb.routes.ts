import { Router } from 'express';
import { HerbController } from '../controllers/herb.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { permittedRole } from '../middlewares/role.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const herbController = new HerbController();
const authMiddleware = new AuthMiddleware();

// GET /api/herbs - Get all herbs for the library
router.get('/', herbController.getAllHerbs);
router.get('/categories', herbController.getCategories);
router.get('/catalog', herbController.getCatalog);

// GET /api/herbs/:id - Get a single herb's details
router.get('/:id', herbController.getHerbById);

// GET /api/herbs/:id/comments - Get all comments for a specific herb
router.get('/:id/comments', herbController.getComments);

// POST /api/herbs/:id/comments - Add a comment or reply
router.post('/:id/comments', authMiddleware.execute, herbController.addComment);

// POST /api/herbs/comments/:commentId/like - Toggle a like on a comment
router.post('/comments/:commentId/like', authMiddleware.execute, herbController.toggleCommentLike);

// DELETE /api/herbs/comments/:commentId - Delete a comment
router.delete('/comments/:commentId', authMiddleware.execute, herbController.deleteComment);

// PUT /api/herbs/:id - Update an herb (Admin only)
router.put('/:id', authMiddleware.execute, permittedRole([Role.admin]), herbController.updateHerb);

// DELETE /api/herbs/:id - Delete a herb (Admin only)
router.delete('/:id', authMiddleware.execute, permittedRole([Role.admin]), herbController.deleteHerb);

export default router;
