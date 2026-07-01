import Image from "next/image";
import { cn } from "@/lib/utils";

export type AiAssistantKind = "concierge" | "roomFinder" | "hotelManager" | "localGuide" | "upsell";

const config: Record<AiAssistantKind, { image: string; label: string; ring: string; badge: string }> = {
  concierge: { image: "/images/ai/ai-robot-concierge.webp", label: "AI Concierge", ring: "border-champagne/45 shadow-champagne/20", badge: "24/7" },
  roomFinder: { image: "/images/ai/ai-robot-concierge.webp", label: "AI Room Finder", ring: "border-emerald/45 shadow-emerald/20", badge: "ROOM" },
  hotelManager: { image: "/images/ai/ai-concierge-desk.webp", label: "AI Hotel Manager", ring: "border-platinum/35 shadow-platinum/10", badge: "ADMIN" },
  localGuide: { image: "/images/ai/ai-robot-local-guide.webp", label: "AI Local Guide", ring: "border-sky-300/45 shadow-sky-300/20", badge: "MAP" },
  upsell: { image: "/images/ai/ai-robot-concierge.webp", label: "AI Upsell", ring: "border-rose-300/45 shadow-rose-300/20", badge: "+" },
};

export function AiAvatar({ kind, size = 40, className }: { kind: AiAssistantKind; size?: number; className?: string }) {
  const { image, label, ring, badge } = config[kind];
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative shrink-0 overflow-hidden rounded-full border bg-midnight shadow-[0_0_42px_rgba(214,179,106,0.18)]", ring, className)}
      style={{ width: size, height: size }}
    >
      <Image src={image} alt="" fill sizes={`${size}px`} className="object-cover object-center scale-[1.08]" />
      <div className="absolute inset-0 bg-gradient-to-t from-midnight/35 via-transparent to-transparent" />
      <span className="absolute -right-1 top-1 rounded-full border border-emerald/50 bg-emerald px-1 py-0.5 text-[8px] font-bold leading-none text-ivory shadow-lg">
        {badge}
      </span>
      <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)] animate-ai-led" />
    </div>
  );
}
