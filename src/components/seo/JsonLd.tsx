export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function lodgingBusinessJsonLd(input: {
  name: string;
  description: string;
  url: string;
  telephone: string;
  address: string;
  lat: number;
  lng: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: input.name,
    description: input.description,
    url: input.url,
    telephone: input.telephone,
    address: { "@type": "PostalAddress", streetAddress: input.address },
    geo: { "@type": "GeoCoordinates", latitude: input.lat, longitude: input.lng },
  };
}

export function roomProductJsonLd(input: { name: string; description: string; image: string; price: number; currency: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image,
    url: input.url,
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.currency,
      availability: "https://schema.org/InStock",
    },
  };
}
