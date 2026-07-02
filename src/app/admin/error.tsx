"use client";

import { DEMO_WRITE_BLOCKED_MESSAGE } from "@/lib/admin/constants";

/**
 * Catches thrown errors from requireAdminRole()/assertAdminRole() —
 * insufficient role, or a Demo Admin write attempt — plus any other
 * admin-page failure, so the user sees a clear message instead of Next.js's
 * generic error screen. Many Server Actions also catch this locally and
 * return it as inline form state (nicer UX, no full-slot replacement); this
 * boundary is the fallback for the ones that don't (e.g. direct-call
 * actions invoked outside a form, like delete buttons).
 */
export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  const isDemoBlocked = error.message === DEMO_WRITE_BLOCKED_MESSAGE;
  const forbidden = !isDemoBlocked && error.message?.toLowerCase().includes("forbidden");

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-midnight px-6 text-center">
      <div>
        <p className="font-display text-2xl text-ivory">{isDemoBlocked ? "Cont Demo" : forbidden ? "Acces interzis" : "A apărut o eroare"}</p>
        <p className="mt-2 text-sm text-stone">
          {isDemoBlocked
            ? DEMO_WRITE_BLOCKED_MESSAGE
            : forbidden
              ? "Nu ai permisiunile necesare pentru această secțiune."
              : "Te rugăm încearcă din nou sau contactează administratorul."}
        </p>
      </div>
    </div>
  );
}
