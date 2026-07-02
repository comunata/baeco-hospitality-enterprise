"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MediaItem, MediaOwnerType } from "@/lib/data/media";
import { setPrimaryMediaAction, reorderMediaAction, deleteMediaAction, updateMediaMetaAction } from "./actions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_MB = 8;

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Reusable image manager: drag&drop/click upload (multi-file, auto WebP
 * conversion server-side), thumbnail grid with native drag-reorder, a
 * primary-image toggle, and a detail panel for title/ALT text (RO+EN) +
 * delete-with-confirm. Used by both the site Gallery (ownerType="gallery")
 * and per-room image sets (ownerType="room", ownerId=room.id) — the only
 * thing that differs between owners is which record their uploads/edits
 * attach to and which public page gets revalidated (see ./actions.ts).
 */
export function MediaManager({
  ownerType,
  ownerId = null,
  initialImages,
}: {
  ownerType: MediaOwnerType;
  ownerId?: string | null;
  initialImages: MediaItem[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  // Re-sync local (optimistic-reorder) state when the server gives us a
  // fresh images list after router.refresh() — adjusted during render
  // rather than via an effect, per React's guidance for resetting state
  // when a prop changes (avoids an extra cascading render).
  const [syncedFrom, setSyncedFrom] = useState(initialImages);
  if (initialImages !== syncedFrom) {
    setSyncedFrom(initialImages);
    setImages(initialImages);
  }
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOverDropzone, setDragOverDropzone] = useState(false);
  const [dragImageId, setDragImageId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<Array<{ name: string; error: string }>>([]);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = images.find((img) => img.id === selectedId) ?? null;

  function validateFilesClientSide(files: File[]): { valid: File[]; errors: Array<{ name: string; error: string }> } {
    const valid: File[] = [];
    const errors: Array<{ name: string; error: string }> = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push({ name: file.name, error: "Tip de fișier neacceptat (doar JPG, PNG, WebP)." });
        continue;
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        errors.push({ name: file.name, error: `Fișier prea mare (max ${MAX_FILE_MB} MB).` });
        continue;
      }
      valid.push(file);
    }
    return { valid, errors };
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const { valid, errors } = validateFilesClientSide(files);
    setUploadErrors(errors);
    if (valid.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("ownerType", ownerType);
      if (ownerId) formData.append("ownerId", ownerId);
      valid.forEach((file) => formData.append("files", file));
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({ created: [], errors: [{ name: "?", error: "Răspuns invalid de la server." }] }));
      if (data.errors?.length) setUploadErrors((prev) => [...prev, ...data.errors]);
      router.refresh();
    } catch {
      setUploadErrors((prev) => [...prev, { name: "upload", error: "Încărcarea a eșuat. Verifică conexiunea și încearcă din nou." }]);
    } finally {
      setUploading(false);
    }
  }

  function handleDropzoneDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverDropzone(false);
    if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
  }

  function handleCardDragStart(id: string) {
    setDragImageId(id);
  }

  function handleCardDrop(targetId: string) {
    if (!dragImageId || dragImageId === targetId) {
      setDragImageId(null);
      return;
    }
    const current = [...images];
    const fromIndex = current.findIndex((img) => img.id === dragImageId);
    const toIndex = current.findIndex((img) => img.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragImageId(null);
      return;
    }
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setImages(current);
    setDragImageId(null);
    startTransition(() => {
      reorderMediaAction(ownerType, ownerId, current.map((img) => img.id)).then(() => router.refresh());
    });
  }

  function handleSetPrimary(id: string) {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
    startTransition(() => {
      setPrimaryMediaAction(ownerType, ownerId, id).then(() => router.refresh());
    });
  }

  function handleDelete(id: string) {
    const image = images.find((img) => img.id === id);
    if (!image) return;
    const label = image.title.ro || image.title.en || "această imagine";
    if (!confirm(`Sigur ștergi ${label}? Această acțiune nu poate fi anulată.`)) return;
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedId === id) setSelectedId(null);
    startTransition(() => {
      deleteMediaAction(ownerType, ownerId, id).then(() => router.refresh());
    });
  }

  return (
    <div className="space-y-8">
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverDropzone(true);
        }}
        onDragLeave={() => setDragOverDropzone(false)}
        onDrop={handleDropzoneDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragOverDropzone ? "border-champagne bg-champagne/5" : "border-platinum/20 hover:border-platinum/40"
        }`}
      >
        <p className="font-display text-lg text-ivory">Trage imagini aici sau click pentru a selecta</p>
        <p className="text-xs text-stone">JPG, PNG sau WebP · max {MAX_FILE_MB} MB per fișier · upload multiplu</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading && <p className="mt-2 text-xs uppercase tracking-widest text-champagne">Se încarcă și optimizează…</p>}
      </div>

      {uploadErrors.length > 0 && (
        <div className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {uploadErrors.map((err, i) => (
            <p key={i}>
              {err.name}: {err.error}
            </p>
          ))}
        </div>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-stone">Nicio imagine încă. Adaugă prima imagine mai sus.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleCardDragStart(image.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleCardDrop(image.id)}
              onClick={() => setSelectedId(image.id)}
              className={`group relative cursor-move overflow-hidden rounded-sm border transition-colors ${
                selectedId === image.id ? "border-champagne" : "border-platinum/10 hover:border-platinum/30"
              } ${dragImageId === image.id ? "opacity-40" : ""}`}
            >
              <div className="relative aspect-square">
                <Image src={image.url} alt={image.alt.ro || image.alt.en || "Imagine"} fill sizes="25vw" className="object-cover" />
              </div>
              {image.isPrimary && (
                <span className="absolute left-2 top-2 rounded-full bg-champagne px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-midnight">
                  Principală
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-midnight/80 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(image.id);
                  }}
                  className="text-[10px] uppercase tracking-wider text-champagne hover:opacity-80"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(image.id);
                  }}
                  className="text-[10px] uppercase tracking-wider text-red-300 hover:text-red-200"
                >
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <ImageEditorPanel
          key={selected.id}
          image={selected}
          ownerType={ownerType}
          ownerId={ownerId}
          pending={pending}
          onClose={() => setSelectedId(null)}
          onSetPrimary={() => handleSetPrimary(selected.id)}
          onDelete={() => handleDelete(selected.id)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function ImageEditorPanel({
  image,
  ownerType,
  ownerId,
  pending,
  onClose,
  onSetPrimary,
  onDelete,
  onSaved,
}: {
  image: MediaItem;
  ownerType: MediaOwnerType;
  ownerId: string | null;
  pending: boolean;
  onClose: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formData: FormData) {
    setSaving(true);
    setError(null);
    const result = await updateMediaMetaAction({}, formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="rounded-sm border border-champagne/30 bg-graphite/60 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne">Editare imagine</p>
        <button type="button" onClick={onClose} className="text-xs text-stone hover:text-ivory">
          Închide
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-sm border border-platinum/10">
          <Image src={image.url} alt={image.alt.ro || image.alt.en || "Imagine"} fill sizes="220px" className="object-cover" />
        </div>

        <div className="space-y-4">
          <form action={handleSave} className="space-y-4">
            <input type="hidden" name="id" value={image.id} />
            <input type="hidden" name="ownerType" value={ownerType} />
            {ownerId && <input type="hidden" name="ownerId" value={ownerId} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Titlu (RO)" name="titleRo" defaultValue={image.title.ro} />
              <TextField label="Titlu (EN)" name="titleEn" defaultValue={image.title.en} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Text ALT (RO)" name="altRo" defaultValue={image.alt.ro} />
              <TextField label="Text ALT (EN)" name="altEn" defaultValue={image.alt.en} />
            </div>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="rounded-sm bg-champagne px-5 py-2 text-xs font-medium uppercase tracking-widest text-midnight hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Se salvează…" : "Salvează"}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-4 border-t border-platinum/10 pt-4 text-xs text-stone">
            {image.width && image.height && (
              <span>
                {image.width}×{image.height}px
              </span>
            )}
            {image.sizeBytes && <span>{formatSize(image.sizeBytes)}</span>}
            <span>WebP</span>
            <button
              type="button"
              disabled={image.isPrimary || pending}
              onClick={onSetPrimary}
              className="ml-auto rounded-sm border border-platinum/20 px-3 py-1.5 uppercase tracking-widest text-champagne hover:bg-champagne/10 disabled:opacity-40"
            >
              {image.isPrimary ? "Este imaginea principală" : "Setează ca principală"}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-sm border border-red-400/30 px-3 py-1.5 uppercase tracking-widest text-red-300 hover:bg-red-400/10"
            >
              Șterge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60"
      />
    </label>
  );
}
