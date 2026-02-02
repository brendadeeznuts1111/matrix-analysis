// lib/async.ts - Async primitives: retry, pool, debounce, throttle
// ═══════════════════════════════════════════════════════════════════════════════
// Generic async utilities extracted from repeated codebase patterns.
// retry() generalizes http.ts fetchWithRetry for any async operation.
// pool() limits concurrency for bulk parallel work.
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// BN-070: Generic Retry with Exponential Backoff
// ─────────────────────────────────────────────────────────────────────────────
export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export const retry = async <T>(
  fn: (attempt: number) => Promise<T>,
  options?: RetryOptions
): Promise<T> => {
  const { retries = 3, delayMs = 500, maxDelayMs = 5000, shouldRetry, onRetry } = options ?? {};

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (shouldRetry && !shouldRetry(err, attempt)) throw err;
      if (attempt < retries) {
        onRetry?.(attempt + 1, err);
        const delay = Math.min(delayMs * Math.pow(2, attempt), maxDelayMs);
        await Bun.sleep(delay);
      }
    }
  }
  throw lastError;
};

export const retrySafe = async <T>(
  fn: (attempt: number) => Promise<T>,
  options?: RetryOptions
): Promise<T | null> =>
  retry(fn, options).catch(() => null);

// ─────────────────────────────────────────────────────────────────────────────
// BN-071: Concurrency Pool
// ─────────────────────────────────────────────────────────────────────────────
export const pool = async <T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency = 4
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let next = 0;

  const worker = async () => {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await fn(items[idx], idx);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
};

export const poolSafe = async <T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency = 4
): Promise<(R | null)[]> => {
  const safeFn = async (item: T, index: number): Promise<R | null> =>
    fn(item, index).catch(() => null);
  return pool(items, safeFn, concurrency);
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-072: Debounce
// ─────────────────────────────────────────────────────────────────────────────
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-073: Throttle
// ─────────────────────────────────────────────────────────────────────────────
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  intervalMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastRun;

    if (elapsed >= intervalMs) {
      lastRun = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        fn(...args);
      }, intervalMs - elapsed);
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return throttled;
};

// ─────────────────────────────────────────────────────────────────────────────
// BN-074: Deferred & Timeout Helpers
// ─────────────────────────────────────────────────────────────────────────────
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export const deferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = "Operation timed out"
): Promise<T> => {
  const timer = deferred<never>();
  const id = setTimeout(() => timer.reject(new Error(message)), timeoutMs);
  try {
    return await Promise.race([promise, timer.promise]);
  } finally {
    clearTimeout(id);
  }
};

export const withTimeoutSafe = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> =>
  withTimeout(promise, timeoutMs).catch(() => null);
