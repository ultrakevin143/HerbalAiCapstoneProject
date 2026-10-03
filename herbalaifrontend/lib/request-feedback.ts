function nonblankMessage(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function responseMessage(response: unknown, fallback: string): string {
  const data = (response as { data?: { message?: unknown } } | null)?.data;
  return nonblankMessage(data?.message) ?? fallback;
}

export function requestError(caught: unknown, fallback: string): string {
  const data = (caught as { response?: { data?: { message?: unknown; errors?: unknown } } } | null)?.response?.data;
  const firstError = Array.isArray(data?.errors) ? data.errors[0] as { message?: unknown } | null : null;
  return nonblankMessage(firstError?.message) ?? nonblankMessage(data?.message) ?? fallback;
}
