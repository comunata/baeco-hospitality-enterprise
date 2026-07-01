"use client";

import { useActionState } from "react";
import { createRoomBlockAction, type BlockFormState } from "./actions";
import type { Room } from "@/lib/types";

const initialState: BlockFormState = {};

export function BlockForm({ rooms }: { rooms: Room[] }) {
  const [state, formAction, pending] = useActionState(createRoomBlockAction, initialState);

  return (
    <form action={formAction} className="mb-8 flex flex-wrap items-end gap-3 rounded-sm border border-platinum/10 bg-graphite/40 p-4">
      <label className="block text-sm text-ivory">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Cameră</span>
        <select name="roomId" required className="rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60">
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name.ro}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-ivory">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">De la</span>
        <input name="startDate" type="date" required className="rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
      </label>
      <label className="block text-sm text-ivory">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Până la</span>
        <input name="endDate" type="date" required className="rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
      </label>
      <label className="block text-sm text-ivory">
        <span className="mb-1 block text-[11px] uppercase tracking-wider text-stone">Motiv (opțional)</span>
        <input name="reason" placeholder="Mentenanță, curățenie…" className="rounded-sm border border-platinum/20 bg-graphite/60 px-3 py-2 text-ivory outline-none focus:border-champagne/60" />
      </label>
      <button type="submit" disabled={pending} className="rounded-sm bg-champagne px-4 py-2 text-sm font-medium text-midnight hover:opacity-90 disabled:opacity-50">
        {pending ? "Se blochează…" : "Blochează interval"}
      </button>
      {state.error && <p className="w-full text-sm text-red-300">{state.error}</p>}
    </form>
  );
}
