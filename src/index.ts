import express from "express";
import { ENV } from "./config/env";
import { connectDB } from "./db/connect";
import uploadRoutes from "./api/routes/upload.routes";
import jobRoutes from "./api/routes/job.routes";
import { startWorker } from "./workers/imageWorker";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { logger } from "./utils/logger";

const app = express();
app.use(express.json());
app.use(requestLogger);                  // log all requests

// Routes
app.use("/api", uploadRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling — must be last
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  startWorker();
  app.listen(ENV.PORT, () => {
    logger.info(`Server running on port ${ENV.PORT}`);
  });
};

start();