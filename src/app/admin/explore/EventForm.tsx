"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveEventAction, type EventFormState } from "./actions";
import type { LocalEvent } from "@/lib/types";

const initialState: EventFormState = {};

export function EventForm({ event }: { event?: LocalEvent }) {
  const [state, formAction, pending] = useActionState(saveEventAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {event?.id && <input type="hidden" name="id" value={event.id} />}

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nume (RO)" name="nameRo" defaultValue={event?.name.ro} error={state.fieldErrors?.nameRo} required />
        <Field label="Nume (EN)" name="nameEn" defaultValue={event?.name.en} />
      </div>

      <TextArea label="Descriere (RO)" name="descriptionRo" defaultValue={event?.description.ro} />
      <TextArea label="Descriere (EN)" name="descriptionEn" defaultValue={event?.description.en} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data" name="date" type="date" defaultValue={event?.date} error={state.fieldErrors?.date} required />
        <Field label="Locație" name="location" defaultValue={event?.location} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează evenimentul"}
        </button>
        <Link href="/admin/events" className="rounded-sm border border-platinum/20 px-6 py-2.5 text-sm text-ivory hover:bg-platinum/5">
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
      <input name={name} defaultValue={defaultValue} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" {...rest} />
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={3} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
    </label>
  );
}
