"use client";

import { useTransition } from "react";
import { deleteAttractionAction } from "./actions";

export function DeleteAttractionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Ștergi definitiv această înregistrare?")) return;
        startTransition(() => deleteAttractionAction(id));
      }}
      className="text-xs uppercase tracking-wider text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {pending ? "…" : "Șterge"}
    </button>
  );
}
