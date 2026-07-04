import "server-only";

/**
 * Server-side validate + store pipeline for admin image uploads
 * (currently used by the Gallery module).
 *
 * NOTE: this used to convert every upload to WebP via `sharp`. That was
 * removed because `sharp` ships a native (libvips) binary that cannot run
 * in the Cloudflare Workers runtime (workerd has no support for native
 * Node addons) — the OpenNext/Cloudflare build failed trying to resolve
 * it. Uploads are now stored as-is, in their original format. If
 * server-side re-encoding is needed again in the future, it must go
 * through a Workers-compatible (WASM) image library instead of `sharp`.
 */

export const ALLOWED_UPLOAD_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type UploadValidationError = "invalid_type" | "too_large" | "empty_file";

export function validateUpload(file: { type: string; size: number }): UploadValidationError | null {
  if (file.size <= 0) return "empty_file";
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) return "invalid_type";
  if (file.size > MAX_UPLOAD_BYTES) return "too_large";
  return null;
}

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  extension: string;
  width: null;
  height: null;
  sizeBytes: number;
}

/**
 * Stores the upload unmodified — no resize, no re-encode, no dimension
 * probing (that required decoding the image, which was also `sharp`'s
 * job). width/height are persisted as null; callers/UI must treat them
 * as optional.
 */
export async function processImageUpload(input: Buffer, mimeType: string): Promise<ProcessedImage> {
  return {
    buffer: input,
    contentType: mimeType,
    extension: EXTENSION_BY_MIME[mimeType] ?? "bin",
    width: null,
    height: null,
    sizeBytes: input.length,
  };
}
