"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveServiceAction, type ServiceFormState } from "./actions";
import type { ExtraService } from "@/lib/types";

const initialState: ServiceFormState = {};

const chargeTypeOptions: { value: ExtraService["chargeType"]; label: string }[] = [
  { value: "per_person", label: "Per persoană" },
  { value: "per_room", label: "Per cameră" },
  { value: "per_booking", label: "Per rezervare" },
  { value: "per_night", label: "Per noapte" },
];

export function ServiceForm({ service }: { service?: ExtraService }) {
  const [state, formAction, pending] = useActionState(saveServiceAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {service?.id && <input type="hidden" name="id" value={service.id} />}

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nume (RO)" name="nameRo" defaultValue={service?.name.ro} error={state.fieldErrors?.nameRo} required />
        <Field label="Nume (EN)" name="nameEn" defaultValue={service?.name.en} />
      </div>

      <TextArea label="Descriere (RO)" name="descriptionRo" defaultValue={service?.description.ro} />
      <TextArea label="Descriere (EN)" name="descriptionEn" defaultValue={service?.description.en} />

      <Field label="Slug (opțional)" name="slug" defaultValue={service?.slug} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Preț (EUR)" name="price" type="number" step="0.01" min={0} defaultValue={service?.price ?? 0} required />
        <label className="block text-sm text-ivory">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Mod de taxare</span>
          <select
            name="chargeType"
            defaultValue={service?.chargeType ?? "per_booking"}
            className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60"
          >
            {chargeTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Disponibil de la (opțional)" name="availableFrom" type="date" defaultValue={service?.availableFrom} />
        <Field label="Disponibil până la (opțional)" name="availableTo" type="date" defaultValue={service?.availableTo} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ivory">
        <input type="checkbox" name="activeCheckbox" value="true" defaultChecked={service?.active ?? true} className="h-4 w-4 rounded-sm border-platinum/30 bg-graphite" />
        Serviciu activ (vizibil pe site)
      </label>

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează serviciul"}
        </button>
        <Link href="/admin/services" className="rounded-sm border border-platinum/20 px-6 py-2.5 text-sm text-ivory hover:bg-platinum/5">
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
