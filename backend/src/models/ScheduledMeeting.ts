import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IScheduledMeeting extends Document {
  email: string;
  inviteeUri: string;
  inviteeUuid: string;
  eventUri: string;
  eventUuid: string;
  eventName: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  status: "scheduled" | "canceled";
  schedulingUrl: string;
  meetingLink: string;
  rescheduleUrl: string;
  cancelUrl: string;
  discoveryId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ScheduledMeetingSchema: Schema<IScheduledMeeting> = new Schema<IScheduledMeeting>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    inviteeUri: { type: String, required: true, unique: true, trim: true },
    inviteeUuid: { type: String, required: false, trim: true },
    eventUri: { type: String, required: false, trim: true },
    eventUuid: { type: String, required: false, trim: true },
    eventName: { type: String, required: false, trim: true },
    startTime: { type: Date, required: false },
    endTime: { type: Date, required: false },
    timezone: { type: String, required: false, trim: true },
    status: { type: String, required: true, enum: ["scheduled", "canceled"], default: "scheduled" },
    schedulingUrl: { type: String, required: false, trim: true },
    meetingLink: { type: String, required: false, trim: true },
    rescheduleUrl: { type: String, required: false, trim: true },
    cancelUrl: { type: String, required: false, trim: true },
    discoveryId: { type: Schema.Types.ObjectId, ref: "Discovery", required: false },
    metadata: { type: Schema.Types.Mixed, required: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
    strict: true,
    strictQuery: true,
  }
);

ScheduledMeetingSchema.index({ email: 1, status: 1 });

export const ScheduledMeeting: Model<IScheduledMeeting> =
  mongoose.models.ScheduledMeeting ?? mongoose.model<IScheduledMeeting>("ScheduledMeeting", ScheduledMeetingSchema);