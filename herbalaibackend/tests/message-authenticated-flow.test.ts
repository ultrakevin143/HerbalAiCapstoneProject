import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ upload: vi.fn(), emit: vi.fn() }));
vi.mock('../src/server.js', () => ({ io: { to: vi.fn(() => ({ emit: mocks.emit })) } }));
vi.mock('../src/services/cloudinary.service.js', () => ({ uploadToCloudinary: mocks.upload }));

import app from '../src/app.js';
import { ENV } from '../src/config/env.js';
import { prisma, closeDatabasePool } from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import * as messageRepo from '../src/repositories/message.repository.js';

const suffix = randomUUID();
const senderId = `message-sender-${suffix}`;
const receiverId = `message-receiver-${suffix}`;
const otherId = `message-other-${suffix}`;
const userIds = [senderId, receiverId, otherId];
const password = `TEST-only-${randomUUID()}`;
const sender = request.agent(app);
const receiver = request.agent(app);
const other = request.agent(app);
let safeDatabase = false;

const sendText = async (content = 'TEST ONLY private message') => {
  const response = await sender.post('/api/messages').send({ receiverId, content });
  expect(response.status).toBe(201);
  return response.body.data.message.id as number;
};

describe('isolated authenticated Messenger workflow', () => {
  beforeAll(async () => {
    const target = new URL(ENV.DATABASE_URL ?? 'postgresql://invalid');
    if (ENV.NODE_ENV !== 'test' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || target.pathname !== '/herbalai_test') {
      throw new Error('Messenger fixtures require the isolated loopback herbalai_test database.');
    }
    safeDatabase = true;
    const hashedPassword = await hashPassword(password);
    await prisma.user.createMany({ data: userIds.map(id => ({
      id, username: id.replaceAll('-', '_'), email: `${id}@example.invalid`,
      name: 'TEST ONLY Messenger account', password: hashedPassword,
      role: id === otherId ? 'admin' : 'contributor', emailVerified: new Date(),
    })) });
    for (const [agent, id] of [[sender, senderId], [receiver, receiverId], [other, otherId]] as const) {
      expect((await agent.post('/api/auth/login').send({ email: `${id}@example.invalid`, password })).status).toBe(200);
    }
    mocks.upload.mockResolvedValue('https://example.invalid/test-only-messenger.png');
  }, 30000);

  afterAll(async () => {
    try {
      if (safeDatabase) {
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        expect(await prisma.chatMessage.count({ where: { senderId: { in: userIds } } })).toBe(0);
        expect(await prisma.notification.count({ where: { userId: { in: userIds } } })).toBe(0);
      }
    } finally {
      await closeDatabasePool();
    }
  });

  it('persists delivery/notification, isolates history, and keeps edits/deletes sender-only', async () => {
    const messageId = await sendText();
    const path = `/api/messages/${messageId}`;
    expect(await prisma.chatMessage.findUniqueOrThrow({ where: { id: messageId } })).toMatchObject({ senderId, receiverId });
    expect(await prisma.notification.count({ where: { userId: receiverId, type: 'DIRECT_MESSAGE', link: `/messenger?userId=${encodeURIComponent(senderId)}` } })).toBe(1);
    const history = await receiver.get(`/api/messages/history/${senderId}`);
    expect(history.status).toBe(200);
    expect(history.body.data.messages).toEqual(expect.arrayContaining([expect.objectContaining({ id: messageId })]));
    expect((await other.get(`/api/messages/history/${senderId}`)).body.data.messages).toEqual([]);
    expect((await receiver.put(path).send({ content: 'Unauthorized edit' })).status).toBe(403);
    expect((await other.delete(path)).status).toBe(403);
    expect((await request(app).put(path).send({ content: 'Guest edit' })).status).toBe(401);
    const edited = await sender.put(path).send({ content: ` ${'x'.repeat(2000)} ` });
    expect(edited.status).toBe(200);
    expect(edited.body.data.message).toMatchObject({ content: 'x'.repeat(2000), isEdited: true });
    expect((await sender.delete(path)).status).toBe(200);
    mocks.emit.mockClear();
    expect((await sender.delete(path)).status).toBe(404);
    expect(mocks.emit).not.toHaveBeenCalled();
    expect(await prisma.chatMessage.findUniqueOrThrow({ where: { id: messageId } })).toMatchObject({ isDeleted: true, content: '', imageUrl: null });
    expect((await sender.put(path).send({ content: 'Cannot restore deleted text' })).status).toBe(400);
    const deletedHistory = await receiver.get(`/api/messages/history/${senderId}`);
    expect(deletedHistory.body.data.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: messageId, isDeleted: true, content: '', imageUrl: null }),
    ]));
  });

  it('matches literal punctuation in conversation names without leaking wildcard matches into pagination', async () => {
    const previous = await prisma.user.findUniqueOrThrow({ where: { id: receiverId }, select: { name: true } });
    try {
      await prisma.user.update({ where: { id: receiverId }, data: { name: 'TEST ONLY 100%_!\\ literal contact' } });
      await prisma.chatMessage.createMany({ data: [
        { senderId, receiverId, content: 'TEST ONLY literal name search', time: new Date('2026-10-01T00:00:00.000Z') },
        { senderId, receiverId: otherId, content: 'TEST ONLY nonmatching contact', time: new Date('2026-10-01T00:00:01.000Z') },
      ] });
      for (const search of ['%', '_', '!', '\\', '100%_!\\']) {
        const page = await messageRepo.getActiveConversations(senderId, search, 1, 0);
        expect(page.conversations.map(conversation => conversation.contact.id)).toEqual([receiverId]);
        expect(page.hasMore).toBe(false);
        expect(await messageRepo.getActiveConversations(senderId, search, 1, 1)).toEqual({ conversations: [], hasMore: false });
      }
      expect((await messageRepo.getActiveConversations(senderId, 'LITERAL CONTACT')).conversations.map(conversation => conversation.contact.id)).toEqual([receiverId]);
      expect((await messageRepo.getActiveConversations(senderId, '')).conversations).toHaveLength(2);
    } finally {
      await prisma.user.update({ where: { id: receiverId }, data: { name: previous.name } });
    }
  });

  it('rejects malformed IDs and oversized edits without mutating an existing message', async () => {
    const messageId = await sendText('TEST ONLY unchanged text');
    for (const id of [`${messageId}abc`, `${messageId}.5`, '-1', '0', '2147483648']) {
      expect((await sender.put(`/api/messages/${id}`).send({ content: 'Invalid ID edit' })).status).toBe(400);
      expect((await sender.delete(`/api/messages/${id}`)).status).toBe(400);
    }
    expect((await sender.put(`/api/messages/${messageId}`).send({ content: 'x'.repeat(2001) })).status).toBe(400);
    expect((await sender.put(`/api/messages/${messageId}`)).status).toBe(400);
    expect((await sender.put('/api/messages/2147483647').send({ content: 'Absent ID' })).status).toBe(404);
    expect(await prisma.chatMessage.findUniqueOrThrow({ where: { id: messageId } })).toMatchObject({ content: 'TEST ONLY unchanged text', isEdited: false, isDeleted: false });
  });

  it('paginates New Chat deterministically with literal name/username search and excludes self and banned users', async () => {
    const prefix = `Picker${suffix.replaceAll('-', '')}`;
    const ids = Array.from({ length: 23 }, (_, index) => `${prefix}-${String(index).padStart(2, '0')}`);
    const previous = await prisma.user.findUniqueOrThrow({ where: { id: senderId }, select: { name: true, password: true } });
    try {
      await prisma.user.update({ where: { id: senderId }, data: { name: `${prefix} Contact` } });
      await prisma.user.createMany({ data: ids.map((id, index) => ({
        id, username: index === 1 ? `${prefix}_username` : `${prefix}plain${index}`,
        email: `${id}@example.invalid`, password: previous.password,
        name: index === 0 ? `${prefix}%_\\ Contact` : `${prefix} Contact`,
        role: 'contributor', isBanned: index === 22, emailVerified: new Date(),
      })) });
      const first = await sender.get('/api/messages/users').query({ search: prefix.toLowerCase(), limit: 20, offset: 0 });
      const second = await sender.get('/api/messages/users').query({ search: prefix, limit: 20, offset: 20 });
      const repeat = await sender.get('/api/messages/users').query({ search: prefix, limit: 20, offset: 0 });
      for (const response of [first, second, repeat]) expect(response.status).toBe(200);
      expect(first.body.data.users).toHaveLength(20);
      expect(first.body.data.hasMore).toBe(true);
      expect(second.body.data.users).toHaveLength(2);
      expect(second.body.data.hasMore).toBe(false);
      expect(repeat.body.data.users).toEqual(first.body.data.users);
      const observed = [...first.body.data.users, ...second.body.data.users].map((user: { id: string }) => user.id);
      expect(observed.sort()).toEqual(ids.slice(0, 22).sort());
      for (const [search, expected] of [[`${prefix}%`, ids[0]], [`${prefix}_`, ids[1]], [`${prefix}%_\\`, ids[0]]] as const) {
        expect((await messageRepo.getMessageableUsers(senderId, search)).map(user => user.id)).toEqual([expected]);
      }
      const final = await sender.get('/api/messages/users').query({ search: prefix, limit: 20, offset: 40 });
      expect(final.status).toBe(200);
      expect(final.body.data).toEqual({ users: [], hasMore: false });
    } finally {
      await prisma.user.update({ where: { id: senderId }, data: { name: previous.name } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  });

  it('rejects missing/banned recipients before media upload and leaves no message/notification', async () => {
    const beforeMessages = await prisma.chatMessage.count({ where: { senderId } });
    const beforeNotifications = await prisma.notification.count({ where: { userId: { in: userIds } } });
    mocks.upload.mockClear();
    await prisma.user.update({ where: { id: receiverId }, data: { isBanned: true } });
    try {
      for (const targetId of [receiverId, `missing-${suffix}`]) {
        const response = await sender.post('/api/messages').field('receiverId', targetId)
          .attach('image', Buffer.from('TEST ONLY mocked media'), { filename: 'test.png', contentType: 'image/png' });
        expect(response.status).toBe(404);
      }
      expect(mocks.upload).not.toHaveBeenCalled();
      expect(await prisma.chatMessage.count({ where: { senderId } })).toBe(beforeMessages);
      expect(await prisma.notification.count({ where: { userId: { in: userIds } } })).toBe(beforeNotifications);
    } finally {
      await prisma.user.update({ where: { id: receiverId }, data: { isBanned: false } });
    }
  });

  it('rejects malformed multipart text and preserves legitimate image-only delivery', async () => {
    mocks.upload.mockClear();
    const invalid = await sender.post('/api/messages').field('receiverId', receiverId).field('content[invalid]', 'text')
      .attach('image', Buffer.from('TEST ONLY mocked media'), { filename: 'test.png', contentType: 'image/png' });
    expect(invalid.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
    const valid = await sender.post('/api/messages').field('receiverId', receiverId)
      .attach('image', Buffer.from('TEST ONLY mocked media'), { filename: 'test.png', contentType: 'image/png' });
    expect(valid.status).toBe(201);
    expect(valid.body.data.message).toMatchObject({ content: '', imageUrl: 'https://example.invalid/test-only-messenger.png' });
    expect(await prisma.chatMessage.findUniqueOrThrow({ where: { id: valid.body.data.message.id } })).toMatchObject({ senderId, receiverId, imageUrl: 'https://example.invalid/test-only-messenger.png' });
    expect(mocks.upload).toHaveBeenCalledOnce();
    expect((await sender.post('/api/messages')).status).toBe(400);
    expect((await sender.post('/api/messages').send({ receiverId, content: 'x'.repeat(2001) })).status).toBe(400);
    expect((await sender.post('/api/messages').send({ receiverId: senderId, content: 'Self send' })).status).toBe(400);
  });

  it('enforces ownership and deleted-state predicates in the database even after an earlier read', async () => {
    const messageId = await sendText();
    expect(await messageRepo.editMessage(messageId, 'Wrong owner', otherId)).toBeNull();
    expect(await messageRepo.deleteMessage(messageId, otherId)).toBeNull();
    expect(await messageRepo.findMessageById(messageId)).toMatchObject({ isDeleted: false });
    expect(await messageRepo.deleteMessage(messageId, senderId)).toMatchObject({ isDeleted: true });
    expect(await messageRepo.editMessage(messageId, 'Race must not restore text', senderId)).toBeNull();
    expect(await messageRepo.deleteMessage(messageId, senderId)).toBeNull();
    expect(await messageRepo.findMessageById(messageId)).toMatchObject({ isDeleted: true, content: '', imageUrl: null });
  });

  it('allows exactly one concurrent soft delete', async () => {
    const messageId = await sendText();
    const results = await Promise.all([
      messageRepo.deleteMessage(messageId, senderId),
      messageRepo.deleteMessage(messageId, senderId),
    ]);
    expect(results.filter(result => result !== null)).toHaveLength(1);
    expect(await messageRepo.findMessageById(messageId)).toMatchObject({ isDeleted: true, content: '', imageUrl: null });
  });

  it('never restores content when editing and deleting run concurrently', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const messageId = await sendText();
      const [, removed] = await Promise.all([
        messageRepo.editMessage(messageId, 'TEST ONLY concurrent edit', senderId),
        messageRepo.deleteMessage(messageId, senderId),
      ]);
      expect(removed).toMatchObject({ isDeleted: true });
      expect(await messageRepo.findMessageById(messageId)).toMatchObject({ isDeleted: true, content: '', imageUrl: null });
    }
  });

  it('loads every equal-timestamp message exactly once without leaking a different conversation', async () => {
    const time = new Date('2030-01-01T00:00:00.000Z');
    const times = [new Date(time.getTime() - 1000), ...Array<Date>(6).fill(time), new Date(time.getTime() + 1000)];
    await prisma.chatMessage.createMany({ data: times.map((timestamp, index) => ({
      senderId: index % 2 === 0 ? receiverId : otherId,
      receiverId: index % 2 === 0 ? otherId : receiverId,
      content: `TEST ONLY equal-timestamp fixture ${index}`, time: timestamp,
    })) });
    await prisma.chatMessage.create({ data: { senderId, receiverId: otherId, content: 'TEST ONLY unrelated conversation', time } });
    const expected = await prisma.chatMessage.findMany({
      where: { OR: [{ senderId: receiverId, receiverId: otherId }, { senderId: otherId, receiverId }] },
      orderBy: [{ time: 'desc' }, { id: 'desc' }],
    });
    const observed: number[] = [];
    let before: string | null = null;
    for (let pageIndex = 0; pageIndex < 5; pageIndex += 1) {
      const response = await receiver.get(`/api/messages/history/${otherId}`).query({ limit: 2, ...(before ? { before } : {}) });
      expect(response.status).toBe(200);
      const page = response.body.data;
      const ids = page.messages.map((message: { id: number }) => message.id);
      expect(ids).toEqual(expected.slice(pageIndex * 2, pageIndex * 2 + 2).reverse().map(message => message.id));
      observed.push(...ids);
      before = page.nextBefore;
      if (!page.hasMore) {
        expect(before).toBeNull();
        break;
      }
      expect(before).toMatch(/Z\|[1-9]\d*$/);
    }
    expect(observed).toHaveLength(8);
    expect(new Set(observed).size).toBe(8);
    const legacy = await receiver.get(`/api/messages/history/${otherId}`).query({ before: time.toISOString() });
    expect(legacy.status).toBe(200);
    expect(legacy.body.data.messages.map((message: { id: number }) => message.id)).toEqual([expected[7]?.id]);
  });
});
