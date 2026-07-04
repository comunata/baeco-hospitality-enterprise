import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-sm border border-platinum/10 bg-graphite transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/25",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border border-champagne/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-champagne",
        className
      )}
    >
      {children}
    </span>
  );
}
