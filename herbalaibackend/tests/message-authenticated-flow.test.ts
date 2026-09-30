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
    expect(await prisma.chatMessage.findUniqueOrThrow({ where: { id: messageId } })).toMatchObject({ isDeleted: true, content: '', imageUrl: null });
    expect((await sender.put(path).send({ content: 'Cannot restore deleted text' })).status).toBe(400);
    const deletedHistory = await receiver.get(`/api/messages/history/${senderId}`);
    expect(deletedHistory.body.data.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: messageId, isDeleted: true, content: '', imageUrl: null }),
    ]));
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
});
