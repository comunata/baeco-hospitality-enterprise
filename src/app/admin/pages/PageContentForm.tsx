"use client";

import { useActionState } from "react";
import Link from "next/link";
import { savePageAction, type PageFormState } from "./actions";
import type { PageContent } from "@/lib/data/seed/pages";

const initialState: PageFormState = {};

export function PageContentForm({ page }: { page: PageContent }) {
  const [state, formAction, pending] = useActionState(savePageAction, initialState);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="slug" value={page.slug} />

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">{state.error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Titlu (RO)" name="titleRo" defaultValue={page.title.ro} required />
        <Field label="Titlu (EN)" name="titleEn" defaultValue={page.title.en} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Subtitlu (RO)" name="subtitleRo" defaultValue={page.subtitle?.ro} />
        <Field label="Subtitlu (EN)" name="subtitleEn" defaultValue={page.subtitle?.en} />
      </div>

      <TextArea label="Conținut (RO)" name="bodyRo" defaultValue={page.body?.ro} rows={6} />
      <TextArea label="Conținut (EN)" name="bodyEn" defaultValue={page.body?.en} rows={6} />

      {page.slug === "gallery" ? (
        <p className="rounded-sm border border-platinum/15 bg-graphite/40 px-4 py-3 text-sm text-stone">
          Imaginile galeriei se gestionează acum din{" "}
          <Link href="/admin/gallery" className="text-champagne underline underline-offset-2 hover:opacity-80">
            modulul Galerie
          </Link>{" "}
          (upload, reordonare, titlu/ALT) — nu se mai editează ca listă de URL-uri aici.
        </p>
      ) : (
        <TextArea label="Galerie foto (câte un URL pe linie)" name="gallery" defaultValue={page.gallery.join("\n")} rows={5} />
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-6 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
          {pending ? "Se salvează…" : "Salvează pagina"}
        </button>
        <Link href="/admin/pages" className="rounded-sm border border-platinum/20 px-6 py-2.5 text-sm text-ivory hover:bg-platinum/5">
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
  ...rest
}: { label: string; name: string; defaultValue?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <input name={name} defaultValue={defaultValue} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" {...rest} />
    </label>
  );
}

function TextArea({ label, name, defaultValue, rows }: { label: string; name: string; defaultValue?: string; rows?: number }) {
  return (
    <label className="block text-sm text-ivory">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={rows ?? 3} className="w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
    </label>
  );
}
