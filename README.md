# Baeco Hospitality Enterprise 2027

Platformă premium modulară pentru hoteluri, pensiuni, vile și case de vacanță: website, booking engine, admin enterprise, portal client, AI Concierge, AI Local Guide și integrări reale (Supabase, email, WhatsApp, plăți, hărți, vreme, analytics).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** — design system "Quiet Luxury" (paletă Midnight Obsidian / Champagne Gold / Royal Emerald etc., vezi `src/app/globals.css`)
- **Supabase** (Postgres + Auth + Storage + RLS) — opțional; platforma rulează complet fără el, cu date demo
- Adaptoare izolate pentru fiecare integrare externă (OpenAI, Resend/SendGrid, WhatsApp, Stripe, Google Maps, OpenWeather, GA/Meta Pixel)

## Arhitectură

```
src/
  app/
    [locale]/         website public (ro/en, pregătit pentru de/fr/it/es)
    admin/             Admin Enterprise (fără prefix de limbă)
    portal/            Portal Client (fără prefix de limbă)
    api/               rute API: booking, ai, contact, portal
  components/          UI, layout, booking, admin, portal, ai, seo, pwa
  config/              modules.ts (feature flags), site.ts, adminNav.ts
  lib/
    i18n/              dicționare de traducere RO/EN + fallback DE/FR/IT/ES
    data/              strat de acces la date: Supabase dacă e configurat, altfel seed/*
    integrations/      email, whatsapp, ai, weather, payments, calendar, analytics, channel-manager
    pricing.ts         motorul de calcul preț (sezoane, weekend, extra, taxe, reduceri, voucher)
    supabase/          clienți browser/server/admin
supabase/
  migrations/0001_init.sql   schema completă (27 tabele) + RLS
  seed.sql                    roluri + proprietate implicită
```

## Funcționalități implementate

- **Website public** (RO/EN): hero cinematic cu widget de rezervare, listă + detaliu camere (galerie, capacitate, facilități, servicii incluse/extra), galerie, facilități, restaurant, SPA, piscină, evenimente, oferte, Explore Area, FAQ (accordion), contact (formular funcțional), chat AI flotant, footer complet.
- **Booking Engine**: disponibilitate în timp real (verificată contra rezervărilor existente), calcul instant de preț (`/api/booking/quote`), pas de servicii extra, formular oaspete, cod promoțional + voucher cadou, confirmare cu cod unic, email de confirmare, link WhatsApp de confirmare, recalcul și validare **server-side** la creare (`/api/booking/create`) ca prețul afișat pe client să nu poată fi manipulat.
- **Admin Enterprise** (`/admin`): Dashboard (rezervări azi, ocupare, venit estimat, camere libere, servicii populare, surse rezervări, recomandări AI generate din datele reale), Calendar rezervări, Rezervări, Clienți, Camere, Tarife, Sezoane, Servicii extra, Galerie, Oferte, Coduri promoționale, Vouchere, Review-uri, Explore Area (Restaurante/Atracții/Evenimente), AI Knowledge Base, Traduceri (status per limbă), SEO, Setări (module on/off), Utilizatori, Roluri, Integrări (status live per integrare).
- **Portal Client** (`/portal`): rezervările mele, detalii sejur + factură, check-in online, solicitări speciale (editabile), export .ics pentru calendar, anulare cu verificarea politicii (5 zile), favorite (persistate local), vouchere, puncte de fidelitate (calculate din istoricul de rezervări), conversații AI persistate.
- **AI Concierge**: răspunde despre camere, prețuri, disponibilitate, servicii, facilități, politici, check-in/out, copii, parcare etc., strict pe baza AI Knowledge Base + date reale (nu inventează); oferă preluare pe WhatsApp când nu găsește un răspuns sigur.
- **AI Local Guide / Explore Area**: răspunde la "ce pot vizita", "unde mâncăm", "ce facem cu copiii", "ce facem dacă plouă", "plan de 3 zile" — pe baza atracțiilor/restaurantelor/evenimentelor din bază, plus vremea zilei curente.
- **Multilingv**: fără text hardcodat — totul e cheie de traducere (`src/lib/i18n/dictionaries/*`), pentru site, admin, portal, AI, emailuri, WhatsApp, SEO, erori, formulare.
- **SEO Enterprise**: `sitemap.xml` (toate paginile × toate limbile), `robots.txt`, JSON-LD (LodgingBusiness pe homepage, Product pe fiecare cameră), Open Graph, canonical + hreflang per pagină.
- **PWA**: manifest, iconiță SVG, instalare pe telefon, service worker cu fallback offline.
- **Module activabile/dezactivabile**: cele 12 module cerute (website, booking, admin, portal, aiConcierge, aiLocalGuide, explore, aiKnowledgeBase, seo, analytics, notifications, integrations) definite în `src/config/modules.ts`, comutabile din `.env.local` (`NEXT_PUBLIC_MODULE_<CHEIE>=false`) sau vizibile din **Admin → Setări**.

