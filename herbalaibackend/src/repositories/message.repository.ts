import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import type { MessageCursor } from "../utils/message-cursor.js";
import { eligibleAccountFilter } from '../lib/user-ban.js';

const missingMessageToNull = (error: unknown): null => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
  throw error;
};

/**
 * Save a new chat message to the database.
 */
export const saveMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  imageUrl?: string
) => {
  return prisma.chatMessage.create({
    data: { senderId, receiverId, content, imageUrl: imageUrl ?? null },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, role: true },
      },
      receiver: {
        select: { id: true, name: true, avatar: true, role: true },
      },
    },
  });
};

export const saveMessageWithNotification = async (
  senderId: string,
  receiverId: string,
  content: string,
  imageUrl?: string
) => {
  return prisma.$transaction(async (transaction) => {
    const message = await transaction.chatMessage.create({
      data: { senderId, receiverId, content, imageUrl: imageUrl ?? null },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
        receiver: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
    const notification = await transaction.notification.create({
      data: {
        userId: receiverId,
        title: `New message from ${message.sender.name}`,
        message: imageUrl ? 'Sent you an image.' : 'Sent you a message.',
        type: 'DIRECT_MESSAGE',
        link: `/messenger?userId=${encodeURIComponent(senderId)}`,
      },
    });
    return { message, notification };
  });
};

/**
 * Find a message by its numeric ID.
 */
export const findMessageById = async (id: number) => {
  return prisma.chatMessage.findUnique({
    where: { id },
  });
};

/**
 * Update message text content and set isEdited = true.
 */
export const editMessage = async (id: number, content: string, senderId: string) => {
  return prisma.chatMessage.update({
    where: { id, senderId, isDeleted: false },
    data: { content, isEdited: true },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, role: true },
      },
      receiver: {
        select: { id: true, name: true, avatar: true, role: true },
      },
    },
  }).catch(missingMessageToNull);
};

/**
 * Soft delete a message by clearing content/imageUrl and setting isDeleted = true.
 */
export const deleteMessage = async (id: number, senderId: string) => {
  return prisma.chatMessage.update({
    where: { id, senderId, isDeleted: false },
    data: { content: "", imageUrl: null, isDeleted: true },
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, role: true },
      },
      receiver: {
        select: { id: true, name: true, avatar: true, role: true },
      },
    },
  }).catch(missingMessageToNull);
};

/**
 * Get the chronological chat history between two users with optional pagination.
 */
export const getChatHistory = async (
  userAId: string,
  userBId: string,
  limit: number = 50,
  before?: MessageCursor
) => {
  const where: Prisma.ChatMessageWhereInput = {
    OR: [
      { senderId: userAId, receiverId: userBId },
      { senderId: userBId, receiverId: userAId },
    ],
  };

  if (before) {
    where.AND = {
      OR: [
        { time: { lt: before.time } },
        ...(before.id === undefined ? [] : [{ time: before.time, id: { lt: before.id } }]),
      ],
    };
  }

  const boundedLimit = Math.min(100, Math.max(1, limit));
  const rows = await prisma.chatMessage.findMany({
    where,
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, role: true },
      },
    },
    orderBy: [{ time: "desc" }, { id: "desc" }],
    take: boundedLimit + 1,
  });

  const hasMore = rows.length > boundedLimit;
  const messages = rows.slice(0, boundedLimit).reverse();
  const oldest = messages[0];
  return {
    messages,
    hasMore,
    nextBefore: hasMore && oldest ? `${oldest.time.toISOString()}|${oldest.id}` : null,
  };
};

/**
 * Get a list of distinct users the current user has conversed with,
 * plus the most recent message for preview in the sidebar.
 * Optimized via PostgreSQL DISTINCT ON for direct database execution.
 */
export const getActiveConversations = async (userId: string, search = "", limit = 25, offset = 0) => {
  const searchPattern = `%${search.replace(/[!%_]/g, "!$&")}%`;
  type ConversationRow = {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    time: Date;
    imageUrl: string | null;
    isDeleted: boolean;
    contact_id: string;
    contact_name: string;
    contact_avatar: string | null;
    contact_role: string;
  };

  const rows = await prisma.$queryRaw<ConversationRow[]>`
    SELECT * FROM (
    SELECT DISTINCT ON (contact_id)
      m.id,
      m."senderId",
      m."receiverId",
      m.content,
      m.time,
      m."imageUrl",
      m."isDeleted",
      CASE WHEN m."senderId" = ${userId} THEN m."receiverId" ELSE m."senderId" END as contact_id,
      u.name as contact_name,
      u.avatar as contact_avatar,
      u.role::text as contact_role
    FROM "ChatMessage" m
    JOIN "User" u ON u.id = (CASE WHEN m."senderId" = ${userId} THEN m."receiverId" ELSE m."senderId" END)
    WHERE m."senderId" = ${userId} OR m."receiverId" = ${userId}
    ORDER BY contact_id, m.time DESC, m.id DESC
    ) recent
    WHERE recent.contact_name ILIKE ${searchPattern} ESCAPE '!'
    ORDER BY recent.time DESC, recent.contact_id ASC
    LIMIT ${limit + 1} OFFSET ${offset}
  `;

  const hasMore = rows.length > limit;
  const conversations = rows.slice(0, limit).map((row) => {
    let lastMsgText = row.content;
    if (row.isDeleted) {
      lastMsgText = "This message was deleted";
    } else if (row.imageUrl) {
      lastMsgText = "📷 Sent an image";
    }
    return {
      contact: {
        id: row.contact_id,
        name: row.contact_name,
        avatar: row.contact_avatar,
        role: row.contact_role,
      },
      lastMessage: lastMsgText,
      lastTime: row.time,
    };
  });
  return { conversations, hasMore };
};

/**
 * Get all users except the current user (for the "New Chat" user picker).
 */
export const getMessageableUsers = async (currentUserId: string, search = "", limit = 20, offset = 0) => {
  const literalSearch = search.replace(/[\\%_]/g, "\\$&");
  return prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      AND: [eligibleAccountFilter()],
      ...(search ? { OR: [{ name: { contains: literalSearch, mode: "insensitive" } }, { username: { contains: literalSearch, mode: "insensitive" } }] } : {}),
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      role: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: limit + 1,
    skip: offset,
  });
};

export const getMessageableUserById = async (currentUserId: string, targetUserId: string) =>
  prisma.user.findFirst({
    where: { id: targetUserId, NOT: { id: currentUserId }, ...eligibleAccountFilter() },
    select: { id: true, name: true, avatar: true, role: true },
  });
