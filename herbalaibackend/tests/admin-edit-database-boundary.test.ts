import { describe, expect, it } from 'vitest';
import { adminEditDatabaseBoundary } from './helpers/admin-edit-database-boundary.js';

const isolated = 'postgresql://test_user:test_password@127.0.0.1:5432/herbalai_test';
describe('administrator database acceptance target boundary', () => {
  it('accepts matching loopback targets including the CI localhost alias', () => {
    expect(adminEditDatabaseBoundary(isolated, isolated.replace('127.0.0.1', 'localhost'), true)).toBe(true);
  });
  it('does not silently skip the gate in CI', () => {
    expect(() => adminEditDatabaseBoundary(undefined, isolated, true)).toThrow(/must configure/);
    expect(adminEditDatabaseBoundary(undefined, undefined, false)).toBe(false);
  });
  it.each([
    isolated.replace('127.0.0.1', 'production.example.invalid'),
    isolated.replace('herbalai_test', 'neondb'),
    isolated.replace('postgresql:', 'https:'),
    isolated.replace(':5432', ':5433'),
  ])('refuses an unsafe or different runtime target: %s', target => {
    expect(() => adminEditDatabaseBoundary(isolated, target, true)).toThrow();
    expect(() => adminEditDatabaseBoundary(target, isolated, true)).toThrow();
  });
});
