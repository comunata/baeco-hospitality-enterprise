"use client";

import { useTransition } from "react";
import { deleteServiceAction } from "./actions";

export function DeleteServiceButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Sigur dezactivezi acest serviciu?")) return;
        startTransition(() => deleteServiceAction(id));
      }}
      className="text-xs uppercase tracking-wider text-red-300 hover:text-red-200 disabled:opacity-50"
    >
      {pending ? "…" : "Dezactivează"}
    </button>
  );
}
