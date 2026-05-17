import { blurCheck } from "./checks/blurCheck";
import { brightnessCheck } from "./checks/brightnessCheck";
import { dimensionCheck } from "./checks/dimensionCheck";
import { exifCheck } from "./checks/exifCheck";
import { numberPlateCheck } from "./checks/numberPlateCheck";
import { ICheckResult } from "../db/models/Result.model";

export interface AnalysisReport {
  checks: ICheckResult[];
  summary: string;
}

export const runAnalysis = async (filepath: string): Promise<AnalysisReport> => {
  console.log(`Running analysis on: ${filepath}`);

  // Run all checks in parallel
  const [blur, brightness, dimension, exif, plate] = await Promise.all([
    blurCheck(filepath),
    brightnessCheck(filepath),
    dimensionCheck(filepath),
    exifCheck(filepath),
    numberPlateCheck(filepath),
  ]);

  const checks = [blur, brightness, dimension, exif, plate];
  const failed = checks.filter((c) => !c.passed).map((c) => c.checkName);
  const passed = checks.filter((c) => c.passed).length;

  const summary =
    failed.length === 0
      ? `All ${checks.length} checks passed.`
      : `${passed}/${checks.length} checks passed. Issues: ${failed.join(", ")}`;

  return { checks, summary };
};