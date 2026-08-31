import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  adminId: string;
  action: string;
  targetType: "SuggestedHerb" | "Herb" | "User" | "KnowledgeBase";
  targetId: string;
  details?: Record<string, unknown>;
}

/**
 * Creates a new audit log record.
 */
export const createAuditLog = async (data: CreateAuditLogParams) => {
  return prisma.auditLog.create({
    data: {
      adminId: data.adminId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      details: (data.details as Prisma.InputJsonValue) ?? undefined,
    },
  });
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
