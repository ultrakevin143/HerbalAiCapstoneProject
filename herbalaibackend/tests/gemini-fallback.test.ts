import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/env.js', () => ({ ENV: {
  GEMINI_API_KEY: 'test-key-no-network',
  DR_AI_CHAT_MODELS: ['first-model', 'second-model'],
  DR_AI_MODEL_TIMEOUT_MS: 30,
} }));
import { generateChatResponse, generateChatResponseStream } from '../src/services/ai/core/gemini-service.js';

const content = (text: string) => ({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }] });
const json = (text: string) => new Response(JSON.stringify(content(text)), { headers: { 'Content-Type': 'application/json' } });
const unavailable = () => new Response(JSON.stringify({ error: { message: 'model unavailable' } }), { status: 503 });
afterEach(() => vi.unstubAllGlobals());

describe('Gemini transport fallback (no live provider calls)', () => {
  it('falls back from a failed model and retains the grounding prompt', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(unavailable()).mockResolvedValueOnce(json('Grounded answer'));
    vi.stubGlobal('fetch', fetchMock);
    expect(await generateChatResponse('Explain', 'Database text')).toBe('Grounded answer');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('first-model');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('second-model');
    expect(fetchMock.mock.calls[1]?.[1].body).toContain('Database text');
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
  it('falls back before any streamed model text is emitted', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(unavailable()).mockResolvedValueOnce(new Response(`data: ${JSON.stringify(content('Stream answer'))}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of generateChatResponseStream('Question', 'Context')) chunks.push(chunk);
    expect(chunks.join('')).toBe('Stream answer');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('aborts a stalled partial stream without appending another model answer', async () => {
    const fetchMock = vi.fn().mockImplementation((_url: unknown, init: RequestInit) => Promise.resolve(new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(content('Partial answer'))}\n\n`));
        init.signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
      },
    }), { headers: { 'Content-Type': 'text/event-stream' } })));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    const consume = async () => {
      for await (const chunk of generateChatResponseStream('Question', 'Context')) chunks.push(chunk);
    };
    await expect(consume()).rejects.toThrow();
    expect(chunks).toEqual(['Partial answer']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
