import sharp from "sharp";
import { ICheckResult } from "../../db/models/Result.model";

export const dimensionCheck = async (filepath: string): Promise<ICheckResult> => {
  try {
    const metadata = await sharp(filepath).metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    const MIN_WIDTH = 200;
    const MIN_HEIGHT = 200;

    const passed = width >= MIN_WIDTH && height >= MIN_HEIGHT;

    return {
      checkName: "dimension_check",
      passed,
      confidence: 1.0,
      details: passed
        ? `Image dimensions are valid: ${width}x${height}px`
        : `Image too small: ${width}x${height}px. Minimum is ${MIN_WIDTH}x${MIN_HEIGHT}px`,
    };
  } catch (error) {
    return {
      checkName: "dimension_check",
      passed: false,
      confidence: 0,
      details: `Check failed: ${error}`,
    };
  }
};