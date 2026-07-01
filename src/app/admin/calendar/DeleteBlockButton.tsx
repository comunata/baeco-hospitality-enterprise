"use client";

import { useTransition } from "react";
import { deleteRoomBlockAction } from "./actions";

export function DeleteBlockButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => deleteRoomBlockAction(id))}
      className="text-xs uppercase tracking-wider text-red-300 hover:text-red-200 disabled:opacity-50"
      title="Anulează blocajul"
    >
      {pending ? "…" : "✕"}
    </button>
  );
}
