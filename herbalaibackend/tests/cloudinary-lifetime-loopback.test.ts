import { createServer } from 'node:http';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/config/env.js', () => ({
  ENV: { CLOUDINARY_CLOUD_NAME: 'qa-only', CLOUDINARY_API_KEY: 'qa-only', CLOUDINARY_API_SECRET: 'qa-only' },
}));

describe('Actual Cloudinary SDK upload lifetime on loopback', () => {
  it('returns a safe timeout and closes a stalled native HTTP upload', async () => {
    let requestReceived = false;
    let connectionClosed = false;
    let uploadedBytes = 0;
    const server = createServer((incoming, outgoing) => {
      requestReceived = true;
      incoming.on('data', chunk => { uploadedBytes += chunk.length; });
      outgoing.on('close', () => { connectionClosed = true; });
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Loopback listener unavailable');
    const previousUrl = process.env['CLOUDINARY_URL'];
    const prefix = `http://127.0.0.1:${address.port}`;
    process.env['CLOUDINARY_URL'] = `cloudinary://qa-only:qa-only@qa-only?upload_prefix=${encodeURIComponent(prefix)}`;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { uploadToCloudinary, MediaUploadError } = await import('../src/services/cloudinary.service.js');
      const started = Date.now();
      await expect(uploadToCloudinary(Buffer.from('TEST ONLY native SDK timeout fixture')))
        .rejects.toBeInstanceOf(MediaUploadError);
      expect(Date.now() - started).toBeGreaterThanOrEqual(19_000);
      expect(requestReceived).toBe(true);
      expect(uploadedBytes).toBeGreaterThan(0);
      await vi.waitFor(() => expect(connectionClosed).toBe(true), { timeout: 4_000 });
      expect(log).toHaveBeenCalledOnce();
    } finally {
      log.mockRestore();
      if (previousUrl === undefined) delete process.env['CLOUDINARY_URL'];
      else process.env['CLOUDINARY_URL'] = previousUrl;
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }, 35_000);
});
