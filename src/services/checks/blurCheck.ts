import sharp from "sharp";
import { ICheckResult } from "../../db/models/Result.model";

export const blurCheck = async (filepath: string): Promise<ICheckResult> => {
  try {
    const { data, info } = await sharp(filepath)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Float32Array(data);
    const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;

    // Variance of pixel intensities — low variance = blurry
    const variance =
      pixels.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pixels.length;

    const BLUR_THRESHOLD = 500;
    const passed = variance >= BLUR_THRESHOLD;
    const confidence = Math.min(variance / 2000, 1);

    return {
      checkName: "blur_detection",
      passed,
      confidence: parseFloat(confidence.toFixed(2)),
      details: passed
        ? `Image is sharp. Variance: ${variance.toFixed(2)}`
        : `Image appears blurry. Variance: ${variance.toFixed(2)}`,
    };
  } catch (error) {
    return {
      checkName: "blur_detection",
      passed: false,
      confidence: 0,
      details: `Check failed: ${error}`,
    };
  }
};