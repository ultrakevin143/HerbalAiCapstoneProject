import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { AuthMiddleware } from '../middlewares/auth.middleware.js';
import { permittedRole } from '../middlewares/role.middleware.js';
import { Role } from '@prisma/client';

const router = Router();
const authMiddleware = new AuthMiddleware();

// Only admin can view dashboard stats
router.get('/dashboard', authMiddleware.execute, permittedRole([Role.admin]), statsController.getDashboardStats);

export default router;

