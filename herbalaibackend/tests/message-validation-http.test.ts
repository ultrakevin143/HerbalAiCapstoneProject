import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  account: vi.fn(), recipient: vi.fn(), save: vi.fn(), find: vi.fn(),
  edit: vi.fn(), remove: vi.fn(), upload: vi.fn(), emit: vi.fn(), to: vi.fn(),
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: { user: { findUnique: mocks.account } } }));
vi.mock('../src/repositories/message.repository.js', () => ({
  getMessageableUserById: mocks.recipient,
  saveMessageWithNotification: mocks.save,
  findMessageById: mocks.find,
  editMessage: mocks.edit,
  deleteMessage: mocks.remove,
}));
vi.mock('../src/services/cloudinary.service.js', () => ({ uploadToCloudinary: mocks.upload }));
vi.mock('../src/server.js', () => ({ io: { to: mocks.to } }));

import messageRoutes from '../src/routes/message.routes.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { errorResponse } from '../src/utils/error-response.js';

const app = express();
app.use(express.json());
app.use('/api/messages', messageRoutes);
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const response = errorResponse(error, true);
  res.status(response.status).json(response.body);
});
const headers = { Authorization: `Bearer ${generateAccessToken({ userId: 'sender', role: 'contributor' })}` };
const message = { id: 7, senderId: 'sender', receiverId: 'receiver', content: 'Hello', isDeleted: false };

describe('Messenger HTTP input boundaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.account.mockResolvedValue({ role: 'contributor', sessionVersion: 0, isBanned: false });
    mocks.recipient.mockResolvedValue({ id: 'receiver' });
    mocks.find.mockResolvedValue(message);
    mocks.save.mockResolvedValue({ message, notification: { id: 9 } });
    mocks.edit.mockResolvedValue({ ...message, isEdited: true });
    mocks.remove.mockResolvedValue({ ...message, content: '', isDeleted: true });
    mocks.upload.mockResolvedValue('https://example.invalid/test-only.png');
    mocks.to.mockReturnValue({ emit: mocks.emit });
  });

  it.each(['7abc', '7.5', '-1', '0', '2147483648', '9007199254740992'])('rejects invalid message ID %s before any lookup/write', async id => {
    const edited = await request(app).put(`/api/messages/${id}`).set(headers).send({ content: 'Changed' });
    const removed = await request(app).delete(`/api/messages/${id}`).set(headers);
    expect(edited.status).toBe(400);
    expect(removed.status).toBe(400);
    expect(mocks.find).not.toHaveBeenCalled();
    expect(mocks.edit).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('rejects edits over the same 2000-character limit enforced when sending', async () => {
    expect((await request(app).put('/api/messages/7').set(headers).send({ content: 'x'.repeat(2001) })).status).toBe(400);
    expect(mocks.edit).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('rejects a missing JSON body instead of returning an internal error', async () => {
    expect((await request(app).post('/api/messages').set(headers)).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each(['nested', 'repeated'])('rejects %s non-string multipart content even with an image', async shape => {
    const pending = request(app).post('/api/messages').set(headers).field('receiverId', 'receiver');
    if (shape === 'nested') pending.field('content[invalid]', 'text');
    else pending.field('content', 'first').field('content', 'second');
    const response = await pending.attach('image', Buffer.from('TEST ONLY mock attachment'), { filename: 'test.png', contentType: 'image/png' });
    expect(response.status).toBe(400);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each(['missing', 'banned'])('blocks a %s recipient before uploading or writing', async recipient => {
    mocks.recipient.mockResolvedValue(null);
    const response = await request(app).post('/api/messages').set(headers).field('receiverId', recipient)
      .attach('image', Buffer.from('TEST ONLY mock attachment'), { filename: 'test.png', contentType: 'image/png' });
    expect(response.status).toBe(404);
    expect(mocks.recipient).toHaveBeenCalledWith('sender', recipient);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.emit).not.toHaveBeenCalled();
  });

  it('accepts normal text and image-only sends and preserves broadcasts', async () => {
    expect((await request(app).post('/api/messages').set(headers).send({ receiverId: 'receiver', content: ' Hello ' })).status).toBe(201);
    expect(mocks.save).toHaveBeenLastCalledWith('sender', 'receiver', 'Hello', undefined);
    expect((await request(app).post('/api/messages').set(headers).field('receiverId', 'receiver')
      .attach('image', Buffer.from('TEST ONLY mock attachment'), { filename: 'test.png', contentType: 'image/png' })).status).toBe(201);
    expect(mocks.save).toHaveBeenLastCalledWith('sender', 'receiver', '', 'https://example.invalid/test-only.png');
    expect(mocks.emit.mock.calls.map(call => call[0])).toEqual([
      'private_message', 'private_message', 'notification', 'private_message', 'private_message', 'notification',
    ]);
  });

  it('keeps ownership, deleted-message, and guest restrictions', async () => {
    expect((await request(app).post('/api/messages').send({ receiverId: 'receiver', content: 'Hello' })).status).toBe(401);
    mocks.find.mockResolvedValue({ ...message, senderId: 'someone-else' });
    expect((await request(app).put('/api/messages/7').set(headers).send({ content: 'Changed' })).status).toBe(403);
    expect((await request(app).delete('/api/messages/7').set(headers)).status).toBe(403);
    mocks.find.mockResolvedValue({ ...message, isDeleted: true });
    expect((await request(app).put('/api/messages/7').set(headers).send({ content: 'Changed' })).status).toBe(400);
    expect(mocks.edit).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
