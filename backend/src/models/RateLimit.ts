import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  totalHits: number;
  resetAt: Date;
}

const RateLimitSchema: Schema<IRateLimit> = new Schema<IRateLimit>(
  {
    key: { type: String, required: true },
    totalHits: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true },
  },
  {
    strict: true,
    strictQuery: true,
    // Expired rows are swept by MongoDB's TTL monitor, which only runs about
    // once a minute. The store treats a present-but-expired row as absent, so
    // correctness never depends on the sweep keeping up.
    autoIndex: true,
  }
);

// One counter per key. The unique index is also what makes the store's
// create-then-retry path safe against two instances starting the same window.
RateLimitSchema.index({ key: 1 }, { unique: true });
// Reclaim rows once their window has passed.
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit: Model<IRateLimit> = mongoose.models.RateLimit ?? mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
