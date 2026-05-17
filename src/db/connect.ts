import mongoose from "mongoose";
import { ENV } from "../config/env";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};