## Integrări — ce e gata acum vs. ce mai trebuie

Fiecare integrare are un mod „mock"/sandbox: dacă lipsește variabila de mediu, funcția răspunde realist (loghează, generează un link, folosește date demo) în loc să eșueze. Poți vedea starea fiecăreia live din **Admin → Integrări** (`src/lib/integrations/status.ts`).

| Integrare | Cod | Ce trebuie făcut pentru go-live |
|---|---|---|
| Supabase (auth, DB, storage, RLS) | ✅ complet (`src/lib/supabase/*`, `supabase/migrations/0001_init.sql`) | Doar creezi proiectul și pui cele 3 chei în `.env.local` |
| Email (Resend / SendGrid) | ✅ complet (`src/lib/integrations/email.ts`) | Doar cheia API + `EMAIL_FROM` |
| WhatsApp (link rapid + Cloud API) | ✅ complet (`src/lib/integrations/whatsapp.ts`) | Link-ul `wa.me` merge fără cheie; pentru template-uri automate ai nevoie de `WHATSAPP_BUSINESS_TOKEN` + `WHATSAPP_PHONE_ID` |
| Google Maps | ✅ hartă embed funcțională fără cheie (pagina Contact) | Cheie opțională doar pentru hărți interactive avansate (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) |
| Weather API | ✅ complet (`src/lib/integrations/weather.ts`) | Doar `OPENWEATHER_API_KEY`; fără ea afișează o estimare sezonieră |
| OpenAI (AI Concierge, Local Guide) | ✅ complet, funcțional și fără cheie (fallback pe Knowledge Base) | Doar `OPENAI_API_KEY` pentru răspunsuri reformulate natural |
| Analytics (GA4 / Meta Pixel) | ✅ complet (`src/components/analytics/Analytics.tsx`) | Doar `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` |
| Export calendar (.ics) | ✅ complet, funcționează deja (Portal → detalii sejur) | — |
| Stripe | ⚠️ adapter gata (`src/lib/integrations/payments.ts`), neconectat la fluxul de booking | Cheie `STRIPE_SECRET_KEY` + decizie de business: avans sau plată integrală la rezervare |
| Revolut / PayPal | ⚠️ interfață pregătită, fără apel API real încă | Implementare API specifică fiecărui provider |
| Google Calendar / Outlook (sincronizare bidirecțională) | ⚠️ doar flag de configurare (`src/lib/integrations/calendar.ts`) | Necesită flux OAuth complet — nefăcut încă |
| Booking.com / Airbnb / Expedia / Channel Manager / PMS / Smart locks / POS / contabilitate / e-Factura / CRM | ⚠️ doar interfața tipizată (`src/lib/integrations/channel-manager.ts`), fără implementare | Alegere provider (ex. Channex pentru channel manager) + implementare dedicată |
| Autentificare reală Admin/Portal | ⚠️ „demo mode" activ când Supabase nu e conectat | Conectează Supabase Auth; rolurile (`owner/manager/staff/customer`) sunt deja în schema SQL |

## Pornire locală

