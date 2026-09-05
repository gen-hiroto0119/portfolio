import "server-only";

import { requireOwner } from "@/lib/cms/auth";
import { documentAssetIds, parseTiptapDocument, type TiptapDocument } from "@/lib/cms/document";
import { CmsError, databaseError } from "@/lib/cms/errors";
import { parseDraftInput, parsePostId, parseRevision } from "@/lib/cms/schema";
import { blogCategorySchema, type BlogCategory } from "@/lib/content/schema";
import type { BlogDraftRow, BlogPublicationRow, Json } from "@/lib/supabase/database.types";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

export type CmsPostMetadata = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  category: BlogCategory;
  tags: string[];
};
export type PublicationInfo = { slug: string; publishedAt: string; revision: number };
export type DraftSummary = CmsPostMetadata & {
  revision: number;
  createdAt: string;
  updatedAt: string;
  publication: PublicationInfo | null;
};
export type DraftPost = DraftSummary & { body: TiptapDocument };
export type PublishedPostSummary = CmsPostMetadata & { published: true; publishedAt: string; revision: number };
export type PublishedPost = PublishedPostSummary & { body: TiptapDocument };

const DRAFT_META = "id,slug,title,description,date,category,tags,revision,created_at,updated_at" as const;
const PUBLIC_META = "post_id,slug,title,description,date,category,tags,published_at,source_revision" as const;

function metadata(row: Pick<BlogDraftRow, "slug" | "title" | "description" | "date" | "category" | "tags">): Omit<CmsPostMetadata, "id"> {
  return { slug: row.slug, title: row.title, description: row.description, date: row.date, category: blogCategorySchema.parse(row.category), tags: row.tags };
}

function publicationInfo(row: Pick<BlogPublicationRow, "slug" | "published_at" | "source_revision"> | null): PublicationInfo | null {
  return row ? { slug: row.slug, publishedAt: row.published_at, revision: row.source_revision } : null;
}

function publicSummary(row: Omit<BlogPublicationRow, "owner_id" | "body_json">): PublishedPostSummary {
  return { id: row.post_id, ...metadata(row), published: true, publishedAt: row.published_at, revision: row.source_revision };
}

export async function listPublishedPosts(): Promise<PublishedPostSummary[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("blog_publications").select(PUBLIC_META).order("date", { ascending: false }).order("published_at", { ascending: false });
  if (error) throw databaseError(error);
  return data.map(publicSummary);
}

export async function getPublishedPost(slug: string): Promise<PublishedPost | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("blog_publications").select(`${PUBLIC_META},body_json`).eq("slug", slug).maybeSingle();
  if (error) throw databaseError(error);
  return data ? { ...publicSummary(data), body: parseTiptapDocument(data.body_json) } : null;
}

export async function listDrafts(): Promise<DraftSummary[]> {
  const { supabase } = await requireOwner();
  const [drafts, publications] = await Promise.all([
    supabase.from("blog_drafts").select(DRAFT_META).order("updated_at", { ascending: false }),
    supabase.from("blog_publications").select("post_id,slug,published_at,source_revision"),
  ]);
  if (drafts.error) throw databaseError(drafts.error);
  if (publications.error) throw databaseError(publications.error);
  const published = new Map(publications.data.map((post) => [post.post_id, post]));
  return drafts.data.map((draft) => ({
    id: draft.id, ...metadata(draft), revision: draft.revision, createdAt: draft.created_at, updatedAt: draft.updated_at,
    publication: publicationInfo(published.get(draft.id) ?? null),
  }));
}

export async function getDraft(id: string): Promise<DraftPost | null> {
  const { supabase } = await requireOwner();
  const postId = parsePostId(id);
  const [draft, publication] = await Promise.all([
    supabase.from("blog_drafts").select("*").eq("id", postId).maybeSingle(),
    supabase.from("blog_publications").select("slug,published_at,source_revision").eq("post_id", postId).maybeSingle(),
  ]);
  if (draft.error) throw databaseError(draft.error);
  if (publication.error) throw databaseError(publication.error);
  if (!draft.data) return null;
  const row = draft.data;
  return {
    id: row.id, ...metadata(row), body: parseTiptapDocument(row.body_json), revision: row.revision,
    createdAt: row.created_at, updatedAt: row.updated_at, publication: publicationInfo(publication.data),
  };
}

export async function saveDraft(input: unknown): Promise<DraftPost> {
  const { supabase, user } = await requireOwner();
  const draft = parseDraftInput(input);
  const assetIds = documentAssetIds(draft.body);
  if (assetIds.length) {
    const { data, error } = await supabase.from("media_assets").select("id").eq("owner_id", user.id).in("id", assetIds);
    if (error) throw databaseError(error);
    if (data.length !== assetIds.length) throw new CmsError("VALIDATION", "アップロードが完了していない画像があります。");
  }
  const values = {
    owner_id: user.id, slug: draft.slug, title: draft.title, description: draft.description,
    date: draft.date, category: draft.category, tags: draft.tags, body_json: draft.body as Json,
  };
  const result = draft.id
    ? await supabase.from("blog_drafts").update({ ...values, revision: draft.expectedRevision! + 1 }).eq("id", draft.id).eq("revision", draft.expectedRevision!).select("*").maybeSingle()
    : await supabase.from("blog_drafts").insert(values).select("*").single();
  if (result.error) throw databaseError(result.error);
  if (!result.data) throw new CmsError("CONFLICT", "別のタブで更新されたか、記事が削除されました。再読み込みしてください。");
  const publication = await supabase.from("blog_publications").select("slug,published_at,source_revision").eq("post_id", result.data.id).maybeSingle();
  if (publication.error) throw databaseError(publication.error);
  const row = result.data;
  return {
    id: row.id, ...metadata(row), body: parseTiptapDocument(row.body_json), revision: row.revision,
    createdAt: row.created_at, updatedAt: row.updated_at, publication: publicationInfo(publication.data),
  };
}

export async function publishPost(id: string, expectedRevision: number): Promise<PublishedPost> {
  const { supabase } = await requireOwner();
  const postId = parsePostId(id);
  const revision = parseRevision(expectedRevision);
  const draft = await supabase.from("blog_drafts").select("body_json").eq("id", postId).maybeSingle();
  if (draft.error) throw databaseError(draft.error);
  if (!draft.data) throw new CmsError("NOT_FOUND", "記事が見つかりません。");
  parseTiptapDocument(draft.data.body_json);
  // The RPC locks the draft and checks the revision before copying its snapshot.
  const { data, error } = await supabase.rpc("publish_blog_post", { p_post_id: postId, p_expected_revision: revision }).single();
  if (error) throw databaseError(error);
  return { ...publicSummary(data), body: parseTiptapDocument(data.body_json) };
}

export async function unpublishPost(id: string): Promise<{ slug: string }> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase.rpc("unpublish_blog_post", { p_post_id: parsePostId(id) });
  if (error) throw databaseError(error);
  return { slug: data };
}
