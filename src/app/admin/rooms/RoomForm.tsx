"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveRoomAction, type RoomFormState } from "./actions";
import type { Room } from "@/lib/types";

const initialState: RoomFormState = {};

export function RoomForm({ room }: { room?: Room }) {
  const [state, formAction, pending] = useActionState(saveRoomAction, initialState);

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      {room?.id && <input type="hidden" name="id" value={room.id} />}

      {state.error && (
        <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>
      )}

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Denumire</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nume (RO)" name="nameRo" defaultValue={room?.name.ro} error={state.fieldErrors?.nameRo} required />
          <Field label="Nume (EN)" name="nameEn" defaultValue={room?.name.en} />
        </div>
        <Field label="Slug (opțional, generat automat din nume)" name="slug" defaultValue={room?.slug} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Descriere</legend>
        <TextArea label="Descriere (RO)" name="descriptionRo" defaultValue={room?.description.ro} />
        <TextArea label="Descriere (EN)" name="descriptionEn" defaultValue={room?.description.en} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Capacitate & preț</legend>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Adulți max" name="maxAdults" type="number" min={1} defaultValue={room?.maxAdults ?? 2} required />
          <Field label="Copii max" name="maxChildren" type="number" min={0} defaultValue={room?.maxChildren ?? 0} required />
          <Field label="Suprafață (m²)" name="sizeSqm" type="number" min={0} defaultValue={room?.sizeSqm ?? 20} required />
          <Field label="Preț de bază (EUR/noapte)" name="basePrice" type="number" min={0} step="0.01" defaultValue={room?.basePrice ?? 100} required />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Paturi & facilități</legend>
        <TextArea label="Paturi (câte o linie)" name="beds" defaultValue={room?.beds.join("\n")} placeholder={"1 pat king size\n2 paturi single"} />
        <TextArea label="Facilități / amenities (câte o linie)" name="amenities" defaultValue={room?.amenities.join("\n")} placeholder={"Aer condiționat\nMinibar\nWi-Fi"} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Galerie foto</legend>
        <TextArea label="URL-uri imagini (câte o linie, prima devine imaginea principală dacă nu setezi una separat)" name="gallery" defaultValue={room?.gallery.join("\n")} placeholder={"https://.../foto1.jpg\nhttps://.../foto2.jpg"} />
        <Field label="Imagine principală (cover, opțional)" name="coverImage" defaultValue={room?.coverImage} />
        <Field label="URL tur virtual (opțional)" name="virtualTourUrl" defaultValue={room?.virtualTourUrl} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Reguli</legend>
        <TextArea label="Reguli (RO)" name="rulesRo" defaultValue={room?.rules.ro} />
        <TextArea label="Reguli (EN)" name="rulesEn" defaultValue={room?.rules.en} />
      </fieldset>

      <fieldset>
        <label className="flex items-center gap-2 text-sm text-ivory">
          <input type="checkbox" name="activeCheckbox" value="true" defaultChecked={room?.active ?? true} className="h-4 w-4 rounded-sm border-platinum/30 bg-graphite" />
          Cameră activă (vizibilă pe site)
        </label>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-medium text-midnight transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Se salvează…" : "Salvează camera"}
        </button>
        <Link href="/admin/rooms" className="rounded-sm border border-platinum/20 px-6 py-2.5 text-sm text-ivory hover:bg-platinum/5">
          Anulează
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  ...rest
}: { label: string; name: string; defaultValue?: string | number; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60"
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60"
      />
    </label>
  );
}
