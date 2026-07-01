import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getPage } from "@/lib/data/pages";
import { PageContentForm } from "../PageContentForm";

const EDITABLE_SLUGS = ["restaurant", "spa", "pool", "facilities", "gallery"];

export default async function EditPageContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!EDITABLE_SLUGS.includes(slug)) notFound();

  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <div>
      <AdminPageHeader title={`Editează: ${page.title.ro}`} />
      <PageContentForm page={page} />
    </div>
  );
}
