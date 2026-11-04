interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * Remember a result for ttlMs, and share one in-flight request between callers.
 * The route handlers also send CDN cache headers, so on Vercel this mostly
 * protects against bursts hitting a cold instance.
 */
export async function remember<T>(key: string, ttlFor: (value: T) => number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = load()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlFor(value) });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
