import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  adminId: string;
  action: string;
  targetType: "SuggestedHerb" | "Herb" | "User" | "KnowledgeBase" | "Thread" | "ThreadComment" | "HerbComment";
  targetId: string;
  details?: Record<string, unknown>;
}

export const runAuditedMutation = async <T>(
  audit: Pick<CreateAuditLogParams, "adminId" | "action" | "targetType">,
  mutate: (transaction: Prisma.TransactionClient) => Promise<{
    result: T;
    targetId: string;
    details?: Record<string, unknown>;
  }>,
  existingTransaction?: Prisma.TransactionClient,
): Promise<T> => {
  const execute = async (transaction: Prisma.TransactionClient) => {
    const { result, targetId, details } = await mutate(transaction);
    await transaction.auditLog.create({
      data: {
        ...audit,
        targetId,
        details: (details as Prisma.InputJsonValue) ?? undefined,
      },
    });
    return result;
  };
  return existingTransaction ? execute(existingTransaction) : prisma.$transaction(execute);
};

/**
 * Retrieves audit logs with admin details, ordered by most recent.
 */
export const findAuditLogs = async (limit: number = 50, offset: number = 0) => {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count(),
  ]);

  return { logs, total };
};
