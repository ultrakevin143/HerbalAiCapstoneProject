import crypto from 'node:crypto';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import dotenv from '../herbalaibackend/node_modules/dotenv/lib/main.js';
import pg from '../herbalaibackend/node_modules/pg/lib/index.js';

dotenv.config({ path: fileURLToPath(new URL('../herbalaibackend/.env', import.meta.url)) });

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

const quoteIdentifier = (value) => `"${String(value).replaceAll('"', '""')}"`;
const schemaName = `restore_check_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const client = new Client({ connectionString: databaseUrl });
const results = [];
let serializedBytes = 0;
let connected = false;

const digestTable = async (schema, table) => {
  const qualified = `${quoteIdentifier(schema)}.${quoteIdentifier(table)}`;
  const result = await client.query(`
    SELECT
      COUNT(*)::int AS count,
      md5(COALESCE(string_agg(row_hash, '' ORDER BY row_hash), '')) AS digest
    FROM (
      SELECT md5(row_to_json(source_row)::text) AS row_hash
      FROM ${qualified} AS source_row
    ) AS row_hashes
  `);
  return result.rows[0];
};

try {
  await client.connect();
  connected = true;
  const tableResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name <> '_prisma_migrations'
    ORDER BY table_name
  `);

  if (tableResult.rows.length === 0) {
    throw new Error('No application tables were found in the public schema.');
  }

  await client.query(`CREATE SCHEMA ${quoteIdentifier(schemaName)}`);

  for (const { table_name: tableName } of tableResult.rows) {
    const source = `${quoteIdentifier('public')}.${quoteIdentifier(tableName)}`;
    const restored = `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`;
    const snapshotResult = await client.query(`SELECT COALESCE(json_agg(source_row), '[]'::json)::text AS snapshot FROM ${source} AS source_row`);
    const snapshot = snapshotResult.rows[0].snapshot;
    serializedBytes += Buffer.byteLength(snapshot, 'utf8');

    await client.query(`CREATE TABLE ${restored} (LIKE ${source} INCLUDING ALL)`);
    if (snapshot !== '[]') {
      await client.query(`INSERT INTO ${restored} SELECT * FROM json_populate_recordset(NULL::${restored}, $1::json)`, [snapshot]);
    }

    const [sourceProof, restoredProof] = await Promise.all([
      digestTable('public', tableName),
      digestTable(schemaName, tableName),
    ]);
    const passed = sourceProof.count === restoredProof.count && sourceProof.digest === restoredProof.digest;
    results.push({ table: tableName, rows: sourceProof.count, passed });
    if (!passed) {
      throw new Error(`Restore verification failed for table ${tableName}.`);
    }
  }

  const totalRows = results.reduce((sum, result) => sum + result.rows, 0);
  console.log(`Backup/restore verification passed for ${results.length} tables and ${totalRows} rows.`);
  console.log(`Serialized logical snapshot size: ${serializedBytes} bytes.`);
  for (const result of results) {
    console.log(`PASS ${result.table}: ${result.rows} rows`);
  }
} finally {
  if (connected) {
    await client.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(schemaName)} CASCADE`);
    await client.end();
  }
}
