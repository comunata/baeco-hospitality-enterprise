export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-full min-h-[7.5rem] flex-col items-center justify-center gap-2 overflow-hidden rounded-sm border border-platinum/10 bg-graphite/60 p-4 text-center sm:min-h-[8.5rem] sm:p-6">
      <p className="w-full text-[11px] font-medium uppercase tracking-[0.15em] text-stone sm:tracking-[0.2em]">{label}</p>
      <p
        className="w-full break-words font-display leading-tight tabular-nums text-champagne"
        style={{ fontSize: "clamp(1.05rem, 0.85rem + 1.1vw, 1.875rem)" }}
      >
        {value}
      </p>
    </div>
  );
}
