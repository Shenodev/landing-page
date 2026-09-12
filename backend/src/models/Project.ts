import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  imageUrl: string;
  techStack: string[];
  demoUrl: string;
  githubUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema<IProject> = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100, minlength: 2 },
    description: { type: String, required: true, trim: true, maxlength: 1000, minlength: 10 },
    imageUrl: { type: String, required: true, trim: true, maxlength: 500 },
    techStack: { type: [String], required: true, validate: (v: string[]) => v.length > 0 },
    demoUrl: { type: String, required: false, trim: true, maxlength: 500 },
    githubUrl: { type: String, required: false, trim: true, maxlength: 500 },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
  }
);

export const Project: Model<IProject> = mongoose.models.Project ?? mongoose.model<IProject>("Project", ProjectSchema);
