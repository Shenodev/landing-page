import type { Store, Options } from "express-rate-limit";
import { createMongoRateLimitStore, RateLimitDoc } from "../src/config/rate-limit-store";

/**
 * A minimal stand-in for the MongoDB collection backing the store.
 *
 * Two store instances are pointed at ONE fake collection, which is exactly the
 * arrangement the real deployment has: many serverless instances, one database.
 * That is what makes the cross-instance assertions below meaningful.
 */
class FakeCollection {
  public readonly docs: Map<string, RateLimitDoc> = new Map();
  public failWith: Error | null = null;
  public calls = 0;

  private guard(): void {
    this.calls += 1;
    if (this.failWith) throw this.failWith;
  }

  async findOneAndUpdate(
    filter: { key: string; resetAt: { $gt?: Date; $lte?: Date } },
    update: { $inc?: { totalHits: number }; $set?: { totalHits: number; resetAt: Date } },
    _options: { new: boolean }
  ): Promise<RateLimitDoc | null> {
    this.guard();
    const doc = this.docs.get(filter.key);
    if (!doc) return null;
    // A $gt filter matches only a live window; a $lte filter matches only an
    // expired one. Mirrors how MongoDB would evaluate the same operators.
    if (filter.resetAt.$gt && doc.resetAt.getTime() <= filter.resetAt.$gt.getTime()) return null;
    if (filter.resetAt.$lte && doc.resetAt.getTime() > filter.resetAt.$lte.getTime()) return null;
    if (update.$inc) doc.totalHits += update.$inc.totalHits;
    if (update.$set) {
      doc.totalHits = update.$set.totalHits;
      doc.resetAt = update.$set.resetAt;
    }
    return doc;
  }

  async create(doc: RateLimitDoc): Promise<RateLimitDoc> {
    this.guard();
    if (this.docs.has(doc.key)) {
      const err: Error & { code?: number } = new Error("E11000 duplicate key");
      err.code = 11000;
      throw err;
    }
    this.docs.set(doc.key, doc);
    return doc;
  }

  async updateOne(filter: { key: string }, update: { $inc: { totalHits: number } }): Promise<RateLimitDoc | null> {
    this.guard();
    const doc = this.docs.get(filter.key);
    if (!doc) return null;
    doc.totalHits += update.$inc.totalHits;
    return doc;
  }

  async deleteOne(filter: { key: string }): Promise<unknown> {
    this.guard();
    this.docs.delete(filter.key);
    return { deletedCount: 1 };
  }
}

describe("Shared rate limit store - real model compatibility", () => {
  // The store is handed a Mongoose model. A test double will happily accept a
  // method name that no Mongoose model has, and the store then throws the first
  // time a window expires in production. Assert against the real model.
  const required = ["findOneAndUpdate", "create", "updateOne", "deleteOne"] as const;

  it("only calls methods that exist on the real Mongoose model", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RateLimit } = require("../src/models/RateLimit");

    for (const method of required) {
      expect(typeof (RateLimit as Record<string, unknown>)[method]).toBe("function");
    }
  });

  it("declares a unique index on the key and a TTL index on the window", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RateLimit } = require("../src/models/RateLimit");
    const indexes = RateLimit.schema.indexes() as Array<[Record<string, number>, Record<string, unknown>]>;

    const uniqueOnKey = indexes.some(([fields, opts]) => fields.key === 1 && opts.unique === true);
    const ttlOnResetAt = indexes.some(([fields, opts]) => fields.resetAt === 1 && opts.expireAfterSeconds === 0);

    expect(uniqueOnKey).toBe(true);
    expect(ttlOnResetAt).toBe(true);
  });
});

const options = (windowMs: number): Options => ({ windowMs } as Options);

