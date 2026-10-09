import { describe, expect, it } from 'vitest';
import { knowledgeImportServerBoundary } from './helpers/knowledge-import-server-boundary.js';

const url = 'postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test';
const target = { database: 'herbalai_test', host: '127.0.0.1', port: 5432, user: 'test_user' };

describe('knowledge import database server boundary', () => {
  it('accepts the actual loopback test server and its explicitly mapped local port', () => {
    expect(() => knowledgeImportServerBoundary(target, url, false)).not.toThrow();
    expect(() => knowledgeImportServerBoundary({ ...target, host: '127.0.0.1/32', port: 55438 }, url.replace(':5432', ':55438'), false)).not.toThrow();
  });
  it('accepts the observed Docker bridge only in CI behind the configured loopback endpoint', () => {
    expect(() => knowledgeImportServerBoundary({ ...target, host: '172.18.0.2/32' }, url, true)).not.toThrow();
  });
  it('rejects Docker bridge addresses outside CI and unexpected container mappings', () => {
    expect(() => knowledgeImportServerBoundary({ ...target, host: '172.18.0.2/32' }, url, false)).toThrow();
    expect(() => knowledgeImportServerBoundary({ ...target, host: '172.18.0.2/32', port: 55438 }, url.replace(':5432', ':55438'), true)).toThrow();
  });
  it.each(['172.15.0.2', '172.32.0.2', '172.18.999.2', '10.0.0.2', '8.8.8.8', null])('rejects an unexpected server host %s even in CI', host => {
    expect(() => knowledgeImportServerBoundary({ ...target, host }, url, true)).toThrow();
  });
  it('rejects mismatched database names, roles and server ports', () => {
    expect(() => knowledgeImportServerBoundary({ ...target, database: 'neondb' }, url, true)).toThrow();
    expect(() => knowledgeImportServerBoundary({ ...target, user: 'neondb_owner' }, url, true)).toThrow();
    expect(() => knowledgeImportServerBoundary({ ...target, port: 5433 }, url, true)).toThrow();
  });
  it('rejects remote URLs, different URL databases and non-test credentials', () => {
    expect(() => knowledgeImportServerBoundary(target, url.replace('127.0.0.1', 'example.invalid'), true)).toThrow();
    expect(() => knowledgeImportServerBoundary(target, url.replace('/herbalai_test', '/neondb'), true)).toThrow();
    expect(() => knowledgeImportServerBoundary(target, url.replace('test_user', 'neondb_owner'), true)).toThrow();
  });
});
