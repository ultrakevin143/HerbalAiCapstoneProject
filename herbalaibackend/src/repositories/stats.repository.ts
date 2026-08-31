import { prisma } from '../lib/prisma.js';

export const statsRepository = {
  getSystemStats: async () => {
    // Herbs by category
    const herbsByCategoryRaw = await prisma.herb.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });
    
    // Suggestions by status
    const suggestionsByStatusRaw = await prisma.suggestedHerb.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
    
    // Forum threads by category
    const threadsByCategoryRaw = await prisma.thread.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    // Format for charting libraries
    const herbsByCategory = herbsByCategoryRaw.map((item) => ({
      name: item.category,
      value: item._count.id,
    }));

    const suggestionsByStatus = suggestionsByStatusRaw.map((item) => ({
      name: item.status,
      value: item._count.id,
    }));

    const threadsByCategory = threadsByCategoryRaw.map((item) => ({
      name: item.category,
      value: item._count.id,
    }));

    return {
      herbsByCategory,
      suggestionsByStatus,
      threadsByCategory,
    };
  },
};

