import type { Review } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export function Testimonials({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {reviews.map((review) => (
        <Card key={review.id} className="p-8">
          <div className="mb-4 text-champagne">{"★".repeat(review.rating)}</div>
          <p className="text-sm leading-relaxed text-ivory">&ldquo;{review.comment}&rdquo;</p>
          <p className="mt-6 text-xs uppercase tracking-widest text-stone">
            {review.guestName} {review.roomName ? `· ${review.roomName}` : ""}
          </p>
        </Card>
      ))}
    </div>
  );
}
