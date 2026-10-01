import { getEventListeners } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { awaitAiOperation, createAiDeadline, iterateAiOperation } from '../src/services/ai/core/request-lifetime.js';

afterEach(() => vi.useRealTimers());

describe('AI request ownership', () => {
  it('does not invoke work after pre-cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    const operation = vi.fn();
    await expect(awaitAiOperation(operation, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(operation).not.toHaveBeenCalled();
  });

  it('stops a non-cooperative wait and observes a later rejection', async () => {
    const controller = new AbortController();
    let rejectLater!: (reason: unknown) => void;
    const outcome = awaitAiOperation(() => new Promise((_resolve, reject) => { rejectLater = reject; }), controller.signal).catch(error => error);
    await Promise.resolve();
    controller.abort();
    expect((await outcome).name).toBe('AbortError');
    expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
    rejectLater(new Error('Late transport rejection'));
    await Promise.resolve();
  });

  it('uses one budget across consecutive stages, then cleans up its timer and parent listener', async () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const deadline = createAiDeadline(90, parent.signal);
    await vi.advanceTimersByTimeAsync(60);
    expect(await awaitAiOperation(() => 'Retrieved', deadline.signal)).toBe('Retrieved');
    const result = awaitAiOperation(() => new Promise(() => undefined), deadline.signal).catch(error => error);
    await vi.advanceTimersByTimeAsync(30);
    expect((await result).name).toBe('TimeoutError');
    deadline.dispose();
    expect(getEventListeners(parent.signal, 'abort')).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('allocates no timer for an already canceled parent', () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    parent.abort();
    const deadline = createAiDeadline(90, parent.signal);
    expect(deadline.signal.reason).toBe(parent.signal.reason);
    deadline.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('requests iterator cleanup without waiting for a stalled return', async () => {
    const controller = new AbortController();
    const cleanup = vi.fn(() => new Promise<IteratorResult<string>>(() => undefined));
    const source = { [Symbol.asyncIterator]: () => ({ next: () => new Promise<IteratorResult<string>>(() => undefined), return: cleanup }) };
    const iterator = iterateAiOperation(source, controller.signal);
    const outcome = iterator.next().catch(error => error);
    await Promise.resolve();
    controller.abort();
    expect((await outcome).name).toBe('AbortError');
    await Promise.resolve();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('preserves normal iteration and disposes completed request resources', async () => {
    vi.useFakeTimers();
    const parent = new AbortController();
    const deadline = createAiDeadline(90, parent.signal);
    const source = (async function* () { yield 'First'; yield 'Second'; })();
    const chunks = [];
    for await (const chunk of iterateAiOperation(source, deadline.signal)) chunks.push(chunk);
    deadline.dispose();
    expect(chunks).toEqual(['First', 'Second']);
    expect(parent.signal.aborted).toBe(false);
    expect(getEventListeners(parent.signal, 'abort')).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
