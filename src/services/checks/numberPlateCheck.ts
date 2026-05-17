import Tesseract from "tesseract.js";
import { ICheckResult } from "../../db/models/Result.model";

// Indian number plate formats:
// New: MH12AB1234
// Old: MH-12-AB-1234
const INDIAN_PLATE_REGEX =
  /^[A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,3}[\s-]?[0-9]{4}$/;

export const numberPlateCheck = async (filepath: string): Promise<ICheckResult> => {
  try {
    const { data } = await Tesseract.recognize(filepath, "eng", {
      logger: () => {}, // suppress tesseract logs
    });

    const rawText = data.text.trim();

    // Clean and extract candidate plate strings
    const lines = rawText
      .split("\n")
      .map((line) => line.replace(/\s+/g, "").toUpperCase().trim())
      .filter((line) => line.length >= 6 && line.length <= 13);

    const matchedPlate = lines.find((line) => INDIAN_PLATE_REGEX.test(line));

    if (matchedPlate) {
      return {
        checkName: "number_plate_check",
        passed: true,
        confidence: 0.85,
        details: `Valid Indian number plate detected: ${matchedPlate}`,
      };
    }

    // Partial match — text found but not a valid plate
    if (rawText.length > 0) {
      return {
        checkName: "number_plate_check",
        passed: false,
        confidence: 0.6,
        details: `Text found but no valid plate format: "${rawText.slice(0, 80)}"`,
      };
    }

    return {
      checkName: "number_plate_check",
      passed: false,
      confidence: 0.5,
      details: "No text detected in image.",
    };
  } catch (error) {
    return {
      checkName: "number_plate_check",
      passed: false,
      confidence: 0,
      details: `Check failed: ${error}`,
    };
  }
};