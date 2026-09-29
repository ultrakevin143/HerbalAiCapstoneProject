import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ uploadStream: vi.fn(), end: vi.fn(), on: vi.fn(), config: vi.fn() }));
vi.mock('cloudinary', () => ({
  v2: { config: mocks.config, uploader: { upload_stream: mocks.uploadStream } },
}));
vi.mock('../src/config/env.js', () => ({
  ENV: { CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'test' },
}));

import { MediaUploadError, uploadToCloudinary } from '../src/services/cloudinary.service.js';

describe('Cloudinary image uploads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uploadStream.mockReturnValue({ end: mocks.end, on: mocks.on });
  });

  it('returns the secure URL when the provider succeeds', async () => {
    mocks.uploadStream.mockImplementation((_options, callback) => {
      callback(null, { secure_url: 'https://example.invalid/image.png' });
      return { end: mocks.end, on: mocks.on };
    });

    await expect(uploadToCloudinary(Buffer.from('image'))).resolves.toBe('https://example.invalid/image.png');
    expect(mocks.end).toHaveBeenCalledWith(Buffer.from('image'));
  });

  it('converts provider failures to a safe media error', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mocks.uploadStream.mockImplementation((_options, callback) => {
        callback(new Error('Invalid Signature: provider detail'), undefined);
        return { end: mocks.end, on: mocks.on };
      });

      await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
      expect(log).toHaveBeenCalledOnce();
      expect(log).toHaveBeenCalledWith('Cloudinary upload failed');
    } finally {
      log.mockRestore();
    }
  });

  it('treats a missing provider result as unavailable', async () => {
    mocks.uploadStream.mockImplementation((_options, callback) => {
      callback(null, undefined);
      return { end: mocks.end, on: mocks.on };
    });

    await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
  });

  it('rejects a provider result without a secure URL', async () => {
    mocks.uploadStream.mockImplementation((_options, callback) => {
      callback(null, {});
      return { end: mocks.end, on: mocks.on };
    });

    await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
  });

  it('converts synchronous provider errors to a safe media error', async () => {
    mocks.uploadStream.mockImplementation(() => { throw new Error('private provider detail'); });

    await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
  });

  it('converts stream errors to a safe media error', async () => {
    mocks.on.mockImplementation((_event, callback) => { callback(new Error('private stream detail')); });

    await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
  });
});
