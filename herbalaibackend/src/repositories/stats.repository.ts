import { prisma } from '../lib/prisma.js';

export const statsRepository = {
  getSystemStats: async () => {
    const [herbsByCategoryRaw, suggestionsByStatusRaw, threadsByCategoryRaw, totalHerbs, totalUsers, totalKnowledgeFacts, recentSuggestions] = await Promise.all([
      prisma.herb.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.suggestedHerb.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.thread.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.herb.count({ where: { publicationStatus: 'PUBLISHED', isVerified: true } }),
      prisma.user.count(),
      prisma.knowledgeBase.count(),
      prisma.suggestedHerb.findMany({
        select: { id: true, localName: true, scientificName: true, status: true },
        orderBy: { submittedAt: 'desc' },
        take: 4,
      }),
    ]);

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
      totalHerbs,
      totalUsers,
      totalKnowledgeFacts,
      recentSuggestions,
      herbsByCategory,
      suggestionsByStatus,
      threadsByCategory,
    };
  },
};
