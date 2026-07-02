"use client";

import { useTransition } from "react";
import { toggleModuleAction } from "./actions";
import type { ModuleKey } from "@/config/modules";

export function ModuleToggle({ moduleKey, enabled }: { moduleKey: ModuleKey; enabled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleModuleAction(moduleKey, !enabled))}
      aria-pressed={enabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${enabled ? "bg-emerald/80" : "bg-platinum/25"}`}
      title={enabled ? "Dezactivează" : "Activează"}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory transition-all ${enabled ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}
