import { describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { normalizeDatabaseUrl } from '../src/config/database-url.js';
import { listen } from '../src/lib/listen.js';

describe('database TLS compatibility', () => {
  it.each(['prefer', 'require', 'verify-ca'])('pins the existing strict behavior of %s', (mode) => {
    const url = new URL(normalizeDatabaseUrl(`postgresql://reader:p%40ss@example.invalid/db?sslmode=${mode}&channel_binding=require`)!);
    expect(url.searchParams.get('sslmode')).toBe('verify-full');
    expect(url.searchParams.get('channel_binding')).toBe('require');
    expect(url.password).toBe('p%40ss');
  });
  it.each(['disable', 'verify-full'])('preserves explicit %s mode', (mode) => {
    const url = `postgresql://localhost/db?sslmode=${mode}`;
    expect(normalizeDatabaseUrl(url)).toBe(url);
  });
  it('preserves explicit libpq compatibility and absent configuration', () => {
    const url = 'postgresql://localhost/db?uselibpqcompat=true&sslmode=require';
    expect(normalizeDatabaseUrl(url)).toBe(url);
    expect(normalizeDatabaseUrl(undefined)).toBeUndefined();
    expect(normalizeDatabaseUrl('postgresql://localhost/db')).toBe('postgresql://localhost/db');
  });
});

it('rejects occupied ports through the startup promise without leaking error listeners', async () => {
  const occupied = createServer();
  const contender = createServer();
  const initialListeningListeners = contender.listenerCount('listening');
  await listen(occupied, 0);
  const address = occupied.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
  try {
    await expect(listen(contender, address.port)).rejects.toMatchObject({ code: 'EADDRINUSE' });
    expect(contender.listenerCount('listening')).toBe(initialListeningListeners);
    expect(contender.listenerCount('error')).toBe(0);
    expect(contender.listening).toBe(false);
  } finally {
    await new Promise<void>(resolve => occupied.close(() => resolve()));
  }
});

it('exits the actual backend cleanly when its port is occupied', async () => {
  const occupied = createServer();
  await listen(occupied, 0);
  const address = occupied.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP address');
  try {
    const result = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
        cwd: fileURLToPath(new URL('../', import.meta.url)),
        env: { ...process.env, NODE_ENV: 'test', PORT: String(address.port), DB_POOL_MIN: '0', DB_POOL_METRICS_INTERVAL_MS: '0', DATABASE_URL: 'postgresql://fixture:fixture@127.0.0.1:1/unused?sslmode=disable' },
        windowsHide: true,
      });
      let output = '';
      child.stdout.on('data', chunk => { output += chunk.toString(); });
      child.stderr.on('data', chunk => { output += chunk.toString(); });
      const timer = setTimeout(() => { child.kill(); reject(new Error(`Failed backend did not exit: ${output}`)); }, 30_000);
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('close', code => { clearTimeout(timer); resolve({ code, output }); });
    });
    expect(result.code).toBe(1);
    expect(result.output).toContain(`Port ${address.port} is already in use`);
    expect(result.output).not.toContain('UNCAUGHT EXCEPTION');
    expect(result.output).not.toContain('database_pool_metrics');
  } finally {
    await new Promise<void>(resolve => occupied.close(() => resolve()));
  }
}, 40_000);
