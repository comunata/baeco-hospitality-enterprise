"use client";

import { useState, useTransition } from "react";
import { approvePlaceAction, rejectPlaceAction, restorePlaceAction, togglePinAction, deletePlaceAction, editPlaceAction } from "./actions";
import type { DiscoveredPlace } from "@/lib/discovery/types";

export function PlaceRowActions({ place }: { place: DiscoveredPlace }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const buttonBase = "text-xs uppercase tracking-wider disabled:opacity-40";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {place.status !== "approved" && (
          <button type="button" disabled={pending} onClick={() => startTransition(() => approvePlaceAction(place.id))} className={`${buttonBase} text-emerald hover:opacity-80`}>
            Aprobă
          </button>
        )}
        {place.status !== "rejected" && (
          <button type="button" disabled={pending} onClick={() => startTransition(() => rejectPlaceAction(place.id))} className={`${buttonBase} text-red-300 hover:text-red-200`}>
            Respinge
          </button>
        )}
        {place.status === "rejected" && (
          <button type="button" disabled={pending} onClick={() => startTransition(() => restorePlaceAction(place.id))} className={`${buttonBase} text-stone hover:text-ivory`}>
            Restaurează
          </button>
        )}
        {place.status === "approved" && (
          <button type="button" disabled={pending} onClick={() => startTransition(() => togglePinAction(place.id, !place.pinned))} className={`${buttonBase} text-champagne hover:opacity-80`}>
            {place.pinned ? "Anulează fixarea" : "Fixează în top"}
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => setEditing((v) => !v)} className={`${buttonBase} text-ivory/70 hover:text-ivory`}>
          {editing ? "Închide" : "Editează"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Ștergi definitiv acest loc?")) return;
            startTransition(() => deletePlaceAction(place.id));
          }}
          className={`${buttonBase} text-red-400/70 hover:text-red-300`}
        >
          Șterge
        </button>
      </div>

      {editing && (
        <form
          action={(formData) => {
            startTransition(async () => {
              await editPlaceAction(formData);
              setEditing(false);
            });
          }}
          className="space-y-2 rounded-sm border border-platinum/15 bg-midnight/50 p-3"
        >
          <input type="hidden" name="id" value={place.id} />
          <input name="name" defaultValue={place.name} required className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-2 py-1.5 text-xs text-ivory outline-none focus:border-champagne/60" placeholder="Nume" />
          <textarea name="descriptionRo" defaultValue={place.description.ro} rows={2} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-2 py-1.5 text-xs text-ivory outline-none focus:border-champagne/60" placeholder="Descriere (RO)" />
          <textarea name="descriptionEn" defaultValue={place.description.en} rows={2} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-2 py-1.5 text-xs text-ivory outline-none focus:border-champagne/60" placeholder="Description (EN)" />
          <input name="image" defaultValue={place.image} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-2 py-1.5 text-xs text-ivory outline-none focus:border-champagne/60" placeholder="URL imagine (opțional)" />
          <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-4 py-1.5 text-xs font-medium text-midnight disabled:opacity-50">
            Salvează
          </button>
        </form>
      )}
    </div>
  );
}
