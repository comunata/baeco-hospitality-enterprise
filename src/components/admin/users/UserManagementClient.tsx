"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAction,
  toggleUserActiveAction,
  changeUserRoleAction,
  resetPasswordAction,
  type CreateUserState,
  type ResetPasswordState,
} from "@/app/admin/users/actions";
import type { AdminUser } from "@/lib/data/users";
import type { AdminRole } from "@/lib/admin/session";

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  DEMO_ADMIN: "Demo Admin",
  HOTEL_ADMIN: "Hotel Admin",
};

const fieldClass =
  "w-full rounded-sm border border-platinum/20 bg-graphite px-3 py-2 text-sm text-ivory placeholder:text-stone focus:border-champagne focus:outline-none";

function formatDate(iso: string | null): string {
  if (!iso) return "Niciodată";
  return new Date(iso).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" });
}

export function UserManagementClient({ users }: { users: AdminUser[] }) {
  return (
    <div className="space-y-10">
      <CreateUserForm />
      <div className="overflow-x-auto rounded-sm border border-platinum/10">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-platinum/10 bg-graphite/60">
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">Email</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">Nume</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">Rol</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">Status</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">Ultima autentificare</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone">
                  Niciun utilizator încă — creează primul cont mai sus.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <UserRow key={u.id} user={u} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateUserForm() {
  const initial: CreateUserState = {};
  const [state, formAction, pending] = useActionState(createUserAction, initial);

  return (
    <div className="rounded-sm border border-platinum/15 bg-graphite/60 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-champagne">Cont nou</p>
      <form action={formAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <input name="email" type="email" placeholder="email@exemplu.ro" required className={fieldClass} />
        <input name="fullName" type="text" placeholder="Nume complet" required className={fieldClass} />
        <select name="role" defaultValue="DEMO_ADMIN" className={fieldClass}>
          <option value="DEMO_ADMIN">Demo Admin</option>
          <option value="HOTEL_ADMIN">Hotel Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-champagne px-4 py-2 text-xs font-medium uppercase tracking-widest text-midnight hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Se creează…" : "Creează cont"}
        </button>
      </form>
      {state.error && <p className="mt-3 text-xs text-red-300">{state.error}</p>}
      {state.createdPassword && (
        <div className="mt-4 rounded-sm border border-emerald/30 bg-emerald/5 px-4 py-3 text-sm">
          <p className="text-emerald">
            Cont creat pentru <strong>{state.createdEmail}</strong>. Parolă temporară (afișată o singură dată, copiaz-o acum):
          </p>
          <p className="mt-2 rounded-sm border border-platinum/15 bg-midnight px-3 py-2 font-mono text-champagne">{state.createdPassword}</p>
        </div>
      )}
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReset, setShowReset] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      await toggleUserActiveAction(user.id, !user.active);
      router.refresh();
    });
  }

  function changeRole(role: string) {
    startTransition(async () => {
      await changeUserRoleAction(user.id, role);
      router.refresh();
    });
  }

  return (
    <>
      <tr className="border-b border-platinum/5 last:border-0 hover:bg-platinum/5">
        <td className="px-4 py-3 text-ivory">{user.email}</td>
        <td className="px-4 py-3 text-ivory">{user.fullName || "—"}</td>
        <td className="px-4 py-3">
          <select
            defaultValue={user.role}
            disabled={pending}
            onChange={(e) => changeRole(e.target.value)}
            className="rounded-sm border border-platinum/20 bg-graphite px-2 py-1 text-xs text-ivory"
          >
            {(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider ${
              user.active ? "border-emerald/40 text-emerald" : "border-stone/40 text-stone"
            }`}
          >
            {user.active ? "Activ" : "Dezactivat"}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-stone">{formatDate(user.lastLoginAt)}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-wider">
            <button onClick={toggleActive} disabled={pending} className="text-champagne hover:opacity-80 disabled:opacity-40">
              {user.active ? "Dezactivează" : "Activează"}
            </button>
            <button onClick={() => setShowReset((v) => !v)} className="text-stone hover:text-ivory">
              Resetează parola
            </button>
          </div>
        </td>
      </tr>
      {showReset && (
        <tr className="border-b border-platinum/5 bg-midnight/40">
          <td colSpan={6} className="px-4 py-3">
            <ResetPasswordPanel userId={user.id} />
          </td>
        </tr>
      )}
    </>
  );
}

function ResetPasswordPanel({ userId }: { userId: string }) {
  const initial: ResetPasswordState = {};
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm border border-platinum/20 px-3 py-1.5 text-[11px] uppercase tracking-widest text-ivory hover:border-champagne/40 disabled:opacity-50"
      >
        {pending ? "Se generează…" : "Generează parolă nouă"}
      </button>
      {state.error && <span className="text-xs text-red-300">{state.error}</span>}
      {state.password && (
        <span className="rounded-sm border border-platinum/15 bg-midnight px-3 py-1.5 font-mono text-xs text-champagne">
          {state.password}
        </span>
      )}
    </form>
  );
}
