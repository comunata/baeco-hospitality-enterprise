# Hospitality Intelligence Engine

Modulul central al BD Hospitality Enterprise: descoperă, clasifică, curatoriază
și servește cunoștințele despre zona proprietății — baza factuală a tuturor
agenților AI și a experienței de descoperire pentru oaspeți.

## Principiu

> Administratorul spune doar „acesta este hotelul meu".
> Platforma construiește restul — iar AI-ul nu inventează niciodată:
> răspunde exclusiv din ce a aprobat administratorul.

## Fluxul complet

```
Onboarding (< 2 minute)                  Admin: /admin/discovery
┌──────────────────────────┐
│ nume + categorie         │
│ adresă  ──geocodare──►   │  GPS, localitate, județ, regiune, țară
│ rază: 2/5/10/25/50 km    │      (Nominatim, gratuit, fără cheie)
└────────────┬─────────────┘
             ▼
      Scanare zonă (Overpass/OSM — gratuit, fără cheie API)
             ▼
   Clasificare deterministă în taxonomia BD (19 categorii)
   + scor de calitate 0–100 (completitudine + proeminență)
             ▼
      Coadă de moderare: Aprobă / Respinge / Editează /
      Fixează în top / Aprobă toată categoria / Șterge
             ▼
┌─────────── locuri APROBATE = knowledge base ───────────┐
│                                                         │
▼               ▼                ▼                        ▼
Explore     AI Local Guide   AI Concierge         AI Stay Planner
(secțiuni   (itinerarii      („unde e cea mai     (planuri 1/2/3/5/7
automate)   1–7 zile,        apropiată            zile pe persona)
            persona)         farmacie?")
```

## Componente

