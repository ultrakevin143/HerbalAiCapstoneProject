import type { Request, Response } from 'express';
import { statsRepository } from '../repositories/stats.repository.js';

export const statsController = {
  getDashboardStats: async (req: Request, res: Response) => {
    try {
      // Fetch system stats
      const stats = await statsRepository.getSystemStats();
      res.json({ status: 'success', data: stats });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard statistics' });
    }
  },
};

