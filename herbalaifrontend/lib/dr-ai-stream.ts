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

export const streamDrAiResponse = async (
  message: string,
  history: DrAiStreamTurn[],
  onEvent: (event: StreamEvent) => void,
  retried = false
): Promise<void> => {
  const response = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ message, history }),
  });

  if (response.status === 401 && !retried) {
    await api.post('/auth/refresh-token');
    return streamDrAiResponse(message, history, onEvent, true);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Dr. Ai request failed with HTTP ${response.status}.`);
  }
  if (!response.body) throw new Error('Dr. Ai returned an empty response stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const consumeBlock = (block: string) => {
    const event = block.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim();
    const dataText = block.split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (!event || !dataText) return;
    const data = JSON.parse(dataText);
    if (event === 'error') throw new Error(data.message || 'Dr. Ai streaming failed.');
    if (event === 'sources' || event === 'chunk' || event === 'done') {
      onEvent({ event, data } as StreamEvent);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer = `${buffer}${decoder.decode(value, { stream: !done })}`.replaceAll('\r\n', '\n');
    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      consumeBlock(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');
    }
    if (done) break;
  }
  if (buffer.trim()) consumeBlock(buffer.trim());
};
