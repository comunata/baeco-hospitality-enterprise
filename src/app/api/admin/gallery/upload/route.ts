import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { assertAdminRole } from "@/lib/admin/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateUpload, processImageToWebp } from "@/lib/media/imagePipeline";
import { createGalleryImageRecord } from "@/lib/data/gallery";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const MAX_FILES_PER_REQUEST = 20;

/**
 * Multi-file gallery upload: validate -> convert to optimized WebP -> store
 * -> persist a gallery_images record, per file. Files are processed
 * independently so one bad file doesn't fail the whole batch.
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "admin-gallery-upload", { maxRequests: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    await assertAdminRole("owner", "manager", "staff");
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "no_files" }, { status: 400 });
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: "too_many_files", max: MAX_FILES_PER_REQUEST }, { status: 400 });
  }

  const created: Awaited<ReturnType<typeof createGalleryImageRecord>>[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  for (const file of files) {
    const validationError = validateUpload({ type: file.type, size: file.size });
    if (validationError) {
      errors.push({ name: file.name, error: validationError });
      continue;
    }

    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const processed = await processImageToWebp(inputBuffer);
      const filename = `${randomUUID()}.webp`;

      let url: string;
      let storagePath: string | null = null;

      if (isSupabaseConfigured()) {
        const admin = createAdminClient();
        if (!admin) throw new Error("storage_unavailable");
        const objectPath = `gallery/${filename}`;
        const { error: uploadError } = await admin.storage.from("gallery").upload(objectPath, processed.buffer, {
          contentType: processed.contentType,
          upsert: false,
        });
        if (uploadError) throw new Error(uploadError.message);
        const { data: publicUrlData } = admin.storage.from("gallery").getPublicUrl(objectPath);
        url = publicUrlData.publicUrl;
        storagePath = objectPath;
      } else {
        // Local/dev fallback only. Netlify's production filesystem is
        // ephemeral per function invocation and isn't served by the CDN,
        // so this path can never work in production — it exists purely so
        // the full upload/preview/reorder/delete flow can be exercised
        // end-to-end without a configured Supabase project.
        const dir = path.join(process.cwd(), "public", "uploads", "gallery");
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, filename), processed.buffer);
        url = `/uploads/gallery/${filename}`;
      }

      const record = await createGalleryImageRecord({
        url,
        storagePath,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
      });
      created.push(record);
    } catch (err) {
      errors.push({ name: file.name, error: err instanceof Error ? err.message : "upload_failed" });
    }
  }

  return NextResponse.json({ created, errors });
}
