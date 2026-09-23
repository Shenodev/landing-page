import { createClient, type RedisClientType } from "redis";

/**
 * Optional Redis cache layer (browser -> CDN -> Redis -> MongoDB).
 * When REDIS_URL is unset or unreachable, every helper degrades to a
 * no-op and callers fall through to the database. Never throws.
 */
let client: RedisClientType | null = null;
let connectPromise: Promise<boolean> | null = null;

const getUrl = (): string | undefined => {
  const url: string | undefined = process.env.REDIS_URL;
  return url && url.trim() ? url.trim() : undefined;
};

const ensureConnected = async (): Promise<RedisClientType | null> => {
  const url: string | undefined = getUrl();
  if (!url) return null;
  if (client?.isOpen) return client;
  if (connectPromise) {
    const ok: boolean = await connectPromise;
    return ok && client?.isOpen ? client : null;
  }
  try {
    client = createClient({ url, socket: { connectTimeout: 3000 } });
    client.on("error", () => {
      // Swallowed: cache failures must never break requests.
    });
    connectPromise = client
      .connect()
      .then(() => {
        connectPromise = null;
        console.log("[redis] Connected");
        return true;
      })
      .catch((err: unknown) => {
        const msg: string = err instanceof Error ? err.message : String(err);
        console.warn(`[redis] Connection failed - caching disabled: ${msg}`);
        connectPromise = null;
        return false;
      });
    const ok: boolean = await connectPromise;
    return ok && client?.isOpen ? client : null;
  } catch (err: unknown) {
    const msg: string = err instanceof Error ? err.message : String(err);
    console.warn(`[redis] Setup failed - caching disabled: ${msg}`);
    connectPromise = null;
    return null;
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    const c: RedisClientType | null = await ensureConnected();
    if (!c) return null;
    return await c.get(key);
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttlSeconds: number): Promise<void> => {
  try {
    const c: RedisClientType | null = await ensureConnected();
    if (!c) return;
    await c.set(key, value, { EX: ttlSeconds });
  } catch {
    // Cache write failures are silent by design.
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    const c: RedisClientType | null = await ensureConnected();
    if (!c) return;
    await c.del(key);
  } catch {
    // Silent by design.
  }
};

/** True when a Redis URL is configured (not a guarantee of connectivity). */
export const isRedisConfigured = (): boolean => getUrl() !== undefined;

/** Test helper: close the client so Jest exits cleanly. */
export const _disconnectRedisForTest = async (): Promise<void> => {
  try {
    await client?.quit().catch(() => undefined);
  } finally {
    client = null;
    connectPromise = null;
  }
};
