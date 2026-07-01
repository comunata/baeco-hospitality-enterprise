"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { upsertPage } from "@/lib/data/pages";
import { assertAdminRole } from "@/lib/admin/session";

const pageSchema = z.object({
  slug: z.string().min(1),
  titleRo: z.string().min(1, "Titlul (RO) este obligatoriu"),
  titleEn: z.string().optional(),
  subtitleRo: z.string().optional(),
  subtitleEn: z.string().optional(),
  bodyRo: z.string().optional(),
  bodyEn: z.string().optional(),
  gallery: z.string().optional(),
});

export interface PageFormState {
  error?: string;
}

function linesToArray(value?: string): string[] {
  if (!value) return [];
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export async function savePageAction(_prevState: PageFormState, formData: FormData): Promise<PageFormState> {
  await assertAdminRole("owner", "manager");
  const raw = Object.fromEntries(formData.entries());
  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide." };
  }
  const data = parsed.data;

  try {
    await upsertPage({
      slug: data.slug,
      title: { ro: data.titleRo, en: data.titleEn?.trim() || data.titleRo },
      subtitle: { ro: data.subtitleRo ?? "", en: data.subtitleEn?.trim() || data.subtitleRo || "" },
      body: { ro: data.bodyRo ?? "", en: data.bodyEn?.trim() || data.bodyRo || "" },
      gallery: linesToArray(data.gallery),
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "A apărut o eroare la salvare." };
  }

  revalidatePath(`/admin/pages/${data.slug}`);
  revalidatePath(`/${data.slug}`);
  redirect("/admin/pages");
}
