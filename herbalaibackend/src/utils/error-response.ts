export function databaseErrorCode(err: Error & { code?: unknown }) {
  return typeof err.code === 'string' && /^(P\d{4}|ECONNRESET|ECONNREFUSED|ETIMEDOUT|57P01|53300|08006)$/.test(err.code)
    ? err.code : undefined;
}

export function errorResponse(err: Error & { status?: number; code?: unknown }, production: boolean) {
  const databaseCode = databaseErrorCode(err);
  if (databaseCode) {
    const unavailable = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', '57P01', '53300', '08006'].includes(databaseCode);
    return {
      status: unavailable ? 503 : 500,
      body: {
        status: 'error',
        code: unavailable ? 'DATABASE_UNAVAILABLE' : 'DATABASE_ERROR',
        message: unavailable
          ? 'The database is temporarily unavailable. Refresh to check the latest status before trying again.'
          : 'The database could not complete this request. Refresh to check the latest status.',
      },
    };
  }
  const status = Number.isInteger(err.status) && err.status! >= 400 && err.status! <= 599 ? err.status! : 500;
  return {
    status,
    body: {
      status: 'error',
      message: production && status >= 500 ? 'Internal Server Error' : err.message || 'Something went wrong',
      ...(!production && { stack: err.stack }),
    },
  };
}
