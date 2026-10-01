import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

const mocks = vi.hoisted(() => ({ askDrAi: vi.fn(), streamDrAi: vi.fn() }));
vi.mock('../src/services/chat.service.js', () => mocks);

import { sendMessage, streamMessage } from '../src/controllers/chat.controller.js';

describe('Dr. Ai provider errors', () => {
  beforeEach(() => vi.resetAllMocks());

  it('does not expose provider details in the JSON response', async () => {
    mocks.askDrAi.mockRejectedValue(new Error('Provider key and model details'));
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await sendMessage(Object.assign(new EventEmitter(), { body: { message: 'Lagundi' } }) as never, Object.assign(new EventEmitter(), { status }) as never);

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Dr. Ai is temporarily unavailable. Please try again later.',
    });
  });

  it('does not expose provider details after a partial stream', async () => {
    mocks.streamDrAi.mockResolvedValue({
      sources: [],
      chunks: (async function* () {
        yield 'Incomplete answer';
        throw new Error('Provider key and model details');
      })(),
    });
    const writes: string[] = [];
    const res = Object.assign(new EventEmitter(), {
      destroyed: false,
      headersSent: true,
      status: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      flushHeaders: vi.fn(),
      write: (value: string) => writes.push(value),
      end: vi.fn(),
    });

    await streamMessage(Object.assign(new EventEmitter(), { body: { message: 'Lagundi' } }) as never, res as never);

    expect(writes.join('')).toContain('event: error');
    expect(writes.join('')).toContain('Dr. Ai is temporarily unavailable. Please try again later.');
    expect(writes.join('')).not.toContain('Provider key and model details');
    expect(res.end).toHaveBeenCalledOnce();
  });
});
