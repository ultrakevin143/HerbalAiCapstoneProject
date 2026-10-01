import { afterEach, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';

vi.mock('../src/config/env.js', () => ({ ENV: {
  GEMINI_API_KEY: 'test-key-no-network',
  DR_AI_CHAT_MODELS: ['first-model', 'second-model', 'third-model'],
  DR_AI_MODEL_TIMEOUT_MS: 30,
  DR_AI_EMBEDDING_TIMEOUT_MS: 30,
  DR_AI_MAX_MODEL_ATTEMPTS: 2,
  DR_AI_MODEL_COOLDOWN_MS: 60_000,
} }));
import { generateEmbedding, generateChatResponse, generateChatResponseStream, resetGeminiFallbackState } from '../src/services/ai/core/gemini-service.js';

const content = (text: string) => ({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }] });
const json = (text: string) => new Response(JSON.stringify(content(text)), { headers: { 'Content-Type': 'application/json' } });
const unavailable = () => new Response(JSON.stringify({ error: { message: 'model unavailable' } }), { status: 503 });
const invalidRequest = () => new Response(JSON.stringify({ error: { message: 'invalid request' } }), { status: 400 });
afterEach(() => {
  resetGeminiFallbackState();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('Gemini transport fallback (no live provider calls)', () => {
  it('does not start an embedding for an already canceled caller', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ embedding: { values: [0.1] } })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateEmbedding('Question', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bounds stalled embedding transport and clears its deadline', async () => {
    vi.useFakeTimers();
    let aborted = false;
    let release: (() => void) | undefined;
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: unknown, init: RequestInit) => new Promise((resolve, reject) => {
      release = () => resolve(new Response(JSON.stringify({ embedding: { values: [0.1] } })));
      init.signal?.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    })));
    const outcome = generateEmbedding('Question').then(value => ({ value }), error => ({ error }));
    await vi.advanceTimersByTimeAsync(30);
    release?.();
    const result = await outcome;
    expect(aborted).toBe(true);
    expect(result).toHaveProperty('error');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('closes native embedding transport when a response body stalls', async () => {
    const nativeFetch = fetch;
    let requestArrived!: () => void;
    const incoming = new Promise<void>(resolve => { requestArrived = resolve; });
    let responseClosed = false;
    const server = createServer((_request, response) => {
      response.once('close', () => { responseClosed = true; });
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.write('{"embedding":');
      requestArrived();
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Loopback server did not start.');
    vi.useFakeTimers();
    vi.stubGlobal('fetch', (_url: unknown, init: RequestInit) => nativeFetch(`http://127.0.0.1:${address.port}/embedding`, init));
    try {
      const outcome = generateEmbedding('Fixture question').catch(error => error);
      await incoming;
      await vi.advanceTimersByTimeAsync(30);
      expect((await outcome).name).toBe('TimeoutError');
      vi.useRealTimers();
      await vi.waitFor(() => expect(responseClosed).toBe(true), { interval: 5 });
    } finally {
      vi.useRealTimers();
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it('does not start a stream for an already canceled caller', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockResolvedValue(new Response(`data: ${JSON.stringify(content('Answer'))}\n\n`));
    vi.stubGlobal('fetch', fetchMock);
    const iterator = generateChatResponseStream('Question', 'Context', [], { signal: controller.signal });
    await expect(iterator.next()).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts active generation without trying another model on caller cancellation', async () => {
    const controller = new AbortController();
    let aborted = false;
    const fetchMock = vi.fn().mockImplementation((_url: unknown, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    }));
    vi.stubGlobal('fetch', fetchMock);
    const outcome = generateChatResponse('Question', 'Context', [], { signal: controller.signal }).catch(error => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce(), { interval: 1 });
    controller.abort();
    const error = await outcome;
    expect(error.name).toBe('AbortError');
    expect(aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it('falls back from a failed model and retains the grounding prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(unavailable()).mockResolvedValueOnce(json('Grounded answer'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await generateChatResponse('Explain', 'Database text')).toBe('Grounded answer');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('first-model');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('second-model');
    expect(fetchMock.mock.calls[1]?.[1].body).toContain('Database text');
    expect(fetchMock.mock.calls[1]?.[1].body).toContain('Answer an English question in English');
    expect(fetchMock.mock.calls[1]?.[1].body).toContain('Do not include child-age table quantities in a general answer');
  });

  it('clears a successful model deadline rather than retaining SDK timeout timers', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json('Answer')));
    expect(await generateChatResponse('Question', 'Context')).toBe('Answer');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborts a partial SDK stream without model fallback or emitted partial text', async () => {
    const controller = new AbortController();
    let transportSignal: AbortSignal | undefined;
    const fetchMock = vi.fn().mockImplementation((_url: unknown, init: RequestInit) => {
      transportSignal = init.signal ?? undefined;
      return Promise.resolve(new Response(new ReadableStream({
        start(stream) {
          stream.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(content('Partial'))}\n\n`));
          transportSignal?.addEventListener('abort', () => stream.error(new DOMException('Aborted', 'AbortError')), { once: true });
        },
      }), { headers: { 'Content-Type': 'text/event-stream' } }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const iterator = generateChatResponseStream('Question', 'Context', [], { signal: controller.signal });
    const outcome = iterator.next().catch(error => error);
    await vi.waitFor(() => expect(transportSignal).toBeDefined(), { interval: 1 });
    controller.abort();
    expect((await outcome).name).toBe('AbortError');
    expect(transportSignal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it('aborts an unresponsive request before falling back', async () => {
    let aborted = false;
    const fetchMock = vi.fn().mockImplementationOnce((_url: unknown, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
    })).mockResolvedValueOnce(json('Recovered'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await generateChatResponse('Question', 'Context')).toBe('Recovered');
    expect(aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('reports exhaustion after the configured attempts', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(unavailable()));
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateChatResponse('Question', 'Context')).rejects.toThrow('All Gemini models');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('does not retry permanent request errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(invalidRequest());
    vi.stubGlobal('fetch', fetchMock);
    await expect(generateChatResponse('Question', 'Context')).rejects.toThrow('invalid request');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('temporarily skips a model after a transient failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(unavailable())
      .mockResolvedValueOnce(json('Recovered'))
      .mockResolvedValueOnce(json('Still healthy'));
    vi.stubGlobal('fetch', fetchMock);

    expect(await generateChatResponse('First question', 'Context')).toBe('Recovered');
    expect(await generateChatResponse('Second question', 'Context')).toBe('Still healthy');

    expect(String(fetchMock.mock.calls[2]?.[0])).toContain('second-model');
  });
  it('falls back before any streamed model text is emitted', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(unavailable()).mockResolvedValueOnce(new Response(`data: ${JSON.stringify(content('Stream answer'))}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of generateChatResponseStream('Question', 'Context')) chunks.push(chunk);
    expect(chunks.join('')).toBe('Stream answer');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('discards a stalled partial stream before falling back', async () => {
    const fetchMock = vi.fn().mockImplementationOnce((_url: unknown, init: RequestInit) => Promise.resolve(new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(content('Partial answer'))}\n\n`));
        init.signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
      },
    }), { headers: { 'Content-Type': 'text/event-stream' } })))
      .mockResolvedValueOnce(new Response(`data: ${JSON.stringify(content('Complete fallback answer'))}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of generateChatResponseStream('Question', 'Context')) chunks.push(chunk);
    expect(chunks).toEqual(['Complete fallback answer']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
