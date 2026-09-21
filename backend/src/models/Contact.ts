import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  message: string;
  details: string;
  createdAt: Date;
}

const ContactSchema: Schema<IContact> = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      lowercase: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
      minlength: 10,
    },
    details: {
      type: String,
      required: false,
      trim: true,
      maxlength: 1000,
      minlength: 10,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
    strictQuery: true,
  }
);

// sanitizeFilter is handled at query level via mongoose.set; schema level strict prevents injection

export const Contact: Model<IContact> = mongoose.models.Contact ?? mongoose.model<IContact>("Contact", ContactSchema);
