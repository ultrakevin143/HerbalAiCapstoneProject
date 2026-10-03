import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { runAuditedMutation } from './audit.repository.js';

export const lockPublishedHerb = async (transaction: Prisma.TransactionClient, herbId: string) => {
  const herbs = await transaction.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Herb"
    WHERE "id" = ${herbId} AND "publicationStatus" = 'PUBLISHED'::"HerbPublicationStatus" AND "isVerified" = true
    FOR SHARE
  `;
  return herbs.length > 0;
};

export const createHerbComment = async (herbId: string, authorId: string, content: string, parentCommentId: number | null) => {
  return prisma.$transaction(async (transaction) => {
    if (!await lockPublishedHerb(transaction, herbId)) {
      throw Object.assign(new Error('Herb not found'), { status: 404 });
    }
    if (parentCommentId !== null) {
      const parents = await transaction.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "HerbComment"
        WHERE "id" = ${parentCommentId} AND "herbId" = ${herbId} AND "isDeleted" = false
        FOR SHARE
      `;
      if (parents.length === 0) {
        throw Object.assign(new Error('The comment you are replying to was not found.'), { status: 400 });
      }
    }
    return transaction.herbComment.create({
      data: { herbId, authorId, content, parentCommentId },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, role: true } },
        userLikes: { select: { userId: true } },
      },
    });
  });
};

export const deleteHerbComment = async (id: number, userId: string, role: string) => {
  const remove = async (transaction: Prisma.TransactionClient) => {
    const comment = await transaction.herbComment.findUnique({ where: { id } });
    if (!comment || comment.isDeleted) {
      throw Object.assign(new Error('Comment not found'), { status: 404 });
    }
    if (comment.authorId !== userId && role !== 'admin') {
      throw Object.assign(new Error('Not authorized to delete this comment'), { status: 403 });
    }
    const deleted = await transaction.herbComment.deleteMany({
      where: { id, isDeleted: false, ...(role === 'admin' ? {} : { authorId: userId }) },
    });
    if (deleted.count === 0) {
      throw Object.assign(new Error('Comment not found'), { status: 404 });
    }
    return { result: comment, targetId: String(id), details: { herbId: comment.herbId } };
  };

  if (role === 'admin') {
    return runAuditedMutation({ adminId: userId, action: 'DELETE_HERB_COMMENT', targetType: 'HerbComment' }, remove);
  }
  return prisma.$transaction(async (transaction) => (await remove(transaction)).result);
};