```bash
npm install
cp .env.example .env.local   # opțional — merge și fără el
npm run dev
```

Deschide `http://localhost:3000` (redirect automat la `/ro`), `/admin` pentru panoul de administrare și `/portal` pentru contul de client (ambele în „demo mode" până conectezi Supabase Auth).

## Conectarea Supabase

1. Creează un proiect Supabase, rulează `supabase/migrations/0001_init.sql` apoi `supabase/seed.sql`.
2. Setează `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Din acel moment, `src/lib/data/*` citește/scrie din Postgres în loc de datele demo din `src/lib/data/seed/*`; RLS separă accesul public (citire), admin (rol owner/manager/staff) și client (rândurile proprii).

## Motorul de rezervări

`src/lib/pricing.ts` calculează: tarif per noapte (bază × multiplicator sezon × multiplicator weekend), reducere pentru sejur 7+ nopți, servicii extra (per persoană/cameră/rezervare/noapte, cu copii sub 6 ani gratuiți), cod promoțional, taxă turistică per persoană adultă/pe noapte, voucher cadou aplicat pe rest. Rezumatul (`lines`) e afișat identic în booking engine și în factura din Portal Client. Prețul e recalculat și validat server-side la crearea rezervării (`/api/booking/create`), nu doar pe client.

## AI Concierge & AI Local Guide

Ambele rulează pe un strat de „grounding": caută în AI Knowledge Base (`ai_knowledge` / `src/lib/data/seed/content.ts`) și în datele reale (camere, atracții, evenimente) cuvintele cheie din întrebare. Dacă `OPENAI_API_KEY` e setat, răspunsul e reformulat de model dar **strict limitat la faptele găsite** (nu are voie să inventeze); fără cheie, răspunde direct cu intrarea din Knowledge Base găsită. Când nu găsește nimic relevant, AI Concierge oferă preluare pe WhatsApp în loc să ghicească.

## Traduceri

Totul trece prin chei de traducere (`src/lib/i18n/dictionaries/*`), niciun text hardcodat în componente. RO și EN sunt complete; DE/FR/IT/ES au cheile vizibile (nav, hero) traduse și restul cad automat pe EN până sunt completate (vezi Admin → Traduceri pentru statusul per limbă).

## Ce necesită muncă suplimentară înainte de lansare comercială

- Fotografii reale (galeria folosește `picsum.photos` ca placeholder)
- Autentificare Supabase Auth reală pentru Admin/Portal (vezi tabelul de mai sus)
- Deciziile de business + implementarea pentru plăți online (avans, voucher cadou prin Stripe/Revolut/PayPal)
- Traducere profesională DE/FR/IT/ES (structura e deja pregătită, doar textul lipsește)
- Integrări channel manager (Booking.com/Airbnb/Expedia), PMS, smart locks, POS, e-Factura, CRM — interfața e pregătită, implementarea depinde de providerul ales

## Backup

Supabase (planurile Pro+) rulează backup automat zilnic (point-in-time recovery pe planurile superioare) — vezi Dashboard → Project Settings → Database → Backups. Pe planul Free nu există backup automat, așa că am adăugat un script suplimentar, simplu, pentru backup logic on-demand/programat:

```bash
SUPABASE_DB_URL="postgresql://postgres:[parola]@db.[project-ref].supabase.co:5432/postgres" npm run backup:db
```

Scriptul (`scripts/backup-db.sh`) rulează `pg_dump`, comprimă rezultatul în `./backups/` și păstrează implicit ultimele 14 backup-uri (`BACKUP_RETENTION`). Restaurare:

```bash
gunzip -c backups/baeco-db-<timestamp>.sql.gz | psql "$SUPABASE_DB_URL"
```

Poate fi programat cu cron/CI pentru rulare zilnică; conexiunea și instrucțiunile complete sunt documentate în comentariile din script.

## Verificare

```bash
npm run lint        # ESLint (0 erori)
npx tsc --noEmit     # TypeScript strict (0 erori)
npm run build        # Next build (toate rutele generate cu succes)
```
