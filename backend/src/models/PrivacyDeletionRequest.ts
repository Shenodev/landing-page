import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrivacyDeletionRequest extends Document {
  name: string;
  email: string;
  details: string;
  status: "pending" | "completed";
  createdAt: Date;
}

const PrivacyDeletionRequestSchema: Schema<IPrivacyDeletionRequest> = new Schema<IPrivacyDeletionRequest>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100, minlength: 2 },
    email: { type: String, required: true, trim: true, maxlength: 200, lowercase: true },
    details: { type: String, required: false, trim: true, maxlength: 1000, default: "" },
    status: { type: String, required: true, enum: ["pending", "completed"], default: "pending" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
    strictQuery: true,
  }
);

export const PrivacyDeletionRequest: Model<IPrivacyDeletionRequest> =
  mongoose.models.PrivacyDeletionRequest ??
  mongoose.model<IPrivacyDeletionRequest>("PrivacyDeletionRequest", PrivacyDeletionRequestSchema);
