import express from "express";
import { ENV } from "./config/env";
import { connectDB } from "./db/connect";
import uploadRoutes from "./api/routes/upload.routes";
import { startWorker } from "./workers/imageWorker";  // ADD THIS

const app = express();
app.use(express.json());

app.use("/api", uploadRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const start = async () => {
  await connectDB();
  startWorker();                                        // ADD THIS
  app.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
  });
};

start();