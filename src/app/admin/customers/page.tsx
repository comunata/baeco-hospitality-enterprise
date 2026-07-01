import { getServerDictionary } from "@/lib/i18n/server";
import { getAllBookings } from "@/lib/data/bookings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatCurrency } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const { dict } = await getServerDictionary();
  const bookings = await getAllBookings();

  const customers = new Map<string, { name: string; email: string; phone: string; bookings: number; totalSpent: number }>();
  for (const b of bookings) {
    const key = b.guest.email;
    const existing = customers.get(key) ?? { name: `${b.guest.firstName} ${b.guest.lastName}`, email: b.guest.email, phone: b.guest.phone, bookings: 0, totalSpent: 0 };
    existing.bookings += 1;
    existing.totalSpent += b.totals.total;
    customers.set(key, existing);
  }

  return (
    <div>
      <AdminPageHeader title={dict.admin.nav.customers} description="Derivat automat din rezervări (conectează Supabase pentru un CRM complet)." />
      <AdminTable
        emptyLabel="Niciun client încă."
        keyField={(c) => c.email}
        rows={[...customers.values()]}
        columns={[
          { header: "Nume", render: (c) => c.name },
          { header: "Email", render: (c) => c.email },
          { header: "Telefon", render: (c) => c.phone },
          { header: "Rezervări", render: (c) => String(c.bookings) },
          { header: "Total cheltuit", render: (c) => formatCurrency(c.totalSpent) },
        ]}
      />
    </div>
  );
}
