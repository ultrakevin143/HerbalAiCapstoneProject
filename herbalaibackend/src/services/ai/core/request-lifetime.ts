export interface AiRequestOptions {
  signal?: AbortSignal;
}

export const createAiDeadline = (timeoutMs: number, parentSignal?: AbortSignal) => {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) forwardAbort();
  else parentSignal?.addEventListener('abort', forwardAbort, { once: true });
  const timer = controller.signal.aborted ? undefined : setTimeout(() => {
    controller.abort(new DOMException('Dr. Ai request timed out.', 'TimeoutError'));
  }, timeoutMs);
  return {
    signal: controller.signal,
    abort: (reason?: unknown) => controller.abort(reason),
    dispose: () => {
      clearTimeout(timer);
      parentSignal?.removeEventListener('abort', forwardAbort);
    },
  };
};

export const awaitAiOperation = async <Result>(
  operation: () => Result | PromiseLike<Result>, signal?: AbortSignal,
): Promise<Result> => {
  signal?.throwIfAborted();
  if (!signal) return operation();
  return new Promise<Result>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve().then(() => {
      signal.throwIfAborted();
      return operation();
    }).then(value => {
      signal.removeEventListener('abort', onAbort);
      resolve(value);
    }, error => {
      signal.removeEventListener('abort', onAbort);
      reject(error);
    });
  });
};

export async function* iterateAiOperation<Result>(source: AsyncIterable<Result>, signal?: AbortSignal) {
  const iterator = source[Symbol.asyncIterator]();
  try {
    while (true) {
      const result = await awaitAiOperation(() => iterator.next(), signal);
      if (result.done) return;
      yield result.value;
    }
  } finally {
    if (iterator.return) {
      void Promise.resolve().then(() => iterator.return!()).catch(() => undefined);
    }
  }
}
