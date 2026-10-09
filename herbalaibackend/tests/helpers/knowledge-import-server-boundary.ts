import { isIP } from 'node:net';

type ServerTarget = { database: string; host: string | null; port: number; user: string };

export const knowledgeImportServerBoundary = (target: ServerTarget, connectionUrl: string, ci: boolean) => {
  const connection = new URL(connectionUrl);
  const requestedPort = Number(connection.port || '5432');
  if (connection.protocol !== 'postgresql:' || !['127.0.0.1', 'localhost'].includes(connection.hostname)
    || connection.pathname !== '/herbalai_test' || connection.username !== 'test_user'
    || target.database !== 'herbalai_test' || target.user !== 'test_user' || Number(target.port) !== requestedPort) {
    throw new Error('Knowledge import checks require the explicitly configured isolated test database.');
  }
  const host = target.host?.replace(/\/32$/, '') ?? '';
  const loopback = host === '127.0.0.1';
  const containerBridge = ci && requestedPort === 5432 && isIP(host) === 4 && /^172\.(?:1[6-9]|2\d|3[01])\./.test(host);
  if (!loopback && !containerBridge) throw new Error('Unexpected knowledge import test server address.');
};
