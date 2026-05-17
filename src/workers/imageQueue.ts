import { Queue } from "bullmq";
import { ENV } from "../config/env";

export const imageQueue = new Queue("image-processing", {
  connection: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3,                // retry up to 3 times on failure
    backoff: {
      type: "exponential",
      delay: 3000,              // wait 3s, then 6s, then 12s
    },
    removeOnComplete: false,    // keep completed jobs for debugging
    removeOnFail: false,        // keep failed jobs for inspection
  },
});