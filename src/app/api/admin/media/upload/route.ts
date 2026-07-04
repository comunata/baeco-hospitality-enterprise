import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateUpload, processImageUpload } from "@/lib/media/imagePipeline";
import { createMediaItemRecord, type MediaOwnerType } from "@/lib/data/media";
import { getRoomById } from "@/lib/data/rooms";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const MAX_FILES_PER_REQUEST = 20;
const OWNER_TYPES: MediaOwnerType[] = ["gallery", "room"];

/** Mirrors revalidateOwner in components/admin/media/actions.ts — the
 * upload route mutates the same owner records but runs outside that
 * Server Action module, so it needs its own revalidation call. */
async function revalidateOwner(ownerType: MediaOwnerType, ownerId: string | null): Promise<void> {
  if (ownerType === "gallery") {
    revalidatePath("/admin/gallery");
    revalidatePath("/ro/gallery");
    revalidatePath("/en/gallery");
    return;
  }
  if (ownerType === "room" && ownerId) {
    revalidatePath("/admin/rooms");
    revalidatePath(`/admin/rooms/${ownerId}/edit`);
    revalidatePath("/ro/rooms");
    revalidatePath("/en/rooms");
    revalidatePath("/ro");
    revalidatePath("/en");
    const room = await getRoomById(ownerId);
    if (room) {
      revalidatePath(`/ro/rooms/${room.slug}`);
      revalidatePath(`/en/rooms/${room.slug}`);
    }
  }
}

/**
 * Generic multi-file image upload, shared by every "managed image set" in
 * the admin (the site Gallery and per-room image sets): validate ->
 * convert to optimized WebP -> store -> persist a media_items record, per
 * file. Files are processed independently so one bad file doesn't fail
 * the whole batch.
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, "admin-media-upload", { maxRequests: 30, windowMs: 60_000 });
  if (limited) return limited;

  try {
    await assertAdminRole("HOTEL_ADMIN");
  } catch (err) {
    const message = err instanceof Error ? err.message : "forbidden";
    // MediaManager reads `data.errors` (an array), not `data.error` — match
    // that shape so a blocked Demo Admin upload shows the real message
    // instead of silently doing nothing.
    return NextResponse.json({ created: [], errors: [{ name: "acces", error: message }] }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });

  const ownerTypeRaw = String(formData.get("ownerType") ?? "gallery");
  if (!OWNER_TYPES.includes(ownerTypeRaw as MediaOwnerType)) {
    return NextResponse.json({ error: "invalid_owner_type" }, { status: 400 });
  }
  const ownerType = ownerTypeRaw as MediaOwnerType;
  const ownerIdRaw = formData.get("ownerId");
  const ownerId = typeof ownerIdRaw === "string" && ownerIdRaw.trim() ? ownerIdRaw.trim() : null;
  if (ownerType === "room" && !ownerId) {
    return NextResponse.json({ error: "owner_id_required" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "no_files" }, { status: 400 });
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: "too_many_files", max: MAX_FILES_PER_REQUEST }, { status: 400 });
  }

  const storagePrefix = ownerType === "room" ? `rooms/${ownerId}` : "gallery";
  const localDir = ownerType === "room" ? path.join("uploads", "rooms", ownerId as string) : path.join("uploads", "gallery");

  const created: Awaited<ReturnType<typeof createMediaItemRecord>>[] = [];
  const errors: Array<{ name: string; error: string }> = [];

  for (const file of files) {
    const validationError = validateUpload({ type: file.type, size: file.size });
    if (validationError) {
      errors.push({ name: file.name, error: validationError });
      continue;
    }

    try {
      const inputBuffer = Buffer.from(await file.arrayBuffer());
      const processed = await processImageUpload(inputBuffer, file.type);
      const filename = `${randomUUID()}.${processed.extension}`;

      let url: string;
      let storagePath: string | null = null;

      if (isSupabaseConfigured()) {
        const admin = createAdminClient();
        if (!admin) throw new Error("storage_unavailable");
        const objectPath = `${storagePrefix}/${filename}`;
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
        const dir = path.join(process.cwd(), "public", localDir);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, filename), processed.buffer);
        url = `/${localDir.split(path.sep).join("/")}/${filename}`;
      }

      const record = await createMediaItemRecord(ownerType, ownerId, {
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

  if (created.length > 0) {
    await revalidateOwner(ownerType, ownerId);
  }

  return NextResponse.json({ created, errors });
}
