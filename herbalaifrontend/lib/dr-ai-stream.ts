import api from './axios';

export interface DrAiStreamSource {
  type: 'herb' | 'kb';
  title: string;
  distance?: number;
}

export interface DrAiStreamTurn {
  role: 'user' | 'model';
  parts: { text: string }[];
}

type StreamEvent =
  | { event: 'sources'; data: { sources: DrAiStreamSource[] } }
  | { event: 'chunk'; data: { text: string } }
  | { event: 'done'; data: { history: DrAiStreamTurn[]; sources: DrAiStreamSource[]; metrics?: unknown } };

const API_URL = '/api';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const validSources = (value: unknown): value is DrAiStreamSource[] => Array.isArray(value) && value.every(source =>
  isRecord(source) && (source.type === 'herb' || source.type === 'kb') && typeof source.title === 'string' &&
  (source.distance === undefined || (typeof source.distance === 'number' && Number.isFinite(source.distance)))
);
const validHistory = (value: unknown): value is DrAiStreamTurn[] => Array.isArray(value) && value.every(turn =>
  isRecord(turn) && (turn.role === 'user' || turn.role === 'model') && Array.isArray(turn.parts) &&
  turn.parts.every(part => isRecord(part) && typeof part.text === 'string')
);

export const streamDrAiResponse = async (
  message: string,
  history: DrAiStreamTurn[],
  onEvent: (event: StreamEvent) => void,
  options: { signal?: AbortSignal } = {}
): Promise<void> => {
  options.signal?.throwIfAborted();
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', forwardAbort, { once: true });
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const armTimeout = (delay: number) => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => controller.abort(new DOMException('Dr. Ai response timed out.', 'TimeoutError')), delay);
  };
  const totalTimer = setTimeout(() => controller.abort(new DOMException('Dr. Ai response exceeded its time limit.', 'TimeoutError')), 120_000);
  const cancelReader = () => { void reader?.cancel(controller.signal.reason).catch(() => {}); };
  controller.signal.addEventListener('abort', cancelReader, { once: true });

  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      controller.signal.throwIfAborted();
      armTimeout(30_000);
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      });
      controller.signal.throwIfAborted();

      if (response.status === 401 && attempt === 0) {
        void response.body?.cancel().catch(() => {});
        armTimeout(10_000);
        await api.post('/auth/refresh-token', undefined, { timeout: 10_000, signal: controller.signal });
        continue;
      }
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        controller.signal.throwIfAborted();
        throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : `Dr. Ai request failed with HTTP ${response.status}.`);
      }
      if (!response.body) throw new Error('Dr. Ai returned an empty response stream.');

      reader = response.body.getReader();
      armTimeout(90_000);
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;
      let hasAnswer = false;

      const consumeBlock = (block: string) => {
        const event = block.split('\n').find(line => line.startsWith('event:'))?.slice(6).trim();
        if (!event || !['sources', 'chunk', 'done', 'error'].includes(event)) return;
        const dataText = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!dataText) throw new Error('Dr. Ai returned an invalid stream event.');
        const data: unknown = JSON.parse(dataText);
        if (!isRecord(data)) throw new Error('Dr. Ai returned an invalid stream event.');
        if (event === 'error') throw new Error(typeof data.message === 'string' ? data.message : 'Dr. Ai streaming failed.');
        if (event === 'sources' && validSources(data.sources)) {
          onEvent({ event, data: { sources: data.sources } });
          return;
        }
        if (event === 'chunk' && typeof data.text === 'string') {
          hasAnswer ||= data.text.trim().length > 0;
          onEvent({ event, data: { text: data.text } });
          return;
        }
        if (event === 'done' && hasAnswer && validSources(data.sources) && validHistory(data.history)) {
          onEvent({ event, data: { sources: data.sources, history: data.history, metrics: data.metrics } });
          completed = true;
          return;
        }
        throw new Error('Dr. Ai returned an invalid stream event.');
      };

      while (!completed) {
        const { done, value } = await reader.read();
        controller.signal.throwIfAborted();
        if (value?.length) armTimeout(30_000);
        buffer = `${buffer}${decoder.decode(value, { stream: !done })}`.replaceAll('\r\n', '\n');
        if (buffer.length > 1_048_576) throw new Error('Dr. Ai returned an oversized stream event.');
        let boundary = buffer.indexOf('\n\n');
        while (boundary >= 0 && !completed) {
          consumeBlock(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');
        }
        if (done) {
          if (!completed && buffer.trim()) consumeBlock(buffer.trim());
          break;
        }
      }
      if (!completed) throw new Error('Dr. Ai response ended before completion.');
      return;
    }
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(idleTimer);
    clearTimeout(totalTimer);
    options.signal?.removeEventListener('abort', forwardAbort);
    controller.signal.removeEventListener('abort', cancelReader);
    if (reader) {
      void reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    controller.abort();
  }
};
