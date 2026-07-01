import { cn } from "@/lib/utils";
import { Container } from "./Container";

export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("py-20 md:py-28", className)}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl animate-fade-up", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-champagne">{eyebrow}</p>
      )}
      <h2 className="font-display text-4xl leading-tight text-ivory md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base text-stone md:text-lg">{subtitle}</p>}
    </div>
  );
}
