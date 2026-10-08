import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ askDrAi: vi.fn(), streamDrAi: vi.fn() }));
const environment = vi.hoisted(() => ({ DR_AI_REQUEST_TIMEOUT_MS: 90 }));
vi.mock('../src/services/chat.service.js', () => mocks);
vi.mock('../src/config/env.js', () => ({ ENV: environment }));
import { sendMessage, streamMessage } from '../src/controllers/chat.controller.js';

const request = () => Object.assign(new EventEmitter(), { body: { message: 'Lagundi' }, aborted: false });
const response = () => Object.assign(new EventEmitter(), {
  destroyed: false, writableFinished: false, headersSent: false,
  status: vi.fn().mockReturnThis(), setHeader: vi.fn(),
  flushHeaders: vi.fn(function (this: { headersSent: boolean }) { this.headersSent = true; }),
  write: vi.fn(), end: vi.fn(), json: vi.fn(),
});

beforeEach(() => { vi.resetAllMocks(); environment.DR_AI_REQUEST_TIMEOUT_MS = 10_000; });
afterEach(() => vi.useRealTimers());

describe('Chat request lifetime (no database or provider calls)', () => {
  it('cancels pending stream setup on response close without writing to the closed socket', async () => {
    const req = request();
    const res = response();
    let release!: (value: unknown) => void;
    mocks.streamDrAi.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const pending = streamMessage(req as never, res as never);
    await vi.waitFor(() => expect(mocks.streamDrAi).toHaveBeenCalledOnce());
    res.destroyed = true;
    res.emit('close');
    release({ sources: [], chunks: (async function* () { yield 'Late answer'; })(), getResult: () => ({ reply: 'Late answer', sources: [] }) });
    await pending;
    expect(mocks.streamDrAi.mock.calls[0]?.[2]?.signal?.aborted).toBe(true);
    expect(res.write).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();
    expect(res.listenerCount('close')).toBe(0);
  });

  it('does not treat a normal request-body close as a browser disconnect', async () => {
    const req = request();
    const res = response();
    let release!: (value: unknown) => void;
    mocks.askDrAi.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const pending = sendMessage(req as never, res as never);
    await vi.waitFor(() => expect(mocks.askDrAi).toHaveBeenCalledOnce());
    req.emit('close');
    release({ reply: 'Answer', sources: [] });
    await pending;
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'success' }));
    expect(mocks.askDrAi.mock.calls[0]?.[2]?.signal?.aborted).toBe(false);
    expect(res.listenerCount('close')).toBe(0);
    expect(req.listenerCount('aborted')).toBe(0);
  });

  it('bounds a stalled stream iterator and returns only a generic terminal error', async () => {
    vi.useFakeTimers();
    environment.DR_AI_REQUEST_TIMEOUT_MS = 90;
    const req = request();
    const res = response();
    let release!: () => void;
    mocks.streamDrAi.mockResolvedValue({
      sources: [],
      chunks: (async function* () { await new Promise<void>(resolve => { release = resolve; }); })(),
      getResult: vi.fn(),
    });
    const pending = streamMessage(req as never, res as never);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(90);
    const endedAtDeadline = res.end.mock.calls.length;
    release();
    await pending;
    expect(endedAtDeadline).toBe(1);
    expect(res.write.mock.calls.map(call => call[0]).join('')).toContain('event: error');
    expect(res.write.mock.calls.map(call => call[0]).join('')).not.toContain('event: done');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds JSON setup without disclosing timeout details', async () => {
    vi.useFakeTimers();
    environment.DR_AI_REQUEST_TIMEOUT_MS = 90;
    const req = request();
    const res = response();
    mocks.askDrAi.mockImplementation(() => new Promise(() => undefined));
    const pending = sendMessage(req as never, res as never);
    await vi.advanceTimersByTimeAsync(90);
    await pending;
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ status: 'error', message: 'Dr. Ai is temporarily unavailable. Please try again later.' });
    expect(mocks.askDrAi.mock.calls[0]?.[2]?.signal?.reason.name).toBe('TimeoutError');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the stream active while fallback generation exceeds the client gap budget', async () => {
    vi.useFakeTimers();
    environment.DR_AI_REQUEST_TIMEOUT_MS = 90_000;
    const req = request();
    const res = response();
    let release!: () => void;
    mocks.streamDrAi.mockResolvedValue({
      sources: [],
      chunks: (async function* () {
        await new Promise<void>(resolve => { release = resolve; });
        yield 'Completed answer';
      })(),
      getResult: () => ({ reply: 'Completed answer', sources: [] }),
    });
    const pending = streamMessage(req as never, res as never);
    await vi.advanceTimersByTimeAsync(30_000);
    const heartbeatCount = res.write.mock.calls.filter(call => String(call[0]).startsWith(': heartbeat')).length;
    release();
    await pending;
    expect(heartbeatCount).toBeGreaterThanOrEqual(2);
    expect(res.write.mock.calls.map(call => call[0]).join('')).toContain('event: done');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('propagates a native HTTP client disconnect to active stream work', async () => {
    environment.DR_AI_REQUEST_TIMEOUT_MS = 2_000;
    let requestSignal: AbortSignal | undefined;
    mocks.streamDrAi.mockImplementation(async (_message, _history, options) => {
      requestSignal = options.signal;
      return {
        sources: [],
        chunks: (async function* () {
          await new Promise((_resolve, reject) => requestSignal!.addEventListener('abort', () => reject(requestSignal!.reason), { once: true }));
          yield 'Must not be written';
        })(),
        getResult: vi.fn(),
      };
    });
    const app = express();
    app.use(express.json());
    app.post('/stream', streamMessage);
    const server = createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Loopback server did not start.');
    const controller = new AbortController();
    try {
      const result = await fetch(`http://127.0.0.1:${address.port}/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Lagundi' }), signal: controller.signal,
      });
      expect(result.headers.get('content-type')).toContain('text/event-stream');
      const reader = result.body!.getReader();
      const first = await reader.read();
      expect(new TextDecoder().decode(first.value)).toContain('event: sources');
      controller.abort();
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
      await vi.waitFor(() => expect(requestSignal?.aborted).toBe(true), { interval: 5 });
      expect(requestSignal?.reason.name).toBe('AbortError');
    } finally {
      controller.abort();
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
