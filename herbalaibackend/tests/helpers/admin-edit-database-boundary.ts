export const adminEditDatabaseBoundary = (dedicated: string | undefined, runtime: string | undefined, ci: boolean) => {
  if (!dedicated) {
    if (ci) throw new Error('CI must configure HERBALAI_TEST_DATABASE_URL for administrator edit acceptance.');
    return false;
  }
  const target = new URL(dedicated);
  const actual = new URL(runtime ?? '');
  for (const connection of [target, actual]) {
    if (connection.protocol !== 'postgresql:' || !['127.0.0.1', 'localhost'].includes(connection.hostname) || connection.pathname !== '/herbalai_test') {
      throw new Error('Administrator edit tests require only the isolated loopback herbalai_test database.');
    }
  }
  if ((target.port || '5432') !== (actual.port || '5432')) throw new Error('Administrator edit test database ports must match.');
  return true;
};
