import "server-only";
import sharp from "sharp";

/**
 * Server-side validate + convert-to-WebP + optimize pipeline for admin
 * image uploads (currently used by the Gallery module). Every uploaded
 * image is normalized to WebP, auto-oriented, capped at a sane max
 * dimension (no upscaling), and re-encoded at a quality that keeps files
 * small without visible loss — the admin never has to think about format
 * or size.
 */

export const ALLOWED_UPLOAD_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB pre-conversion
const MAX_DIMENSION = 2600;
const WEBP_QUALITY = 82;

export type UploadValidationError = "invalid_type" | "too_large" | "empty_file";

export function validateUpload(file: { type: string; size: number }): UploadValidationError | null {
  if (file.size <= 0) return "empty_file";
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) return "invalid_type";
  if (file.size > MAX_UPLOAD_BYTES) return "too_large";
  return null;
}

export interface ProcessedImage {
  buffer: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
}

export async function processImageToWebp(input: Buffer): Promise<ProcessedImage> {
  const buffer = await sharp(input, { failOn: "none" })
    .rotate() // auto-orient from EXIF before stripping metadata
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const metadata = await sharp(buffer).metadata();
  return {
    buffer,
    contentType: "image/webp",
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    sizeBytes: buffer.length,
  };
}
