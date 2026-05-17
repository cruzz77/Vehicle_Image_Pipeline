import mongoose, { Schema, Document } from "mongoose";

export interface ICheckResult {
  checkName: string;
  passed: boolean;
  confidence: number; // 0 to 1
  details: string;
}

export interface IResult extends Document {
  jobId: mongoose.Types.ObjectId;
  checks: ICheckResult[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const CheckResultSchema = new Schema<ICheckResult>(
  {
    checkName: { type: String, required: true },
    passed: { type: Boolean, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    details: { type: String, required: true },
  },
  { _id: false } // no separate _id for subdocuments
);

const ResultSchema = new Schema<IResult>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    checks: [CheckResultSchema],
    summary: { type: String, required: true },
  },
  { timestamps: true }
);

export const Result = mongoose.model<IResult>("Result", ResultSchema);