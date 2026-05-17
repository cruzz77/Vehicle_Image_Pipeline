import { Worker } from "bullmq";
import { ENV } from "../config/env";
import { Job } from "../db/models/Job.model";
import { Result } from "../db/models/Result.model";
import { runAnalysis } from "../services/analysisRunner";

export const startWorker = () => {
  const worker = new Worker(
    "image-processing",
    async (job) => {
      const { jobId, filepath } = job.data;
      console.log(`Processing job: ${jobId}`);

      // Mark as processing
      await Job.findByIdAndUpdate(jobId, { status: "processing" });

      // Run all analysis checks
      const { checks, summary } = await runAnalysis(filepath);

      // Save results
      await Result.create({ jobId, checks, summary });

      // Mark as completed
      await Job.findByIdAndUpdate(jobId, { status: "completed" });

      console.log(`Job ${jobId} completed. Summary: ${summary}`);
    },
    {
      connection: {
        host: ENV.REDIS_HOST,
        port: ENV.REDIS_PORT,
      },
    }
  );

  worker.on("failed", async (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
    if (job?.data?.jobId) {
      await Job.findByIdAndUpdate(job.data.jobId, {
        status: "failed",
        failureReason: err.message,
      });
    }
  });

  console.log("Image processing worker started");
  return worker;
};