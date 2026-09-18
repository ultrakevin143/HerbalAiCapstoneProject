export function normalizeDatabaseUrl(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString;
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  const mode = url.searchParams.get('sslmode');
  if (url.searchParams.get('uselibpqcompat') !== 'true' && mode && ['prefer', 'require', 'verify-ca'].includes(mode)) {
    url.searchParams.set('sslmode', 'verify-full');
    return url.toString();
  }
  return connectionString;
}