| Componentă | Fișier | Rol |
|---|---|---|
| Taxonomie | `src/lib/discovery/taxonomy.ts` | Reguli OSM→BD (19 categorii), personas implicite, selectoare Overpass |
| Geocodare | `src/lib/discovery/geocode.ts` | Adresă↔GPS + localitate/județ/regiune/țară (Nominatim) |
| Client Overpass | `src/lib/discovery/overpass.ts` | O singură interogare unificată per scanare, `out center` |
| Scoring | `src/lib/discovery/scoring.ts` | Scor determinist 0–100, distanțe haversine, estimare minute condus |
| Motor | `src/lib/discovery/engine.ts` | Orchestrare scanare: interogare → clasificare → scor → dedupe |
| Set demo | `src/lib/discovery/sample-data.ts` | Fallback offline/demo — fluxul complet funcționează fără rețea |
| Data layer | `src/lib/data/discovery.ts` | Supabase + fallback in-memory (pattern-ul lib/data/*) |
| Intelligence | `src/lib/intelligence/planner.ts` | Itinerarii 1–7 zile, ghid gastronomic, ghiduri persona, context AI |
| Admin | `src/app/admin/discovery/` | Profil proprietate, scanare, coadă de moderare |
| Scheduler | `src/app/api/cron/discovery-refresh` | Re-scanare programată (săptămânal), diff „N locuri noi" |
| Schema DB | `supabase/migrations/0004_intelligence_engine.sql` | `discovered_places`, `discovery_scans`, extensii `properties`, RLS |

## Taxonomia BD (19 categorii)

**Experiență:** attraction, culture, nature, trail, adventure, sport, wellness,
family, restaurant, cafe, bar, nightlife, shopping, market, producer.
**Practice:** transport, health, fuel, services.

Personas: family, kids, romantic, rainy-day, culture, adventure, relax, evening.
Fiecare regulă de clasificare atașează personas implicite (ex. `leisure=spa` →
relax + romantic + rainy-day), pe care administratorul le poate edita.

## Modelul de costuri (decizie de design)

| Operație | Cost | Frecvență |
|---|---|---|
| Geocodare (Nominatim) | 0 | la onboarding / la cerere |
| Scanare zonă (Overpass) | 0 | la onboarding + săptămânal |
| Clasificare + scoring | 0 (determinist, in-process) | per scanare |
| Itinerarii, ghiduri, recomandări | 0 (planner determinist) | per request |
| Răspunsuri AI Concierge | apel LLM **doar dacă** `AI_API_KEY` există; altfel fallback factual | per întrebare complexă |

Motorul nu are nicio dependență de un LLM. AI-ul e un strat de exprimare
naturală deasupra unei baze factuale gratuite — nu sursa faptelor.

## Fluxuri de siguranță

- **RLS**: publicul vede doar `status='approved'`; orice mutație cere admin.
- **Re-scanările nu redeschid deciziile**: un loc respins rămâne respins
  (dedupe pe `source_ref`), deci refresh-ul săptămânal nu spamează coada.
- **Rate limiting** există deja pe rutele AI publice.
- **Degradare grațioasă**: API-uri OSM indisponibile → set demo; Supabase
  neconfigurat → store in-memory; AI neconfigurat → răspunsuri factuale.

## Ce alimentează, concret

- **Explore** (`/[locale]/explore`): locurile aprobate apar automat în
  secțiunile existente (deduplicate după nume față de conținutul curat).
- **AI Local Guide** (`/api/ai/local-guide`): când există bază aprobată,
  itinerariile (1/2/3/5/7 zile), recomandările gastronomice și cele pe
  persona se generează din ea; altfel, fallback pe planner-ul Bucovina.
- **AI Concierge** (`/api/ai/concierge`): întrebările despre zonă primesc
  contextul compact al bazei aprobate (`buildAiAreaContext`) drept fapte de
  grounding — inclusiv categoriile practice (farmacii, benzinării, transport).
- **AI Stay Planner / Upselling / Marketing / Receptionist** (viitor): toate
  consumă aceleași API-uri din `lib/intelligence/planner.ts`.

## Funcționalități adăugate peste cerință (și de ce)

1. **Categorii practice (farmacie, spital, benzinărie, ATM, transport)** —
   un concierge care știe doar muzee e un ghid turistic; unul care știe și
   farmacia non-stop e un serviciu de ospitalitate. Diferența se simte exact
   în momentele critice pentru oaspete.
2. **Scor de calitate determinist** — coada de moderare pentru o rază de
   50 km poate avea sute de locuri; fără ordonare inteligentă, review-ul
   devine corvoadă și feature-ul moare. Scorul aduce întâi ce merită aprobat.
3. **„Aprobă toată categoria"** — onboarding-ul în 2 minute e imposibil cu
   aprobare bucată-cu-bucată; bulk-approve face demo-ul (și viața) rapide.
4. **Memoria respingerilor la re-scanare** — fără ea, scheduler-ul săptămânal
   ar re-propune la nesfârșit locurile refuzate, iar adminul ar dezactiva
   feature-ul în două săptămâni.
5. **Set demo integrat** — produsul se poate demonstra la vânzare fără chei
   API, fără Supabase și fără internet; exact fluxul SaaS „încearcă înainte
   să configurezi".
6. **Fixare în top (pin)** — proprietarul are parteneriate locale (restaurantul
   prietenului, producătorul din sat); pin-ul îi dă control comercial asupra
   recomandărilor fără să corupă datele.

## Roadmap (nefăcut încă, în ordinea valorii)

1. **Enrichment AI batch** — generare descrieri RO/EN pentru locurile aprobate
   fără descriere (un apel LLM per loc, o singură dată, salvat în DB).
2. **Notificări admin** — email/WhatsApp la finalul scanării programate cu
   diff-ul („3 restaurante noi, 1 traseu"), peste `lib/integrations/email.ts`.
3. **Fotografii** — Wikimedia Commons pentru obiectivele cu tag `wikidata`
   (licențiere curată), upload manual pentru rest; pool-uri per categorie ca
   fallback (deja folosite în Explore).
4. **Evenimente locale** — OSM nu acoperă evenimente; sursă separată
   (API-uri de evenimente / scraping curat / introducere manuală asistată).
5. **Multi-property** — schema are deja `property_id` peste tot; UI-ul de
   selecție a proprietății active e pasul rămas pentru lanțuri hoteliere.
6. **Google Places ca enrichment opțional** — rating/telefon/program mai bune,
   per client care își aduce cheia (cost al clientului, nu al platformei).
