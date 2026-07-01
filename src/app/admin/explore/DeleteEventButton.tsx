"use client";

import { useTransition } from "react";
import { deleteEventAction } from "./actions";

export function DeleteEventButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Ștergi definitiv acest eveniment?")) return;
        startTransition(() => deleteEventAction(id));
      }}
      className="text-xs uppercase tracking-wider text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {pending ? "…" : "Șterge"}
    </button>
  );
}
