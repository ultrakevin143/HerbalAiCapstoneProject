import { prisma } from "../lib/prisma.js";

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
export const editMessage = async (id: number, content: string) => {
  return prisma.chatMessage.update({
    where: { id },
    data: { content, isEdited: true },
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

/**
 * Soft delete a message by clearing content/imageUrl and setting isDeleted = true.
 */
export const deleteMessage = async (id: number) => {
  return prisma.chatMessage.update({
    where: { id },
    data: { content: "", imageUrl: null, isDeleted: true },
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

/**
 * Get the chronological chat history between two users with optional pagination.
 */
export const getChatHistory = async (
  userAId: string,
  userBId: string,
  limit: number = 50,
  beforeTime?: Date
) => {
  const where: {
    OR: Array<{ senderId: string; receiverId: string }>;
    time?: { lt: Date };
  } = {
    OR: [
      { senderId: userAId, receiverId: userBId },
      { senderId: userBId, receiverId: userAId },
    ],
  };

  if (beforeTime) {
    where.time = { lt: beforeTime };
  }

  const boundedLimit = Math.min(100, Math.max(1, limit));
  const rows = await prisma.chatMessage.findMany({
    where,
    include: {
      sender: {
        select: { id: true, name: true, avatar: true, role: true },
      },
    },
    orderBy: { time: "desc" },
    take: boundedLimit + 1,
  });

  const hasMore = rows.length > boundedLimit;
  const messages = rows.slice(0, boundedLimit).reverse();
  return {
    messages,
    hasMore,
    nextBefore: hasMore ? messages[0]?.time.toISOString() ?? null : null,
  };
};

/**
 * Get a list of distinct users the current user has conversed with,
 * plus the most recent message for preview in the sidebar.
 * Optimized via PostgreSQL DISTINCT ON for direct database execution.
 */
export const getActiveConversations = async (userId: string, search = "", limit = 25, offset = 0) => {
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
    WHERE recent.contact_name ILIKE ${`%${search}%`}
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
  return prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      isBanned: false,
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { username: { contains: search, mode: "insensitive" } }] } : {}),
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
    where: { id: targetUserId, NOT: { id: currentUserId }, isBanned: false },
    select: { id: true, name: true, avatar: true, role: true },
  });
