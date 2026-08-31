import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export const createThread = async (data: {
  authorId: string;
  title: string;
  category: string;
  content: string;
}) => {
  return prisma.thread.create({
    data,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      },
    },
  });
};

export interface FindThreadsOptions {
  category?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export const findAllThreads = async (options: FindThreadsOptions = {}) => {
  const { category, search, page, limit } = options;
  const where: Prisma.ThreadWhereInput = {
    isDeleted: false,
  };

  if (category && category !== 'all') {
    where.category = category;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { title: { contains: s, mode: 'insensitive' } },
      { content: { contains: s, mode: 'insensitive' } },
    ];
  }

  const paginationArgs: { take?: number; skip?: number } = {};
  if (limit && limit > 0) {
    paginationArgs.take = limit;
    if (page && page > 1) {
      paginationArgs.skip = (page - 1) * limit;
    }
  }

  const [threads, total] = await Promise.all([
    prisma.thread.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: [
        { pinned: 'desc' },
        { date: 'desc' },
      ],
      ...paginationArgs,
    }),
    prisma.thread.count({ where }),
  ]);

  return { threads, total };
};

export const findThreadById = async (id: number) => {
  return prisma.thread.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      },
    },
  });
};

export const incrementThreadViews = async (id: number) => {
  return prisma.thread.update({
    where: { id },
    data: {
      views: { increment: 1 },
    },
  });
};

export const incrementThreadLikes = async (id: number) => {
  return prisma.thread.update({
    where: { id },
    data: {
      likes: { increment: 1 },
    },
  });
};

export const decrementThreadLikes = async (id: number) => {
  return prisma.thread.update({
    where: { id },
    data: {
      likes: { decrement: 1 },
    },
  });
};

export const createComment = async (data: {
  threadId: number;
  authorId: string;
  content: string;
  parentCommentId?: number;
}) => {
  // Use transaction to create the comment and increment thread replies counter
  return prisma.$transaction(async (tx) => {
    const comment = await tx.threadComment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    await tx.thread.update({
      where: { id: data.threadId },
      data: {
        replies: { increment: 1 },
      },
    });

    return comment;
  });
};

export const findCommentsByThreadId = async (threadId: number) => {
  return prisma.threadComment.findMany({
    where: {
      threadId,
      // We still select deleted comments but filter their content visually or mask it
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          role: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
};

export const findCommentById = async (id: number) => {
  return prisma.threadComment.findUnique({
    where: { id },
  });
};

export const incrementCommentLikes = async (id: number) => {
  return prisma.threadComment.update({
    where: { id },
    data: {
      likes: { increment: 1 },
    },
  });
};

export const deleteThread = async (id: number) => {
  return prisma.thread.update({
    where: { id },
    data: { isDeleted: true },
  });
};

export const deleteComment = async (id: number) => {
  return prisma.threadComment.update({
    where: { id },
    data: { isDeleted: true },
  });
};
