import type { NextFunction, Request, Response } from 'express';
import { statsRepository } from '../repositories/stats.repository.js';

export const statsController = {
  getDashboardStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch system stats
      const stats = await statsRepository.getSystemStats();
      res.json({ status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  },
};

