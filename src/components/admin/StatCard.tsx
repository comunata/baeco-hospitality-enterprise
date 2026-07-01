export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-platinum/10 bg-graphite/60 p-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone">{label}</p>
      <p className="mt-2 font-display text-3xl text-champagne">{value}</p>
    </div>
  );
}
