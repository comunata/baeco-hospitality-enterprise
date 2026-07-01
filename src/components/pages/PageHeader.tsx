import { Container } from "@/components/ui/Container";

function heroImageFor(eyebrow?: string, title?: string) {
  const key = `${eyebrow ?? ""} ${title ?? ""}`.toLowerCase();
  if (/(restaurant|restaurant)/.test(key)) return "/images/restaurant/restaurant-terrace.webp";
  if (/(spa|wellness|piscin|pool)/.test(key)) return "/images/wellness/pool.webp";
  if (/(galer|gallery)/.test(key)) return "/images/hero/b598dedbd81e9a4aa89d632f77b96418.jpg";
  if (/(explore|zon|bucovina)/.test(key)) return "/images/explore/voronet.webp";
  if (/(rezerv|booking|disponibilitate|availability)/.test(key)) return "/images/hero/hero-room.webp";
  if (/(camere|rooms|suite)/.test(key)) return "/images/rooms/deluxe-garden-1.webp";
  if (/(ofert|offers)/.test(key)) return "/images/restaurant/restaurant-interior.webp";
  if (/(facilit|facilities)/.test(key)) return "/images/explore/cabin-lake.webp";
  return "/images/hero/hero-room.webp";
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const image = heroImageFor(eyebrow, title);

  return (
    <div className="relative overflow-hidden border-b border-platinum/10 bg-midnight py-20 md:py-28">
      <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${image})` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-midnight/35" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-midnight to-transparent" />
      <Container className="relative z-10">
        <div className="max-w-3xl animate-fade-up">
          {eyebrow && <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-champagne">{eyebrow}</p>}
          <h1 className="font-display text-4xl leading-[1.05] text-ivory md:text-6xl">{title}</h1>
          {subtitle && <p className="mt-5 max-w-2xl text-base leading-7 text-stone md:text-lg">{subtitle}</p>}
        </div>
      </Container>
    </div>
  );
}
