import express from "express";
import { ENV } from "./config/env";
import { connectDB } from "./db/connect";
import uploadRoutes from "./api/routes/upload.routes";
import jobRoutes from "./api/routes/job.routes";      // ADD THIS
import { startWorker } from "./workers/imageWorker";

const app = express();
app.use(express.json());

app.use("/api", uploadRoutes);
app.use("/api/jobs", jobRoutes);                       // ADD THIS

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const start = async () => {
  await connectDB();
  startWorker();
  app.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
  });
};

start();