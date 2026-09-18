import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ message: vi.fn(), notification: vi.fn(), save: vi.fn(), emit: vi.fn(), to: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: {
  $transaction: (callback: (transaction: unknown) => unknown) => callback({
    chatMessage: { create: mocks.message }, notification: { create: mocks.notification },
  }),
} }));
vi.mock('../src/repositories/message.repository.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/repositories/message.repository.js')>();
  return { ...original, saveMessageWithNotification: mocks.save };
});
vi.mock('../src/services/cloudinary.service.js', () => ({ uploadToCloudinary: vi.fn() }));
vi.mock('../src/server.js', () => ({ io: { to: mocks.to } }));

import { sendMessage } from '../src/controllers/message.controller.js';

describe('Direct message notifications', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.to.mockReturnValue({ emit: mocks.emit });
  });

  it('persists the message and recipient notification in one transaction', async () => {
    const repository = await vi.importActual<typeof import('../src/repositories/message.repository.js')>('../src/repositories/message.repository.js');
    mocks.message.mockResolvedValue({ id: 8, sender: { name: 'Maria' } });
    mocks.notification.mockResolvedValue({ id: 12, userId: 'receiver' });
    const result = await repository.saveMessageWithNotification('sender', 'receiver', 'Hello');
    expect(mocks.notification).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: 'receiver', title: 'New message from Maria', message: 'Sent you a message.',
      type: 'DIRECT_MESSAGE', link: '/messenger?userId=sender',
    }) });
    expect(result).toEqual({ message: { id: 8, sender: { name: 'Maria' } }, notification: { id: 12, userId: 'receiver' } });
  });

  it('broadcasts the message to both users and the notification only to its recipient', async () => {
    const message = { id: 8, senderId: 'sender', receiverId: 'receiver' };
    const notification = { id: 12, userId: 'receiver', type: 'DIRECT_MESSAGE' };
    mocks.save.mockResolvedValue({ message, notification });
    const req = { user: { userId: 'sender' }, body: { receiverId: 'receiver', content: 'Hello' } } as never;
    const status = vi.fn();
    const json = vi.fn();
    status.mockReturnValue({ json });
    await sendMessage(req, { status } as never, vi.fn());
    expect(mocks.to).toHaveBeenNthCalledWith(1, 'sender');
    expect(mocks.to).toHaveBeenNthCalledWith(2, 'receiver');
    expect(mocks.to).toHaveBeenNthCalledWith(3, 'receiver');
    expect(mocks.emit.mock.calls).toEqual([
      ['private_message', message], ['private_message', message], ['notification', notification],
    ]);
    expect(status).toHaveBeenCalledWith(201);
  });
});
