import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog-editor";
import { requireOwner } from "@/lib/cms/auth";
import { CmsError } from "@/lib/cms/errors";
import { getDraft } from "@/lib/cms/posts";
import { listMedia } from "@/lib/cms/media";

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireOwner(); }
  catch (error) {
    if (error instanceof CmsError && error.code === "UNAUTHENTICATED") redirect("/admin/login");
    if (error instanceof CmsError && error.code === "FORBIDDEN") redirect("/admin");
    throw error;
  }
  const { id } = await params;
  const [draft, media] = await Promise.all([id === "new" ? null : getDraft(id), listMedia()]);
  if (id !== "new" && !draft) notFound();
  return <BlogEditor initial={draft} initialMedia={media} suggestedSlug={`post-${randomUUID().slice(0,8)}`} today={new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date())} />;
}
