export type MessageCursor = { time: Date; id?: number };

export const parseMessageCursor = (value: unknown): MessageCursor | null => {
  if (typeof value !== 'string' || value.length > 64) return null;
  const parts = value.split('|');
  if (parts.length > 2) return null;
  const timestamp = parts[0];
  if (!timestamp || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)) return null;
  const time = new Date(timestamp);
  if (Number.isNaN(time.getTime()) || time.toISOString() !== timestamp) return null;
  if (parts.length === 1) return { time };
  const rawId = parts[1];
  if (!rawId || !/^[1-9]\d*$/.test(rawId)) return null;
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id <= 2147483647 ? { time, id } : null;
};
