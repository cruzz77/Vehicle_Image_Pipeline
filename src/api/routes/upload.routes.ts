import { Router, Request, Response } from "express";
import { upload } from "../../config/multer";
import { Job } from "../../db/models/Job.model";
import { imageQueue } from "../../workers/imageQueue";

const router = Router();

router.post("/upload", upload.single("image"), async (req: Request, res: Response): Promise<void> => {
    try {
      // No file uploaded
      if (!req.file) {
        res.status(400).json({ success: false, message: "No image file provided" });
        return;
      }

      // Save job to DB
      const job = await Job.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filepath: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        status: "pending",
      });

      // Push to BullMQ queue
      await imageQueue.add("process-image", {
        jobId: job._id.toString(),
        filepath: req.file.path,
      });

      res.status(201).json({
        success: true,
        message: "Image uploaded successfully. Processing started.",
        data: {
          jobId: job._id,
          filename: job.originalName,
          status: job.status,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  }
);

export default router;