import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUnsubscribedEmail extends Document {
  email: string;
  createdAt: Date;
}

const UnsubscribedEmailSchema: Schema<IUnsubscribedEmail> = new Schema<IUnsubscribedEmail>(
  {
    email: { type: String, required: true, trim: true, maxlength: 200, lowercase: true, unique: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
    strictQuery: true,
  }
);

export const UnsubscribedEmail: Model<IUnsubscribedEmail> =
  mongoose.models.UnsubscribedEmail ?? mongoose.model<IUnsubscribedEmail>("UnsubscribedEmail", UnsubscribedEmailSchema);
