import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { adminEditDatabaseBoundary } from './helpers/admin-edit-database-boundary.js';
import { knowledgeImportServerBoundary } from './helpers/knowledge-import-server-boundary.js';

const state = vi.hoisted(() => ({ client: null as PrismaClient | null }));
vi.mock('../src/lib/prisma.js', () => ({ get prisma() { return state.client; } }));
import { findAllThreads, findThreadById, findCommentsByThreadId, toggleThreadLike } from '../src/repositories/forum.repository.js';

const connectionUrl = process.env['HERBALAI_TEST_DATABASE_URL'];
const enabled = adminEditDatabaseBoundary(connectionUrl, process.env['DATABASE_URL'], process.env['CI'] === 'true');
const schema = `qa_forum_notifications_${randomUUID().replaceAll('-', '')}`;
let pool: pg.Pool | undefined;
let schemaCreated = false;

describe.skipIf(!enabled)('Isolated forum ordering and like notification acceptance', () => {
  beforeAll(async () => {
    pool = new pg.Pool({ connectionString: connectionUrl, options: `-c search_path=${schema}` });
    const identity = (await pool.query('SELECT current_database() AS database, host(inet_server_addr()) AS host, inet_server_port() AS port, current_user AS "user"')).rows[0];
    knowledgeImportServerBoundary(identity, connectionUrl!, process.env['CI'] === 'true');
    await pool.query(`CREATE SCHEMA "${schema}"`);
    schemaCreated = true;
    await pool.query(`CREATE TYPE "${schema}"."Role" AS ENUM ('admin', 'contributor')`);
    await pool.query(`CREATE TABLE "${schema}"."User" (LIKE public."User" INCLUDING ALL)`);
    await pool.query(`ALTER TABLE "${schema}"."User" ALTER COLUMN role DROP DEFAULT`);
    await pool.query(`ALTER TABLE "${schema}"."User" ALTER COLUMN role TYPE "${schema}"."Role" USING role::text::"${schema}"."Role"`);
    await pool.query(`ALTER TABLE "${schema}"."User" ALTER COLUMN role SET DEFAULT 'contributor'`);
    await pool.query('CREATE TABLE "Thread" (id SERIAL PRIMARY KEY, "authorId" TEXT NOT NULL REFERENCES "User"(id), title TEXT NOT NULL, category TEXT NOT NULL, content TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, likes INTEGER NOT NULL DEFAULT 0, replies INTEGER NOT NULL DEFAULT 0, pinned BOOLEAN NOT NULL DEFAULT false, date TIMESTAMP(3) NOT NULL DEFAULT NOW(), "isDeleted" BOOLEAN NOT NULL DEFAULT false)');
    await pool.query('CREATE TABLE "ThreadLike" ("threadId" INTEGER NOT NULL REFERENCES "Thread"(id), "userId" TEXT NOT NULL REFERENCES "User"(id), date TIMESTAMP(3) NOT NULL DEFAULT NOW(), PRIMARY KEY ("threadId", "userId"))');
    await pool.query('CREATE TABLE "ThreadComment" (id SERIAL PRIMARY KEY, "threadId" INTEGER NOT NULL REFERENCES "Thread"(id), "authorId" TEXT NOT NULL REFERENCES "User"(id), "parentCommentId" INTEGER REFERENCES "ThreadComment"(id), content TEXT NOT NULL, likes INTEGER NOT NULL DEFAULT 0, date TIMESTAMP(3) NOT NULL DEFAULT NOW(), "isDeleted" BOOLEAN NOT NULL DEFAULT false)');
    await pool.query('CREATE TABLE "Notification" (id SERIAL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"(id), title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL DEFAULT \'SUGGESTION_UPDATE\', link TEXT, "isRead" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW())');
    state.client = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
  });

  afterAll(async () => {
    try {
      if (state.client) await state.client.$disconnect();
    } finally {
      if (pool) {
        try {
          if (schemaCreated) await pool.query(`DROP SCHEMA "${schema}" CASCADE`);
        } finally {
          await pool.end();
        }
      }
    }
  });

  it('keeps concurrent counts correct, persists owner-only notices, rolls back failures and sorts comments', async () => {
    const prisma = state.client!;
    const users = ['qa-forum-owner', 'qa-forum-liker-a', 'qa-forum-liker-b'];
    await prisma.user.createMany({ data: users.map(id => ({ id, username: id, email: `${id}@example.invalid`, name: id, password: 'disabled-test-only', isBanned: true })) });
    const thread = await prisma.thread.create({ data: { authorId: users[0]!, title: 'TEST ONLY isolated likes', category: 'growing', content: 'No medicinal claims.' } });
    const results = await Promise.all([toggleThreadLike(thread.id, users[1]!), toggleThreadLike(thread.id, users[2]!)]);
    expect(results.every(result => result?.hasLiked)).toBe(true);
    expect(await prisma.threadLike.count()).toBe(2);
    expect((await prisma.thread.findUniqueOrThrow({ where: { id: thread.id } })).likes).toBe(2);
    expect(await prisma.notification.count()).toBe(2);
    expect((await prisma.notification.findMany()).every(notice => notice.userId === users[0] && notice.type === 'COMMUNITY_LIKE'
      && notice.link === `/community/${thread.id}` && !notice.isRead)).toBe(true);
    expect((await toggleThreadLike(thread.id, users[0]!))?.notification).toBeNull();
    expect((await toggleThreadLike(thread.id, users[1]!))?.hasLiked).toBe(false);
    expect(await prisma.notification.count()).toBe(2);
    await pool!.query('ALTER TABLE "Notification" ADD CONSTRAINT qa_reject_likes CHECK (type <> \'COMMUNITY_LIKE\') NOT VALID');
    await expect(toggleThreadLike(thread.id, users[1]!)).rejects.toThrow();
    expect(await prisma.threadLike.findUnique({ where: { threadId_userId: { threadId: thread.id, userId: users[1]! } } })).toBeNull();
    expect((await prisma.thread.findUniqueOrThrow({ where: { id: thread.id } })).likes).toBe(2);
    expect(await prisma.notification.count()).toBe(2);
    await pool!.query('ALTER TABLE "Notification" DROP CONSTRAINT qa_reject_likes');
    expect((await toggleThreadLike(thread.id, users[1]!))?.hasLiked).toBe(true);
    expect(await prisma.notification.count()).toBe(3);
    await prisma.threadComment.createMany({ data: [
      { id: 1, threadId: thread.id, authorId: users[0]!, content: 'Old parent', date: new Date('2026-10-12T00:00:00Z') },
      { id: 2, threadId: thread.id, authorId: users[1]!, content: 'Hidden deleted text', isDeleted: true, date: new Date('2026-10-12T01:00:00Z') },
      { id: 3, threadId: thread.id, authorId: users[2]!, parentCommentId: 1, content: 'Newest reply', date: new Date('2026-10-12T01:00:00Z') },
    ] });
    const comments = await findCommentsByThreadId(thread.id);
    expect(comments.map(comment => comment.id)).toEqual([3, 2, 1]);
    expect(comments[0]?.parentCommentId).toBe(1);
    expect(comments[1]?.content).toBe('[This reply has been deleted by the author or moderator.]');
    await prisma.thread.update({ where: { id: thread.id }, data: { replies: 6 } });
    expect((await findThreadById(thread.id))?.replies).toBe(3);
    expect((await findAllThreads()).threads.find(candidate => candidate.id === thread.id)?.replies).toBe(3);
    await prisma.threadComment.delete({ where: { id: 3 } });
    expect((await findThreadById(thread.id))?.replies).toBe(2);
    expect((await findAllThreads()).threads.find(candidate => candidate.id === thread.id)?.replies).toBe(2);
  });
});
