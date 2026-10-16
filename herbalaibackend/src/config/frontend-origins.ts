export const parseAdditionalFrontendOrigins = (value: string | undefined): string[] => {
  if (!value?.trim()) return [];
  const entries = value.split(',').map(origin => origin.trim());
  if (entries.length > 8) throw new Error('FRONTEND_ADDITIONAL_ORIGINS permits at most eight exact HTTPS origins.');
  const origins = entries.map(entry => {
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw new Error('FRONTEND_ADDITIONAL_ORIGINS requires exact HTTPS origins.');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/'
      || url.search || url.hash || url.hostname.includes('*') || url.origin === 'null'
      || ![url.origin, url.origin + '/'].includes(entry)) {
      throw new Error('FRONTEND_ADDITIONAL_ORIGINS requires exact HTTPS origins without credentials, paths or wildcards.');
    }
    return url.origin;
  });
  return [...new Set(origins)];
};

export const trustedFrontendOrigins = (frontendUrl: string, additional: readonly string[] = []): Set<string> =>
  new Set([new URL(frontendUrl).origin, ...additional]);

export const trustedRequestOrigins = (frontendUrl: string, additional: readonly string[] = []): Set<string> =>
  new Set([
    ...trustedFrontendOrigins(frontendUrl, additional),
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ]);
