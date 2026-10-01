import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ update: vi.fn(), history: vi.fn(), query: vi.fn(), users: vi.fn() }));
vi.mock('../src/lib/prisma.js', () => ({ prisma: { chatMessage: { update: mocks.update, findMany: mocks.history }, $queryRaw: mocks.query, user: { findMany: mocks.users } } }));

import { deleteMessage, editMessage, getChatHistory, getActiveConversations, getMessageableUsers } from '../src/repositories/message.repository.js';

describe('Messenger repository mutation and pagination boundaries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.update.mockResolvedValue({ id: 7 });
    mocks.history.mockResolvedValue([]);
    mocks.query.mockResolvedValue([]);
    mocks.users.mockResolvedValue([]);
  });

  it('edits only an existing non-deleted message belonging to the authenticated sender', async () => {
    await editMessage(7, 'Changed', 'sender');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, senderId: 'sender', isDeleted: false },
      data: { content: 'Changed', isEdited: true },
    }));
  });

  it.each([
    ['%', '%!%%'],
    ['_', '%!_%'],
    ['!', '%!!%'],
    ['\\', '%\\%'],
    ['100%_!\\', '%100!%!_!!\\%'],
    ["O'Brien", "%O'Brien%"],
    ['', '%%'],
  ])('uses literal name matching for search %j without interpolating SQL', async (search, pattern) => {
    expect(await getActiveConversations('sender', search, 2, 3)).toEqual({ conversations: [], hasMore: false });
    const [fragments, ...values] = mocks.query.mock.calls[0];
    expect(fragments.join('')).toContain("ESCAPE '!'");
    expect(values).toContain(pattern);
    expect(values.slice(-2)).toEqual([3, 3]);
    if (search.length > 1) expect(fragments.join('')).not.toContain(search);
  });

  it.each([['%', '\\%'], ['_', '\\_'], ['\\', '\\\\'], ['%_\\', '\\%\\_\\\\'], ["O'Brien", "O'Brien"]])('keeps New Chat name and username search %j literal and preserves visibility/pagination', async (search, escaped) => {
    await getMessageableUsers('sender', search, 20, 20);
    expect(mocks.users).toHaveBeenCalledWith({
      where: { id: { not: 'sender' }, isBanned: false, OR: [
        { name: { contains: escaped, mode: 'insensitive' } },
        { username: { contains: escaped, mode: 'insensitive' } },
      ] },
      select: { id: true, name: true, avatar: true, role: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }], take: 21, skip: 20,
    });
  });

  it('deletes only once and clears both text and media in the conditional write', async () => {
    await deleteMessage(7, 'sender');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 7, senderId: 'sender', isDeleted: false },
      data: { content: '', imageUrl: null, isDeleted: true },
    }));
  });

  it.each(['edit', 'delete'])('returns null when the %s predicate no longer matches', async operation => {
    mocks.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('TEST ONLY no matching row', { code: 'P2025', clientVersion: 'test' }));
    const result = operation === 'edit' ? await editMessage(7, 'Changed', 'sender') : await deleteMessage(7, 'sender');
    expect(result).toBeNull();
  });

  it.each(['edit', 'delete'])('does not conceal other %s database failures', async operation => {
    const failure = new Prisma.PrismaClientKnownRequestError('TEST ONLY database error', { code: 'P2024', clientVersion: 'test' });
    mocks.update.mockRejectedValue(failure);
    const pending = operation === 'edit' ? editMessage(7, 'Changed', 'sender') : deleteMessage(7, 'sender');
    await expect(pending).rejects.toBe(failure);
  });

  it('orders equal timestamps deterministically and emits the oldest returned message ID in the cursor', async () => {
    const time = new Date('2026-10-01T00:00:00.000Z');
    mocks.history.mockResolvedValue([9, 8, 7].map(id => ({ id, time })));
    const page = await getChatHistory('sender', 'receiver', 2);
    expect(mocks.history).toHaveBeenCalledWith(expect.objectContaining({ orderBy: [{ time: 'desc' }, { id: 'desc' }], take: 3 }));
    expect(page.messages.map(message => message.id)).toEqual([8, 9]);
    expect(page.nextBefore).toBe(`${time.toISOString()}|8`);
    expect(page.hasMore).toBe(true);
  });

  it('combines the tuple cursor with conversation membership instead of replacing it', async () => {
    const time = new Date('2026-10-01T00:00:00.000Z');
    await getChatHistory('sender', 'receiver', 2, { time, id: 8 });
    expect(mocks.history).toHaveBeenCalledWith(expect.objectContaining({ where: {
      OR: [{ senderId: 'sender', receiverId: 'receiver' }, { senderId: 'receiver', receiverId: 'sender' }],
      AND: { OR: [{ time: { lt: time } }, { time, id: { lt: 8 } }] },
    } }));
  });

  it('retains the strict timestamp boundary for legacy cursors and stops at an empty final page', async () => {
    const time = new Date('2026-10-01T00:00:00.000Z');
    const page = await getChatHistory('sender', 'receiver', 2, { time });
    expect(mocks.history).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      AND: { OR: [{ time: { lt: time } }] },
    }) }));
    expect(page).toEqual({ messages: [], hasMore: false, nextBefore: null });
  });
});
