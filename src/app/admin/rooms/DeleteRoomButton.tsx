"use client";

import { useTransition } from "react";
import { deleteRoomAction } from "./actions";

export function DeleteRoomButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Sigur dezactivezi această cameră? Nu va mai fi vizibilă pe site, dar rămâne în istoricul rezervărilor.")) return;
        startTransition(() => deleteRoomAction(id));
      }}
      className="text-xs uppercase tracking-wider text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {pending ? "…" : "Dezactivează"}
    </button>
  );
}
