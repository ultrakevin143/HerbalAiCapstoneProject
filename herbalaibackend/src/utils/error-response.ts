const unavailableDatabaseCodes = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2028', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', '57P01', '53300', '08006']);

export function rethrowDatabaseUnavailable(error: unknown) {
  if (error instanceof Error && unavailableDatabaseCodes.has(databaseErrorCode(error) ?? '')) throw error;
}

export function databaseErrorCode(err: Error & { code?: unknown }) {
  return typeof err.code === 'string' && /^(P\d{4}|ECONNRESET|ECONNREFUSED|ETIMEDOUT|57P01|53300|08006)$/.test(err.code)
    ? err.code : undefined;
}

export function requestBodyErrorResponse(err: Error & { type?: unknown }) {
  if (err.type === 'entity.parse.failed') return { status: 400, body: { status: 'error', code: 'INVALID_JSON', message: 'Request body contains invalid JSON.' } };
  if (err.type === 'entity.too.large' || err.type === 'parameters.too.many') return { status: 413, body: { status: 'error', code: 'REQUEST_BODY_TOO_LARGE', message: 'Request body is too large.' } };
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') return { status: 415, body: { status: 'error', code: 'UNSUPPORTED_BODY_ENCODING', message: 'Request body encoding is not supported.' } };
  if (err.type === 'request.aborted' || err.type === 'request.size.invalid') return { status: 400, body: { status: 'error', code: 'INVALID_REQUEST_BODY', message: 'Request body could not be read.' } };
  return null;
}

export function errorResponse(err: Error & { status?: number; code?: unknown; type?: unknown }, production: boolean) {
  const bodyError = requestBodyErrorResponse(err);
  if (bodyError) return bodyError;
  if (err.code === 'VERIFICATION_EMAIL_UNAVAILABLE') {
    return {
      status: 503,
      body: {
        status: 'error',
        code: 'VERIFICATION_EMAIL_UNAVAILABLE',
        message: 'Verification email could not be sent. Please try again later. Any previous unexpired verification link is unchanged.',
      },
    };
  }
  if (err.code === 'MEDIA_UPLOAD_UNAVAILABLE') {
    return {
      status: 503,
      body: {
        status: 'error',
        code: 'MEDIA_UPLOAD_UNAVAILABLE',
        message: 'Image upload is temporarily unavailable. Please try again later.',
      },
    };
  }
  const databaseCode = databaseErrorCode(err);
  if (databaseCode) {
    const unavailable = unavailableDatabaseCodes.has(databaseCode);
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
