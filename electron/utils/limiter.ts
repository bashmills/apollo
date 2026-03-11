import { RateLimitError, NotModifiedError, AbortError } from "../errors";

const LAST_REQUEST_TIMES = new Map<string, number>();
const QUEUES = new Map<string, Promise<void>>();
const RETRIES = 2;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function retry<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  let last: unknown = null;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error && error.name === RateLimitError.Name) {
        throw error;
      }

      if (error instanceof Error && error.name === NotModifiedError.Name) {
        throw error;
      }

      if (error instanceof Error && error.name === AbortError.Name) {
        throw error;
      }

      last = error;
    }

    await sleep(ms);
  }

  throw last;
}

export function limiter<T>(url: URL, fn: () => Promise<T>, ms: number): Promise<T> {
  const prev = QUEUES.get(url.hostname) ?? Promise.resolve();
  const result = prev.then(async () => {
    const lastRequestTime = LAST_REQUEST_TIMES.get(url.hostname) ?? 0;
    const elapsed = Date.now() - lastRequestTime;
    const delay = ms - elapsed;
    if (delay > 0) {
      await sleep(delay);
    }

    const result = await retry(fn, ms);
    LAST_REQUEST_TIMES.set(url.hostname, Date.now());
    return result;
  });

  const next = result.then(
    () => {},
    () => {},
  );

  QUEUES.set(url.hostname, next);
  return result;
}
