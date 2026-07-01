"use client";

import { useTransition } from "react";
import { deleteSeasonAction } from "./actions";

export function DeleteSeasonButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Ștergi definitiv acest sezon?")) return;
        startTransition(() => deleteSeasonAction(id));
      }}
      className="text-xs uppercase tracking-wider text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {pending ? "…" : "Șterge"}
    </button>
  );
}
