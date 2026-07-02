"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdminRole } from "@/lib/admin/session";
import { geocodeAddress } from "@/lib/discovery/geocode";
import { runDiscoveryScan } from "@/lib/discovery/engine";
import { BD_CATEGORIES, RADIUS_OPTIONS_KM, type BdCategory } from "@/lib/discovery/types";
import {
  savePropertyProfile,
  getPropertyProfile,
  ingestCandidates,
  recordScan,
  markDiscoveryRun,
  setPlaceStatus,
  setPlacesStatusBulk,
  setPlacePinned,
  deletePlace,
  updatePlace,
  listPlaces,
} from "@/lib/data/discovery";

const REVALIDATE_PATHS = ["/admin/discovery", "/ro/explore", "/en/explore"];

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

// ---------------------------------------------------------------------------
// Property profile (2-minute onboarding)
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().min(2, "Numele proprietății este obligatoriu"),
  category: z.enum(["hotel", "guesthouse", "villa", "apartment", "resort", "chain"]),
  address: z.string().min(5, "Adresa este obligatorie"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  discoveryRadiusKm: z.coerce.number(),
  geocode: z.string().optional(), // "1" = resolve address → GPS + admin area
});

export interface ProfileFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  info?: string;
}

export async function savePropertyAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  await assertAdminRole("HOTEL_ADMIN");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { error: "Verifică datele introduse.", fieldErrors };
  }
  const data = parsed.data;

  let { lat, lng } = data;
  let locality: string | undefined;
  let county: string | undefined;
  let region: string | undefined;
  let country: string | undefined;
  let info: string | undefined;

  if (data.geocode === "1") {
    const geo = await geocodeAddress(data.address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      locality = geo.locality;
      county = geo.county;
      region = geo.region;
      country = geo.country;
      info = `Geocodat: ${geo.displayName}`;
    } else {
      info = "Geocodarea nu este disponibilă momentan — folosim coordonatele introduse manual.";
    }
  }

  try {
    await savePropertyProfile({
      name: data.name,
      category: data.category,
      address: data.address,
      lat,
      lng,
      locality,
      county,
      region,
      country,
      discoveryRadiusKm: data.discoveryRadiusKm,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Eroare la salvare." };
  }

  revalidateAll();
  return { info: info ?? "Profil salvat." };
}

// ---------------------------------------------------------------------------
// Discovery scan
// ---------------------------------------------------------------------------

export interface ScanFormState {
  error?: string;
  summary?: string;
}

export async function runScanAction(_prev: ScanFormState, formData: FormData): Promise<ScanFormState> {
  await assertAdminRole("HOTEL_ADMIN");

  const radiusRaw = Number(formData.get("radiusKm"));
  const radiusKm = (RADIUS_OPTIONS_KM as readonly number[]).includes(radiusRaw) ? radiusRaw : 25;
  const selected = formData.getAll("categories").map(String).filter((c): c is BdCategory => (BD_CATEGORIES as readonly string[]).includes(c));

  const profile = await getPropertyProfile();
  if (!profile.lat || !profile.lng) {
    return { error: "Setează întâi coordonatele proprietății." };
  }

  try {
    const { candidates, source } = await runDiscoveryScan({ lat: profile.lat, lng: profile.lng, radiusKm, categories: selected });
    const newCount = await ingestCandidates(candidates);
    await recordScan({
      trigger: "manual",
      radiusKm,
      categories: selected.length ? selected : [...BD_CATEGORIES],
      status: "completed",
      foundCount: candidates.length,
      newCount,
      message: source === "sample" ? "Sursă: set demo (API OSM indisponibil)" : "Sursă: OpenStreetMap",
    });
    await markDiscoveryRun();
    revalidateAll();
    return { summary: `Scanare completă: ${candidates.length} locuri găsite, ${newCount} noi adăugate în coadă.` };
  } catch (err) {
    await recordScan({ trigger: "manual", radiusKm, categories: selected, status: "failed", foundCount: 0, newCount: 0, message: err instanceof Error ? err.message : "eroare" });
    return { error: "Scanarea a eșuat. Încearcă din nou." };
  }
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------

export async function approvePlaceAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await setPlaceStatus(id, "approved");
  revalidateAll();
}

export async function rejectPlaceAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await setPlaceStatus(id, "rejected");
  revalidateAll();
}

export async function restorePlaceAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await setPlaceStatus(id, "pending");
  revalidateAll();
}

export async function togglePinAction(id: string, pinned: boolean): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await setPlacePinned(id, pinned);
  revalidateAll();
}

export async function deletePlaceAction(id: string): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  await deletePlace(id);
  revalidateAll();
}

export async function approveCategoryAction(category: BdCategory): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  const pending = await listPlaces({ status: "pending", category });
  await setPlacesStatusBulk(pending.map((p) => p.id), "approved");
  revalidateAll();
}

const editSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  descriptionRo: z.string().optional(),
  descriptionEn: z.string().optional(),
  image: z.string().optional(),
});

export async function editPlaceAction(formData: FormData): Promise<void> {
  await assertAdminRole("HOTEL_ADMIN");
  const parsed = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return;
  const { id, name, descriptionRo, descriptionEn, image } = parsed.data;
  await updatePlace(id, {
    name,
    description: { ro: descriptionRo ?? "", en: descriptionEn ?? descriptionRo ?? "" },
    image: image?.trim() || undefined,
  });
  revalidateAll();
}
