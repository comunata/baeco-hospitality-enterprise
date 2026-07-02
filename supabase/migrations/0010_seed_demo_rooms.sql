-- Seeds 7 additional premium demo rooms so the property has 10 rooms total
-- (3 pre-existing + 7 new). Idempotent via the unique `slug` constraint —
-- safe to re-run. Each room's cover_image/gallery[0] points at one of the
-- 7 real photos already uploaded through the admin (originally attached to
-- the site Gallery); the Rooms MediaManager auto-migrates this legacy URL
-- into its own media_items row (storage_path left null) the first time the
-- room's edit page is opened, so the underlying Storage object — still
-- owned by its original gallery media_items row — is never at risk of
-- being deleted from the room side.

do $$
declare
  v_property_id uuid;
  v_cina_romantica uuid;
begin
  select id into v_property_id from properties limit 1;

  select id into v_cina_romantica from services where name->>'ro' = 'Cină romantică' limit 1;

  insert into rooms (
    property_id, slug, name, description, max_adults, max_children, base_price, currency,
    size_sqm, beds, amenities, rules, included_service_ids, extra_service_ids,
    virtual_tour_url, active, total_units, gallery, cover_image, status
  ) values
  (
    v_property_id, 'junior-suite-vedere-munte',
    '{"ro":"Junior Suite Vedere Munte","en":"Junior Suite Mountain View"}'::jsonb,
    '{"ro":"Cameră luminoasă cu balcon propriu și priveliște deschisă spre munte, mobilier modern și baie cu duș tip walk-in.","en":"A bright room with a private balcony and open mountain views, modern furnishings and a walk-in shower bathroom."}'::jsonb,
    2, 1, 320, 'RON', 32, array['1 pat queen size'],
    array['Aer condiționat','Minibar','Seif','Wi-Fi','Balcon privat','Vedere munte'],
    '{"ro":"Fără fumat. Animale de companie nu sunt permise.","en":"No smoking. Pets are not allowed."}'::jsonb,
    array[]::uuid[], array[]::uuid[], null, true, 2,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/25bfd9f5-7099-453b-9e5f-7ae2069ee8a9.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/25bfd9f5-7099-453b-9e5f-7ae2069ee8a9.webp',
    'available'
  ),
  (
    v_property_id, 'suita-premium-panoramica',
    '{"ro":"Suită Premium Panoramică","en":"Premium Panoramic Suite"}'::jsonb,
    '{"ro":"Suită spațioasă cu living separat și ferestre generoase, gândită pentru sejururi de cuplu de neuitat.","en":"A spacious suite with a separate living area and floor-to-ceiling windows, designed for unforgettable couple getaways."}'::jsonb,
    3, 2, 520, 'RON', 48, array['1 pat king size','1 canapea extensibilă'],
    array['Aer condiționat','Minibar','Seif','Wi-Fi','Living separat','Vedere panoramică'],
    '{"ro":"Fără fumat. Animale de companie mici, la cerere.","en":"No smoking. Small pets allowed on request."}'::jsonb,
    array[]::uuid[], case when v_cina_romantica is not null then array[v_cina_romantica] else array[]::uuid[] end,
    null, true, 1,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/4d2838b7-6179-4bcd-87b3-b8cdc6973f2b.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/4d2838b7-6179-4bcd-87b3-b8cdc6973f2b.webp',
    'available'
  ),
  (
    v_property_id, 'camera-twin-comfort',
    '{"ro":"Cameră Twin Comfort","en":"Twin Comfort Room"}'::jsonb,
    '{"ro":"Cameră practică cu două paturi single, ideală pentru colegi de călătorie sau sejururi de afaceri.","en":"A practical room with two single beds, ideal for travel companions or business stays."}'::jsonb,
    2, 0, 260, 'RON', 24, array['2 paturi single'],
    array['Aer condiționat','Seif','Wi-Fi','Birou de lucru'],
    '{"ro":"Fără fumat. Animale de companie nu sunt permise.","en":"No smoking. Pets are not allowed."}'::jsonb,
    array[]::uuid[], array[]::uuid[], null, true, 3,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/ccf73fdd-776d-4e60-89c8-bec9eb0b21c4.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/ccf73fdd-776d-4e60-89c8-bec9eb0b21c4.webp',
    'available'
  ),
  (
    v_property_id, 'apartament-loft-boutique',
    '{"ro":"Apartament Loft Boutique","en":"Boutique Loft Apartment"}'::jsonb,
    '{"ro":"Apartament open-space cu tavan înalt, bucătărie complet utilată și zonă de living generoasă pentru familii sau grupuri mici.","en":"An open-plan apartment with high ceilings, a fully equipped kitchen and a generous living area for families or small groups."}'::jsonb,
    4, 2, 450, 'RON', 55, array['1 pat king size','2 paturi single'],
    array['Bucătărie completă','Aer condiționat','Mașină de spălat','Wi-Fi'],
    '{"ro":"Fără fumat. Animale de companie permise cu taxă.","en":"No smoking. Pets allowed with a fee."}'::jsonb,
    array[]::uuid[], array[]::uuid[], null, true, 1,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/cab495c6-0dfa-4e74-b57f-85ab7f8a100e.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/cab495c6-0dfa-4e74-b57f-85ab7f8a100e.webp',
    'available'
  ),
  (
    v_property_id, 'suita-romantica-terasa',
    '{"ro":"Suită Romantică cu Terasă","en":"Romantic Terrace Suite"}'::jsonb,
    '{"ro":"Suită intimă cu cadă freestanding și terasă privată, gândită pentru sejururi romantice sau luna de miere.","en":"An intimate suite with a freestanding bathtub and a private terrace, designed for romantic getaways or honeymoons."}'::jsonb,
    2, 0, 480, 'RON', 38, array['1 pat king size'],
    array['Aer condiționat','Minibar','Cadă freestanding','Terasă privată','Wi-Fi'],
    '{"ro":"Fără fumat. Animale de companie nu sunt permise.","en":"No smoking. Pets are not allowed."}'::jsonb,
    array[]::uuid[], case when v_cina_romantica is not null then array[v_cina_romantica] else array[]::uuid[] end,
    null, true, 1,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/4976110c-b0c8-4e52-bb1e-fb384c44401b.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/4976110c-b0c8-4e52-bb1e-fb384c44401b.webp',
    'available'
  ),
  (
    v_property_id, 'penthouse-panorama-exclusive',
    '{"ro":"Penthouse Panorama Exclusive","en":"Exclusive Panorama Penthouse"}'::jsonb,
    '{"ro":"Penthouse la ultimul etaj, cu terasă generoasă și jacuzzi exterior, pentru cea mai exclusivistă experiență din proprietate.","en":"A top-floor penthouse with a generous terrace and an outdoor jacuzzi, the most exclusive stay on the property."}'::jsonb,
    4, 2, 690, 'RON', 75, array['1 pat king size','1 canapea extensibilă'],
    array['Aer condiționat','Minibar','Seif','Wi-Fi','Terasă privată','Jacuzzi exterior','Vedere panoramică'],
    '{"ro":"Fără fumat în interior. Animale de companie permise.","en":"No smoking indoors. Pets allowed."}'::jsonb,
    array[]::uuid[], array[]::uuid[], null, true, 1,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/8b962592-059a-46f4-a064-e92c66d6baed.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/8b962592-059a-46f4-a064-e92c66d6baed.webp',
    'available'
  ),
  (
    v_property_id, 'camera-business-deluxe',
    '{"ro":"Cameră Business Deluxe","en":"Business Deluxe Room"}'::jsonb,
    '{"ro":"Cameră elegantă cu birou ergonomic și internet de mare viteză, potrivită pentru călătorii de afaceri.","en":"An elegant room with an ergonomic desk and high-speed internet, suited for business travel."}'::jsonb,
    2, 1, 350, 'RON', 30, array['1 pat queen size'],
    array['Aer condiționat','Minibar','Seif','Wi-Fi','Birou ergonomic'],
    '{"ro":"Fără fumat. Animale de companie nu sunt permise.","en":"No smoking. Pets are not allowed."}'::jsonb,
    array[]::uuid[], array[]::uuid[], null, true, 2,
    array['https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/3ee42e9a-7f7b-40f5-805b-6ec1d42382d7.webp'],
    'https://ucqqeawfjbnrvwaayidj.supabase.co/storage/v1/object/public/gallery/gallery/3ee42e9a-7f7b-40f5-805b-6ec1d42382d7.webp',
    'available'
  )
  on conflict (slug) do nothing;
end $$;
