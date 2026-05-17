import { blurCheck } from "./checks/blurCheck";
import { brightnessCheck } from "./checks/brightnessCheck";
import { dimensionCheck } from "./checks/dimensionCheck";
import { exifCheck } from "./checks/exifCheck";
import { numberPlateCheck } from "./checks/numberPlateCheck";
import { ICheckResult } from "../db/models/Result.model";
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import os from "os";

export interface AnalysisReport {
  checks: ICheckResult[];
  summary: string;
}

// Download remote URL to a temp local file
const downloadToTemp = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(url.split("?")[0]) || ".jpg";
    const tmpPath = path.join(os.tmpdir(), `img_${Date.now()}${ext}`);
    const file = fs.createWriteStream(tmpPath);
    const protocol = url.startsWith("https") ? https : http;

    protocol.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(tmpPath);
      });
    }).on("error", (err) => {
      fs.unlink(tmpPath, () => {});
      reject(err);
    });
  });
};

export const runAnalysis = async (filepath: string): Promise<AnalysisReport> => {
  console.log(`Running analysis on: ${filepath}`);

  // If filepath is a URL, download it to a temp file first
  let localPath = filepath;
  let isTempFile = false;

  if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
    localPath = await downloadToTemp(filepath);
    isTempFile = true;
  }

  try {
    const [blur, brightness, dimension, exif, plate] = await Promise.all([
      blurCheck(localPath),
      brightnessCheck(localPath),
      dimensionCheck(localPath),
      exifCheck(localPath),
      numberPlateCheck(localPath),
    ]);

    const checks = [blur, brightness, dimension, exif, plate];
    const failed = checks.filter((c) => !c.passed).map((c) => c.checkName);
    const passed = checks.filter((c) => c.passed).length;

    const summary =
      failed.length === 0
        ? `All ${checks.length} checks passed.`
        : `${passed}/${checks.length} checks passed. Issues: ${failed.join(", ")}`;

    return { checks, summary };
  } finally {
    // Clean up temp file
    if (isTempFile && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
};