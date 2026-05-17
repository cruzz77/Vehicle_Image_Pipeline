import sharp from "sharp";
import { ICheckResult } from "../../db/models/Result.model";

export const brightnessCheck = async (filepath: string): Promise<ICheckResult> => {
  try {
    const stats = await sharp(filepath).stats();

    // Mean brightness across all channels (0-255)
    const meanBrightness =
      stats.channels.reduce((sum, ch) => sum + ch.mean, 0) /
      stats.channels.length;

    const TOO_DARK = 40;
    const TOO_BRIGHT = 220;

    const passed = meanBrightness >= TOO_DARK && meanBrightness <= TOO_BRIGHT;
    const confidence = passed
      ? parseFloat((1 - Math.abs(meanBrightness - 128) / 128).toFixed(2))
      : 0.9;

    let details = "";
    if (meanBrightness < TOO_DARK) {
      details = `Image is too dark. Mean brightness: ${meanBrightness.toFixed(2)}`;
    } else if (meanBrightness > TOO_BRIGHT) {
      details = `Image is overexposed. Mean brightness: ${meanBrightness.toFixed(2)}`;
    } else {
      details = `Brightness is acceptable. Mean brightness: ${meanBrightness.toFixed(2)}`;
    }

    return {
      checkName: "brightness_check",
      passed,
      confidence,
      details,
    };
  } catch (error) {
    return {
      checkName: "brightness_check",
      passed: false,
      confidence: 0,
      details: `Check failed: ${error}`,
    };
  }
};