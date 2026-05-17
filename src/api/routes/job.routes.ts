import { Router, Request, Response } from "express";
import { Job } from "../../db/models/Job.model";
import { Result } from "../../db/models/Result.model";

const router = Router();

// GET /api/jobs/:jobId/status
router.get("/:jobId/status", async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await Job.findById(req.params.jobId).select(
        "status filename originalName createdAt updatedAt failureReason"
      );

      if (!job) {
        res.status(404).json({ success: false, message: "Job not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          jobId: job._id,
          filename: job.originalName,
          status: job.status,
          ...(job.failureReason && { failureReason: job.failureReason }),
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch status" });
    }
  }
);

// GET /api/jobs/:jobId/results
router.get("/:jobId/results", async (req: Request, res: Response): Promise<void> => {
    try {
      const job = await Job.findById(req.params.jobId).select(
        "status originalName createdAt"
      );

      if (!job) {
        res.status(404).json({ success: false, message: "Job not found" });
        return;
      }

      // Results only available when completed
      if (job.status !== "completed") {
        res.status(200).json({
          success: true,
          message: `Job is currently ${job.status}. Results not yet available.`,
          data: {
            jobId: job._id,
            status: job.status,
          },
        });
        return;
      }

      const result = await Result.findOne({ jobId: req.params.jobId });

      if (!result) {
        res.status(404).json({ success: false, message: "Results not found" });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          jobId: job._id,
          filename: job.originalName,
          status: job.status,
          summary: result.summary,
          checks: result.checks,
          processedAt: result.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch results" });
    }
  }
);

// GET /api/jobs — list all jobs with pagination
router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        Job.find()
          .select("status originalName createdAt updatedAt")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Job.countDocuments(),
      ]);

      res.status(200).json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch jobs" });
    }
  }
);

export default router;