"use client";

import { useActionState } from "react";
import { savePropertyContactAction, type PropertyContactFormState } from "./actions";
import type { PropertyContactInfo } from "@/lib/data/property";

const initialState: PropertyContactFormState = {};

export function PropertyContactForm({ info }: { info: PropertyContactInfo }) {
  const [state, formAction, pending] = useActionState(savePropertyContactAction, initialState);

  const fieldClass =
    "w-full rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-sm text-ivory outline-none focus:border-champagne/60";
  const labelClass = "mb-1 block text-[11px] uppercase tracking-wider text-stone";

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-platinum/10 bg-graphite/60 p-6">
      <h2 className="font-display text-xl text-ivory">Datele proprietății</h2>
      <p className="text-sm text-stone">Folosite în footer, pagina de contact, email-uri de confirmare și metadate SEO.</p>

      {state.error && <p className="rounded-sm border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm text-red-300">{state.error}</p>}
      {state.saved && <p className="rounded-sm border border-emerald/40 bg-emerald/10 px-4 py-2 text-sm text-emerald">Date salvate.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Nume proprietate</span>
          <input name="name" defaultValue={info.name} required className={fieldClass} />
        </label>
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Email contact</span>
          <input name="email" type="email" defaultValue={info.email} required className={fieldClass} />
        </label>
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Telefon</span>
          <input name="phone" defaultValue={info.phone} required className={fieldClass} />
        </label>
        <label className="block text-sm text-ivory">
          <span className={labelClass}>WhatsApp (doar cifre, cu cod țară — ex: 40754417713)</span>
          <input name="whatsapp" defaultValue={info.whatsapp} required className={fieldClass} />
        </label>
      </div>

      <label className="block text-sm text-ivory">
        <span className={labelClass}>Adresă</span>
        <input name="address" defaultValue={info.address} required className={fieldClass} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Check-in</span>
          <input name="checkIn" type="time" defaultValue={info.checkIn} required className={fieldClass} />
        </label>
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Check-out</span>
          <input name="checkOut" type="time" defaultValue={info.checkOut} required className={fieldClass} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Instagram (URL, opțional)</span>
          <input name="instagram" defaultValue={info.instagram} placeholder="https://instagram.com/..." className={fieldClass} />
        </label>
        <label className="block text-sm text-ivory">
          <span className={labelClass}>Facebook (URL, opțional)</span>
          <input name="facebook" defaultValue={info.facebook} placeholder="https://facebook.com/..." className={fieldClass} />
        </label>
      </div>

      <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-5 py-2.5 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
        {pending ? "Se salvează…" : "Salvează datele"}
      </button>
    </form>
  );
}
