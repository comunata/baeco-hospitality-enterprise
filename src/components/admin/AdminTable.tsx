import { cn } from "@/lib/utils";

export interface AdminColumn<T> {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

export function AdminTable<T>({ columns, rows, keyField, emptyLabel }: { columns: AdminColumn<T>[]; rows: T[]; keyField: (row: T) => string; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="rounded-sm border border-platinum/10 bg-graphite/40 p-8 text-center text-sm text-stone">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-platinum/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-platinum/10 bg-graphite/60">
            {columns.map((col) => (
              <th key={col.header} className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-stone">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyField(row)} className="border-b border-platinum/5 last:border-0 hover:bg-platinum/5">
              {columns.map((col) => (
                <td key={col.header} className={cn("px-4 py-3 text-ivory", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    confirmed: "text-emerald border-emerald/40",
    pending: "text-champagne border-champagne/40",
    cancelled: "text-red-400 border-red-400/40",
    completed: "text-stone border-stone/40",
    active: "text-emerald border-emerald/40",
    inactive: "text-stone border-stone/40",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider", colorMap[status] ?? "text-stone border-stone/40")}>
      {status}
    </span>
  );
}
