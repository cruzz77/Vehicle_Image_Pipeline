import mongoose from "mongoose";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error({ error }, "MongoDB connection failed");
    process.exit(1);
  }
};