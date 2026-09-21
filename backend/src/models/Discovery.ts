import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiscovery extends Document {
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  businessDesc: string;
  targetAudience: string;
  competitors: string;
  brandStatus: "ready" | "logo_only" | "need_identity";
  references: string;
  dislikes: string;
  targetPackage: "corporate" | "dashboard" | "platform";
  requiredFeatures: string;
  integrations: string;
  launchDate: string;
  extraDetails: string;
  meetingDate: string;
  meetingTime: string;
  meetingUrl: string;
  calendlyEventUri: string;
  calendlyEventUrl: string;
  attachmentUrl: string;
  attachmentPublicId: string;
  attachments?: Array<{ url: string; publicId?: string; fileName?: string; mimeType?: string; size?: number }>;
  createdAt: Date;
}

const DiscoverySchema: Schema<IDiscovery> = new Schema<IDiscovery>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100, minlength: 2 },
    companyName: { type: String, required: true, trim: true, maxlength: 100, minlength: 2 },
    email: { type: String, required: true, trim: true, maxlength: 200, lowercase: true },
    phone: { type: String, required: false, trim: true, maxlength: 30 },
    businessDesc: { type: String, required: true, trim: true, maxlength: 2000, minlength: 10 },
    targetAudience: { type: String, required: false, trim: true, maxlength: 1000 },
    competitors: { type: String, required: false, trim: true, maxlength: 1000 },
    brandStatus: { type: String, required: true, enum: ["ready", "logo_only", "need_identity"] },
    references: { type: String, required: false, trim: true, maxlength: 1000 },
    dislikes: { type: String, required: false, trim: true, maxlength: 1000 },
    targetPackage: { type: String, required: true, enum: ["corporate", "dashboard", "platform"] },
    requiredFeatures: { type: String, required: false, trim: true, maxlength: 2000 },
    integrations: { type: String, required: false, trim: true, maxlength: 1000 },
    launchDate: { type: String, required: false, trim: true },
    extraDetails: { type: String, required: false, trim: true, maxlength: 2000 },
    meetingDate: { type: String, required: false, trim: true },
    meetingTime: { type: String, required: false, trim: true },
    meetingUrl: { type: String, required: false, trim: true },
    calendlyEventUri: { type: String, required: false, trim: true },
    calendlyEventUrl: { type: String, required: false, trim: true },
    attachmentUrl: { type: String, required: false, trim: true },
    attachmentPublicId: { type: String, required: false, trim: true },
    attachments: {
      type: [
        new Schema(
          {
            url: { type: String, required: true, trim: true, maxlength: 500 },
            publicId: { type: String, required: false, trim: true, maxlength: 500 },
            fileName: { type: String, required: false, trim: true, maxlength: 200 },
            mimeType: { type: String, required: false, trim: true, maxlength: 100 },
            size: { type: Number, required: false, min: 0 },
          },
          { _id: false }
        ),
      ],
      required: false,
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
    strictQuery: true,
  }
);

export const Discovery: Model<IDiscovery> = mongoose.models.Discovery ?? mongoose.model<IDiscovery>("Discovery", DiscoverySchema);
