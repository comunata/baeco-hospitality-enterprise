"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: { question: string; answer: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-platinum/10 border-t border-b border-platinum/10">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-5 text-left"
          >
            <span className="font-display text-lg text-ivory md:text-xl">{item.question}</span>
            <span className={cn("text-champagne transition-transform", openIndex === i && "rotate-45")}>+</span>
          </button>
          {openIndex === i && <p className="pb-5 text-sm leading-relaxed text-stone">{item.answer}</p>}
        </div>
      ))}
    </div>
  );
}
