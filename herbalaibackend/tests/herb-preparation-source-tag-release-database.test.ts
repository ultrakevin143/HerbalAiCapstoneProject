import { randomUUID } from 'node:crypto';
import { mkdtemp, rmdir, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  applySourceTagRelease, prepareSourceTagRelease, readSourceTagSnapshots, writeSourceTagBackup,
} from '../src/content/herb-preparation-source-tag-release.js';
import type { SourceTagClient, SourceTagReleasePlan, SourceTagApproval } from '../src/content/herb-preparation-source-tag-release.js';
import { preparationDigest, validatePreparationConnectionUrl } from '../src/content/herb-preparation-update.js';
import { fixtureTimestamp, initializeSourceTagFixture, resetSourceTagFixture, sourceTagIds, sourceTagReview } from './helpers/source-tag-fixture.js';

const connectionUrl = process.env['DATABASE_URL'] ?? '';
const connection = validatePreparationConnectionUrl(connectionUrl);
if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname) || connection.pathname !== '/herbalai_test') {
  throw new Error('Source-tag concurrency tests require isolated loopback herbalai_test, never a provider database.');
}
const pool = new pg.Pool({ connectionString: connectionUrl, max: 4, connectionTimeoutMillis: 2000, statement_timeout: 10_000 });
const schema = `source_tags_${randomUUID().replaceAll('-', '')}`;
const target = { host: connection.hostname, database: 'herbalai_test', port: Number(connection.port || 5432) };
const projectRoot = path.resolve(import.meta.dirname, '..', '..');
const backups: string[] = [];
let directory: string;
let writer: pg.PoolClient;
let editor: pg.PoolClient;
let observer: pg.PoolClient;
let client: SourceTagClient;
let plan: SourceTagReleasePlan;
let approval: SourceTagApproval;
let writerPid: number;
let editorPid: number;

const adapter = (raw: pg.PoolClient): SourceTagClient => {
  const parameters = (raw as unknown as { connectionParameters: SourceTagClient['connectionParameters'] }).connectionParameters;
  return { connectionParameters: { host: parameters.host, database: parameters.database, port: parameters.port },
    query: async (sql, values) => { const result = await raw.query(sql, values); return { rows: result.rows, rowCount: result.rowCount }; } };
};
const waitForLock = async (pid: number) => {
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    const result = await observer.query('SELECT "wait_event_type" FROM pg_stat_activity WHERE pid = $1', [pid]);
    if (result.rows[0]?.wait_event_type === 'Lock') return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('Expected real independent-session lock wait was not observed.');
};

beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'herbalai-source-tag-pg-'));
  writer = await pool.connect();
  editor = await pool.connect();
  observer = await pool.connect();
  await writer.query(`CREATE SCHEMA "${schema}"`);
  for (const session of [writer, editor]) await session.query(`SET search_path TO "${schema}", public`);
  client = adapter(writer);
  writerPid = (await writer.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  editorPid = (await editor.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
  await initializeSourceTagFixture(client, true);
}, 30_000);

beforeEach(async () => {
  await resetSourceTagFixture(client, true);
  plan = await prepareSourceTagRelease(client, sourceTagReview, target, fixtureTimestamp);
  const backupFile = path.join(directory, `backup-${backups.length}.json`);
  backups.push(backupFile);
  await writeSourceTagBackup(projectRoot, backupFile, plan);
  approval = { connectionUrl, independentlyConfirmedTarget: target, projectRoot, backupFile,
    reviewedPlanSha256: preparationDigest(plan), reviewerId: 'qa-admin', now: fixtureTimestamp };
});

afterAll(async () => {
  if (editor) { await editor.query('ROLLBACK'); editor.release(); }
  if (observer) observer.release();
  if (writer) {
    await writer.query('ROLLBACK');
    await writer.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    writer.release();
  }
  await pool.end();
  for (const filename of backups) await unlink(filename);
  if (directory) await rmdir(directory);
});

describe('native PostgreSQL source-tag transaction gates', () => {
  it('preserves real vector(768) values while committing only source tags', async () => {
    const result = await applySourceTagRelease(client, plan, approval);
    expect(result.sourceCount).toBe(3);
    const actual = await readSourceTagSnapshots(client, sourceTagIds) as SourceTagReleasePlan['snapshots'];
    const expected = structuredClone(plan.snapshots);
    for (const herb of expected) for (const source of herb.sources) if ([19, 20, 21].includes(source.id)) source.supports.push('preparationMethod');
    expect(actual).toEqual(expected);
  });

  it('rejects a concurrent source edit committed while waiting for its real row lock', async () => {
    await editor.query('BEGIN');
    await editor.query('UPDATE "HerbSource" SET citation = $1 WHERE id = 21', ['TEST ONLY independent-session edit']);
    const outcome = applySourceTagRelease(client, plan, approval).then(result => ({ result }), error => ({ error }));
    try {
      await waitForLock(writerPid);
    } finally { await editor.query('COMMIT'); }
    const result = await outcome;
    expect('error' in result ? String(result.error) : '').toMatch(/serialize|baseline changed/i);
    expect((await writer.query('SELECT count(*)::int AS total FROM "AuditLog"')).rows[0].total).toBe(0);
    expect((await writer.query('SELECT supports FROM "HerbSource" WHERE id = 21')).rows[0].supports).not.toContain('preparationMethod');
  });

  it('holds reviewer eligibility stable against a concurrent ban until the release finishes', async () => {
    let continueRelease!: () => void;
    let reachedAudit!: () => void;
    const paused = new Promise<void>(resolve => { reachedAudit = resolve; });
    const resume = new Promise<void>(resolve => { continueRelease = resolve; });
    let waiting = false;
    const guarded: SourceTagClient = { connectionParameters: client.connectionParameters, query: async (sql, values) => {
      if (!waiting && sql.startsWith('INSERT INTO "AuditLog"')) { waiting = true; reachedAudit(); await resume; }
      return client.query(sql, values);
    } };
    const outcome = applySourceTagRelease(guarded, plan, approval).then(result => ({ result }), error => ({ error }));
    const ready = await Promise.race([paused.then(() => 'paused'), outcome.then(() => 'finished')]);
    expect(ready).toBe('paused');
    const ban = editor.query('UPDATE "User" SET "isBanned" = true WHERE id = $1', ['qa-admin']);
    try { await waitForLock(editorPid); } finally { continueRelease(); }
    expect(await outcome).toHaveProperty('result.status', 'SOURCE_TAGS_COMMITTED');
    await ban;
    expect((await writer.query('SELECT "isBanned" FROM "User" WHERE id = $1', ['qa-admin'])).rows[0].isBanned).toBe(true);
  });
});
