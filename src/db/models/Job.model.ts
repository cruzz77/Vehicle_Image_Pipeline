import mongoose, { Schema, Document } from "mongoose";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface IJob extends Document {
  filename: string;
  originalName: string;
  filepath: string;
  mimetype: string;
  size: number;
  status: JobStatus;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    filepath: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    failureReason: { type: String },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>("Job", JobSchema);