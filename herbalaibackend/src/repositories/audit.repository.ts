import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

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
export const findAuditLogs = async (limit: number = 50, offset: number = 0, search: string = '') => {
  const include = {
    admin: { select: { id: true, name: true, email: true, username: true, avatar: true } },
  } satisfies Prisma.AuditLogInclude;
  const orderBy: Prisma.AuditLogOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }];
  const query = search.trim().toLowerCase();
  if (query) {
    // Search JSON details as text too, retaining the existing browser filter's
    // behavior. strpos treats percent/underscore literally; all values are bound.
    const where = Prisma.sql`strpos(lower(concat_ws(E'\n', audit.action, audit."targetType", audit."targetId",
      actor.name, actor.email, actor.username, audit.details::text)), ${query}) > 0`;
    const [ids, counts] = await Promise.all([
      prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`SELECT audit.id FROM "AuditLog" audit
        JOIN "User" actor ON actor.id = audit."adminId" WHERE ${where}
        ORDER BY audit."createdAt" DESC, audit.id DESC LIMIT ${limit} OFFSET ${offset}`),
      prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT COUNT(*)::int AS total FROM "AuditLog" audit
        JOIN "User" actor ON actor.id = audit."adminId" WHERE ${where}`),
    ]);
    const logs = ids.length ? await prisma.auditLog.findMany({
      where: { id: { in: ids.map(row => row.id) } }, include, orderBy,
    }) : [];
    return { logs, total: counts[0]?.total ?? 0 };
  }
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      include,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count(),
  ]);

  return { logs, total };
};
