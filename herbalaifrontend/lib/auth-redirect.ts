export function safeAuthCallback(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048 || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || Array.from(decoded).some((character) => character === '\\' || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null;
    const base = 'https://callback.invalid';
    const destination = new URL(value, base);
    if (destination.origin !== base || /^\/(?:signin|signup|auth|api)(?:\/|$)/i.test(decodeURIComponent(destination.pathname))) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}
