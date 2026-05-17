import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/vehicle_pipeline",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379"),
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
};
