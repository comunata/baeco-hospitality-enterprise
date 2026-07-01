import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-champagne text-midnight hover:bg-champagne/90",
  secondary: "border border-platinum/40 text-ivory hover:border-champagne hover:text-champagne",
  ghost: "text-ivory hover:text-champagne",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-7 py-3.5 text-sm font-medium uppercase tracking-[0.15em] transition-colors duration-300";

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
