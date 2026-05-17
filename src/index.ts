import express from "express";
import { ENV } from "./config/env";
import { connectDB } from "./db/connect";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const start = async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`Server running on port ${ENV.PORT}`);
  });
};

start();