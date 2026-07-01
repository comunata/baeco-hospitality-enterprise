"use client";

/**
 * Catches thrown errors from requireAdminRole() (insufficient role) and any
 * other admin-page failure, so an unauthorized staff member sees a clear
 * "forbidden" message instead of Next.js's generic error screen.
 */
export default function AdminError({ error }: { error: Error & { digest?: string } }) {
  const forbidden = error.message?.toLowerCase().includes("forbidden");

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-midnight px-6 text-center">
      <div>
        <p className="font-display text-2xl text-ivory">{forbidden ? "Acces interzis" : "A apărut o eroare"}</p>
        <p className="mt-2 text-sm text-stone">
          {forbidden
            ? "Nu ai permisiunile necesare pentru această secțiune."
            : "Te rugăm încearcă din nou sau contactează administratorul."}
        </p>
      </div>
    </div>
  );
}
