import { MemoryStore, type IncrementResponse, type Options, type Store } from "express-rate-limit";
import { getConnectionState } from "./db";

/**
 * A rate limit counter row.
 *
 * Exported so the store's persistence contract can be exercised directly rather
 * than inferred through Mongoose.
 */
export interface RateLimitDoc {
  key: string;
  totalHits: number;
  resetAt: Date;
}

/**
 * The collection operations the store relies on.
 *
 * A structural subset of a Mongoose model, kept narrow so the store can be
 * tested against a plain object. Every method named here must exist on a real
 * Mongoose model - a custom helper name would compile fine against a test fake
 * and then throw at runtime in production, so
 * tests/rate-limit-store.test.ts asserts the real model satisfies this shape.
 */
export interface RateLimitCollection {
  findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options: { new: boolean }
  ): Promise<RateLimitDoc | null>;
  create(doc: RateLimitDoc): Promise<RateLimitDoc>;
  updateOne(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<RateLimitDoc | null>;
  deleteOne(filter: Record<string, unknown>): Promise<unknown>;
}

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

const toErrorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * A rate limit store whose counters are shared by every serverless instance.
 *
 * Why this exists: express-rate-limit's default MemoryStore keeps counters in
 * process memory. On Vercel each instance is its own process, so a limiter
 * configured at 20 requests per 15 minutes really allowed 20 x (number of
 * instances). The admin write limiter - the brute-force guard on the project
 * endpoint - was therefore several times weaker than it read, and got weaker
 * the more load the site took.
 *
 * Counters live in MongoDB, which the API already depends on, so this needs no
 * new infrastructure. `localKeys: false` tells express-rate-limit the keys are
 * shared, which is what it needs to detect a limiter being double counted.
 *
 * If MongoDB is unreachable the store falls back to an in-process counter. That
 * is deliberately weaker than a shared counter, but it keeps a database outage
 * from turning into a total API outage, which failing closed would do.
 */
export const createMongoRateLimitStore = (
  collection: RateLimitCollection,
  isConnected: () => boolean = () => getConnectionState() === 1
): Store => {
  // Used only while the database is unreachable, so a limiter never throws and
  // never blocks every caller during a MongoDB outage.
  const fallback = new MemoryStore();

  let windowMs = 60_000;

  const viaFallback = async (key: string): Promise<IncrementResponse> => {
    const res = await fallback.increment(key);
    if (!res) throw new Error("rate limit fallback failed");
    return res;
  };

  return {
    localKeys: false,

    init(options: Options): void {
      windowMs = options.windowMs;
      fallback.init?.(options);
    },

    async increment(key: string): Promise<IncrementResponse> {
      // Check the connection before issuing any query. A Mongoose operation
      // issued while disconnected does not fail - it waits for a connection to
      // be established, bounded by the 5s serverSelection timeout. Doing that
      // on the first middleware of every request turns a MongoDB outage into a
      // total API outage, so an unreachable database must never be touched here.
      if (!isConnected()) {
        return viaFallback(key);
      }

      const now = new Date();

      try {
        // Only count against a window that has not expired. MongoDB's TTL
        // monitor only sweeps expired documents about once a minute, so an
        // expired row can still be present and must not be revived here.
        const live = await collection.findOneAndUpdate(
          { key, resetAt: { $gt: now } },
          { $inc: { totalHits: 1 } },
          { new: true }
        );
        if (live) {
          return { totalHits: live.totalHits, resetTime: live.resetAt };
        }

        try {
          const fresh = await collection.create({
            key,
            totalHits: 1,
            resetAt: new Date(now.getTime() + windowMs),
          });
          return { totalHits: fresh.totalHits, resetTime: fresh.resetAt };
        } catch (createErr: unknown) {
          if (!isDuplicateKeyError(createErr)) throw createErr;

          // A row already exists but its window has expired. MongoDB's TTL
          // monitor only sweeps expired documents about once a minute, so the
          // stale row is still there and `create` cannot succeed. Reset the
          // expired window in place instead of incrementing it, otherwise the
          // first request of every new window inherits the previous window's
          // count and a client is throttled early.
          const resetAt = new Date(now.getTime() + windowMs);
          const refreshed = await collection.findOneAndUpdate(
            { key, resetAt: { $lte: now } },
            { $set: { totalHits: 1, resetAt } },
            { new: true }
          );
          if (refreshed) {
            return { totalHits: refreshed.totalHits, resetTime: refreshed.resetAt };
          }

          // The row is live after all: another instance refreshed the window
          // between our lookup and this write, so join that window.
          const raced = await collection.updateOne({ key }, { $inc: { totalHits: 1 } });
          if (!raced) return viaFallback(key);
          return { totalHits: raced.totalHits, resetTime: raced.resetAt };
        }
      } catch (err: unknown) {
        console.warn(`[rate-limit] store unavailable, counting in memory: ${toErrorMessage(err)}`);
        return viaFallback(key);
      }
    },

    async decrement(key: string): Promise<void> {
      try {
        const doc = await collection.findOneAndUpdate(
          { key, resetAt: { $gt: new Date() } },
          { $inc: { totalHits: -1 } },
          { new: true }
        );
        // A concurrent window reset can leave totalHits negative; clamp it.
        if (doc && doc.totalHits < 0) {
          await collection.updateOne({ key }, { $inc: { totalHits: -doc.totalHits } });
        }
      } catch (err: unknown) {
        console.warn(`[rate-limit] decrement failed: ${toErrorMessage(err)}`);
      }
    },

    async resetKey(key: string): Promise<void> {
      try {
        await collection.deleteOne({ key });
      } catch (err: unknown) {
        console.warn(`[rate-limit] resetKey failed: ${toErrorMessage(err)}`);
      }
    },

    async resetAll(): Promise<void> {
      await fallback.resetAll?.();
    },

    async shutdown(): Promise<void> {
      await fallback.shutdown?.();
    },
  };
};
