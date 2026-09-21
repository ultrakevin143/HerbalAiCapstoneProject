import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUsers: vi.fn(),
  countUsers: vi.fn(),
  findUser: vi.fn(),
  findMessageable: vi.fn(),
  findMessageableById: vi.fn(),
  findConversations: vi.fn(),
}));

vi.mock('../src/repositories/user.repository.js', () => ({
  findAllUsers: mocks.findUsers,
  countUsers: mocks.countUsers,
  findUserById: mocks.findUser,
}));
vi.mock('../src/repositories/message.repository.js', () => ({
  getMessageableUsers: mocks.findMessageable,
  getMessageableUserById: mocks.findMessageableById,
  getActiveConversations: mocks.findConversations,
}));

import { AuthController } from '../src/controllers/auth.controller.js';
import { getConversations, getUsers } from '../src/controllers/message.controller.js';

const response = () => {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json };
};

describe('bounded user lists', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findUser.mockResolvedValue({ role: 'admin' });
    mocks.findUsers.mockResolvedValue([{ id: 'one' }]);
    mocks.countUsers.mockResolvedValue(101);
  });

  it('caps admin pages and reports total rows', async () => {
    const res = response();
    await new AuthController().getAllUsers({ user: { userId: 'admin' }, query: { page: '2', limit: '9999' } } as never, res as never, vi.fn());
    expect(mocks.findUsers).toHaveBeenCalledWith(100, 100);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ total: 101, page: 2, limit: 100 }) }));
  });

  it('returns a bounded, searchable picker page with hasMore', async () => {
    const res = response();
    mocks.findMessageable.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
    await getUsers({ user: { userId: 'me' }, query: { search: 'lag', limit: '1', offset: '20' } } as never, res as never, vi.fn());
    expect(mocks.findMessageable).toHaveBeenCalledWith('me', 'lag', 1, 20);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { users: [{ id: 'one' }], hasMore: true } }));
  });

  it('bounds conversation pages and forwards server-side search', async () => {
    const res = response();
    mocks.findConversations.mockResolvedValue({ conversations: [], hasMore: false });
    await getConversations({ user: { userId: 'me' }, query: { search: 'ana', limit: '999', offset: '25' } } as never, res as never, vi.fn());
    expect(mocks.findConversations).toHaveBeenCalledWith('me', 'ana', 50, 25);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { conversations: [], hasMore: false } }));
  });
});
