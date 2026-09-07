export function errorResponse(err: Error & { status?: number }, production: boolean) {
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
