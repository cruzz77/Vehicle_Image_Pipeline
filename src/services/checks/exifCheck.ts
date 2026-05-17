import exifr from "exifr";
import { ICheckResult } from "../../db/models/Result.model";

export const exifCheck = async (filepath: string): Promise<ICheckResult> => {
  try {
    const exif = await exifr.parse(filepath);

    // Screenshots and photo-of-photos typically have no EXIF data
    if (!exif) {
      return {
        checkName: "exif_check",
        passed: false,
        confidence: 0.75,
        details: "No EXIF data found. Image may be a screenshot or edited.",
      };
    }

    const hasCamera = !!(exif.Make || exif.Model);
    const hasGPS = !!(exif.latitude || exif.longitude);
    const hasSoftware = !!exif.Software;

    // If edited with software like Photoshop, flag it
    const suspiciousSoftware =
      hasSoftware &&
      ["photoshop", "gimp", "lightroom", "snapseed"].some((s) =>
        exif.Software?.toLowerCase().includes(s)
      );

    const passed = hasCamera && !suspiciousSoftware;

    let details = "";
    if (hasCamera) details += `Camera: ${exif.Make || ""} ${exif.Model || ""}. `;
    if (hasGPS) details += `GPS data present. `;
    if (suspiciousSoftware) details += `Edited with: ${exif.Software}. `;
    if (!hasCamera) details += "No camera metadata found. ";

    return {
      checkName: "exif_check",
      passed,
      confidence: hasCamera ? 0.85 : 0.7,
      details: details.trim(),
    };
  } catch (error) {
    return {
      checkName: "exif_check",
      passed: false,
      confidence: 0,
      details: `Check failed: ${error}`,
    };
  }
};