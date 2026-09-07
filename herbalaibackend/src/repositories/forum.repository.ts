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

export const toggleThreadLike = async (threadId: number, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const key = { threadId_userId: { threadId, userId } };
    const existing = await tx.threadLike.findUnique({ where: key });

    if (existing) {
      await tx.threadLike.delete({ where: key });
    } else {
      await tx.threadLike.create({ data: { threadId, userId } });
    }

    const likes = await tx.threadLike.count({ where: { threadId } });
    await tx.thread.update({ where: { id: threadId }, data: { likes } });
    return { likes, hasLiked: !existing };
  });
};

export const hasUserLikedThread = async (threadId: number, userId: string) =>
  Boolean(await prisma.threadLike.findUnique({ where: { threadId_userId: { threadId, userId } } }));

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
  const comments = await prisma.threadComment.findMany({
    where: {
      threadId,
      // Retain deleted replies in the discussion structure; mask them before returning.
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
  return comments.map(comment => comment.isDeleted
    ? { ...comment, content: '[This reply has been deleted by the author or moderator.]' }
    : comment);
};

export const findCommentById = async (id: number) => {
  return prisma.threadComment.findUnique({
    where: { id },
  });
};

export const toggleCommentLike = async (commentId: number, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const key = { commentId_userId: { commentId, userId } };
    const existing = await tx.threadCommentLike.findUnique({ where: key });

    if (existing) {
      await tx.threadCommentLike.delete({ where: key });
    } else {
      await tx.threadCommentLike.create({ data: { commentId, userId } });
    }

    const likes = await tx.threadCommentLike.count({ where: { commentId } });
    await tx.threadComment.update({ where: { id: commentId }, data: { likes } });
    return { likes, hasLiked: !existing };
  });
};

export const findUserLikedCommentIds = async (threadId: number, userId: string) => {
  const likes = await prisma.threadCommentLike.findMany({
    where: {
      userId,
      comment: { threadId, isDeleted: false },
    },
    select: { commentId: true },
  });
  return likes.map(({ commentId }) => commentId);
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