describe("Shared rate limit store", () => {
  let collection: FakeCollection;

  beforeEach(() => {
    collection = new FakeCollection();
  });

  const newStore = (windowMs = 60_000): Store => {
    // Report a live connection: this group is about how the shared counter
    // behaves, not about what happens when MongoDB is absent.
    const store = createMongoRateLimitStore(collection as never, () => true);
    store.init?.(options(windowMs));
    return store;
  };

  it("counts a key shared across separate store instances", async () => {
    // This is the defect being fixed. With the default MemoryStore each
    // serverless instance kept its own counter, so the real ceiling was
    // (limit x instances) rather than `limit`.
    const instanceA = newStore();
    const instanceB = newStore();

    await instanceA.increment("1.2.3.4");
    await instanceA.increment("1.2.3.4");
    const seenByB = await instanceB.increment("1.2.3.4");

    expect(seenByB?.totalHits).toBe(3);
  });

  it("keeps separate keys independent", async () => {
    const storeA = newStore();
    const storeB = newStore();

    await storeA.increment("1.1.1.1");
    await storeA.increment("1.1.1.1");
    const other = await storeB.increment("2.2.2.2");

    expect(other?.totalHits).toBe(1);
  });

  it("declares that its keys are not local, so double counting can be detected", () => {
    expect(newStore().localKeys).toBe(false);
  });

  it("starts a fresh window once the previous one has elapsed", async () => {
    const store = newStore(50);

    const first = await store.increment("3.3.3.3");
    expect(first?.totalHits).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 80));

    const second = await store.increment("3.3.3.3");
    expect(second?.totalHits).toBe(1);
  });

  it("reports a reset time inside the window", async () => {
    const store = newStore(60_000);
    const res = await store.increment("4.4.4.4");

    const delta = (res?.resetTime?.getTime() ?? 0) - Date.now();
    expect(delta).toBeGreaterThan(0);
    expect(delta).toBeLessThanOrEqual(60_000);
  });

  it("clears a key on resetKey so a legitimate client is not locked out", async () => {
    const store = newStore();
    await store.increment("5.5.5.5");
    await store.resetKey("5.5.5.5");

    const after = await store.increment("5.5.5.5");
    expect(after?.totalHits).toBe(1);
  });

  it("decrements without going below zero", async () => {
    const store = newStore();
    await store.increment("6.6.6.6");
    await store.decrement("6.6.6.6");

    const after = await store.increment("6.6.6.6");
    expect(after?.totalHits).toBe(1);
  });

  it("fails open when the database is unavailable rather than blocking traffic", async () => {
    // A rate limiter that throws during a MongoDB outage would take the whole
    // API down. It must degrade to counting in memory instead.
    const store = newStore();
    collection.failWith = new Error("connection pool exhausted");

    const res = await store.increment("7.7.7.7");

    expect(typeof res?.totalHits).toBe("number");
    expect(res?.totalHits).toBeGreaterThan(0);
  });

  it("recovers once the database comes back", async () => {
    const store = newStore();
    collection.failWith = new Error("transient");
    await store.increment("8.8.8.8");
    collection.failWith = null;

    const res = await store.increment("8.8.8.8");
    expect(res?.totalHits).toBe(1);
  });
});

describe("Shared rate limit store - database not connected", () => {
  it("does not touch the database and does not block when MongoDB is down", async () => {
    // A Mongoose query issued while disconnected does not fail fast: it waits
    // for the connection to be established, up to the 5s serverSelection
    // timeout. Applied to every request that is exactly how a MongoDB outage
    // becomes a total API outage - the limiter is the first thing in the chain.
    const collection = new FakeCollection();
    const store = createMongoRateLimitStore(collection as never, () => false);
    store.init?.(options(60_000));

    const started = Date.now();
    const res = await store.increment("9.9.9.9");
    const elapsed = Date.now() - started;

    expect(typeof res?.totalHits).toBe("number");
    expect(elapsed).toBeLessThan(50);
    expect(collection.calls).toBe(0);
  });

  it("still counts per key while disconnected, so a client cannot burst", async () => {
    const collection = new FakeCollection();
    const store = createMongoRateLimitStore(collection as never, () => false);
    store.init?.(options(60_000));

    await store.increment("10.10.10.10");
    const second = await store.increment("10.10.10.10");

    expect(second?.totalHits).toBe(2);
  });

  it("uses the database again once the connection is back", async () => {
    const collection = new FakeCollection();
    let connected = false;
    const store = createMongoRateLimitStore(collection as never, () => connected);
    store.init?.(options(60_000));

    await store.increment("11.11.11.11");
    expect(collection.calls).toBe(0);

    connected = true;
    const res = await store.increment("11.11.11.11");

    expect(collection.calls).toBeGreaterThan(0);
    expect(res?.totalHits).toBe(1);
  });
});
