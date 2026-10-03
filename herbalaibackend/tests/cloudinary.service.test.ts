import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ uploadStream: vi.fn(), end: vi.fn(), on: vi.fn(), destroy: vi.fn(), config: vi.fn() }));
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
    mocks.uploadStream.mockReset();
    mocks.on.mockReset();
    mocks.uploadStream.mockReturnValue({ end: mocks.end, on: mocks.on, destroy: mocks.destroy });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('bounds a stalled provider callback and releases the upload stream', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const outcome = uploadToCloudinary(Buffer.from('image')).then(
      () => 'unexpected success', error => error,
    );
    await vi.advanceTimersByTimeAsync(20_000);
    const completed = await Promise.race([outcome, Promise.resolve('still pending')]);
    expect(completed).toBeInstanceOf(MediaUploadError);
    expect(mocks.uploadStream.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ timeout: 20_000 }));
    expect(mocks.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores duplicate error callbacks after a failed upload', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.uploadStream.mockImplementation((_options, callback) => {
      callback(new Error('private provider detail'));
      callback(new Error('duplicate private provider detail'));
      return { end: mocks.end, on: mocks.on, destroy: mocks.destroy };
    });
    await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
    expect(log).toHaveBeenCalledOnce();
  });

  it('clears its deadline after a successful asynchronous callback', async () => {
    vi.useFakeTimers();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const pending = uploadToCloudinary(Buffer.from('image'));
    const callback = mocks.uploadStream.mock.calls[0]?.[1];
    expect(typeof callback).toBe('function');
    await vi.advanceTimersByTimeAsync(19_999);
    callback(null, { secure_url: 'https://example.invalid/image.png' });
    await expect(pending).resolves.toBe('https://example.invalid/image.png');
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(mocks.destroy).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('keeps the timeout outcome when the provider completes late', async () => {
    vi.useFakeTimers();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const outcome = uploadToCloudinary(Buffer.from('image')).catch(error => error);
    const callback = mocks.uploadStream.mock.calls[0]?.[1];
    await vi.advanceTimersByTimeAsync(20_000);
    expect(await outcome).toBeInstanceOf(MediaUploadError);
    callback(null, { secure_url: 'https://example.invalid/late.png' });
    callback(new Error('late private provider detail'));
    expect(await outcome).toBeInstanceOf(MediaUploadError);
    expect(log).toHaveBeenCalledOnce();
    expect(mocks.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up once when stream and provider callbacks both fail', async () => {
    vi.useFakeTimers();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const outcome = uploadToCloudinary(Buffer.from('image')).catch(error => error);
    const streamError = mocks.on.mock.calls.find(([event]) => event === 'error')?.[1];
    const callback = mocks.uploadStream.mock.calls[0]?.[1];
    streamError(new Error('private stream detail'));
    callback(new Error('duplicate private provider detail'));
    expect(await outcome).toBeInstanceOf(MediaUploadError);
    expect(log).toHaveBeenCalledOnce();
    expect(mocks.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the deadline if writing the file buffer throws', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.end.mockImplementationOnce(() => { throw new Error('private write detail'); });
    await expect(uploadToCloudinary(Buffer.from('image'))).rejects.toBeInstanceOf(MediaUploadError);
    expect(mocks.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
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
