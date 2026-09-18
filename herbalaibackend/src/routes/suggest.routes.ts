import { Router } from 'express';
import { SuggestController } from '../controllers/suggest.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { uploadImage } from '../middlewares/upload.middleware.js';
import { validateSchema } from '../middlewares/validate.js';
import { approveSuggestionSchema, editSuggestionSchema, rejectSuggestionSchema, requestSuggestionChangesSchema, suggestHerbSchema } from '../schema/suggest.schema.js';
import { permittedRole } from '../middlewares/role.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const suggestController = new SuggestController();
const authMiddleware = new AuthMiddleware();

router.patch('/:id', authMiddleware.execute, permittedRole([Role.admin]), validateSchema(editSuggestionSchema), suggestController.edit);

router.post('/:id/resubmit', authMiddleware.execute, uploadImage, validateSchema(suggestHerbSchema), suggestController.resubmit);

// POST /api/suggest - Submit a new herb suggestion
router.post(
  '/',
  authMiddleware.execute, // Ensure user is authenticated
  uploadImage,            // Parse the image file and populate req.body
  validateSchema(suggestHerbSchema), // Validate text inputs
  suggestController.suggest
);

// GET /api/suggest - List all suggestions (for Admin/Moderator reviews)
router.get(
  '/',
  authMiddleware.execute, // For authenticated users (admin can review)
  suggestController.listSuggestions
);

// POST /api/suggest/:id/approve - Approve suggestion (Admin only)
router.post(
  '/:id/approve',
  authMiddleware.execute,
  permittedRole([Role.admin]),
  validateSchema(approveSuggestionSchema),
  suggestController.approveSuggestion
);

router.post(
  '/:id/request-changes',
  authMiddleware.execute,
  permittedRole([Role.admin]),
  validateSchema(requestSuggestionChangesSchema),
  suggestController.requestChanges
);

// POST /api/suggest/:id/reject - Reject suggestion (Admin only)
router.post(
  '/:id/reject',
  authMiddleware.execute,
  permittedRole([Role.admin]),
  validateSchema(rejectSuggestionSchema),
  suggestController.rejectSuggestion
);

export default router;
