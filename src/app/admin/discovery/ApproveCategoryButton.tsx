"use client";

import { useTransition } from "react";
import { approveCategoryAction } from "./actions";
import type { BdCategory } from "@/lib/discovery/types";

export function ApproveCategoryButton({ category, count }: { category: BdCategory; count: number }) {
  const [pending, startTransition] = useTransition();
  if (count === 0) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => approveCategoryAction(category))}
      className="rounded-full border border-emerald/30 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-emerald transition hover:bg-emerald/10 disabled:opacity-50"
    >
      {pending ? "…" : `Aprobă toate (${count})`}
    </button>
  );
}
