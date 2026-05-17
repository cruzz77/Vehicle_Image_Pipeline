import { Worker } from "bullmq";
import { ENV } from "../config/env";
import { Job } from "../db/models/Job.model";
import { Result } from "../db/models/Result.model";
import { runAnalysis } from "../services/analysisRunner";
import { logger } from "../utils/logger";              // ADD THIS

export const startWorker = () => {
  const worker = new Worker(
    "image-processing",
    async (job) => {
      const { jobId, filepath } = job.data;
      logger.info({ jobId }, "Processing job started");   // UPDATED

      await Job.findByIdAndUpdate(jobId, { status: "processing" });

      const { checks, summary } = await runAnalysis(filepath);

      await Result.create({ jobId, checks, summary });

      await Job.findByIdAndUpdate(jobId, { status: "completed" });

      logger.info({ jobId, summary }, "Job completed");   // UPDATED
    },
    {
    connection: {
      host: ENV.REDIS_HOST,
      port: ENV.REDIS_PORT,
      password: ENV.REDIS_PASSWORD,
      tls: {},                        
    },
    }
  );

  worker.on("failed", async (job, err) => {
    logger.error({ jobId: job?.data?.jobId, err: err.message }, "Job failed");  // UPDATED
    if (job?.data?.jobId) {
      await Job.findByIdAndUpdate(job.data.jobId, {
        status: "failed",
        failureReason: err.message,
      });
    }
  });

  logger.info("Image processing worker started");         // UPDATED
  return worker;
};