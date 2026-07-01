import Image from "next/image";

export function GalleryGrid({ images, alt }: { images: string[]; alt: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {images.map((src, i) => (
        <div key={i} className={`relative aspect-square overflow-hidden rounded-sm ${i % 5 === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-[4/3]" : ""}`}>
          <Image src={src} alt={`${alt} ${i + 1}`} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover transition-transform duration-700 hover:scale-105" />
        </div>
      ))}
    </div>
  );
}
