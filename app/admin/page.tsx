import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/cms/auth";
import { CmsError } from "@/lib/cms/errors";
import { listDrafts } from "@/lib/cms/posts";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SignOut } from "@/components/admin/sign-out";

export default async function AdminPage() {
  if (!getSupabaseConfig()) redirect("/admin/login");
  let ownerError = false;
  try { await requireOwner(); }
  catch (error) {
    if (error instanceof CmsError && error.code === "UNAUTHENTICATED") redirect("/admin/login");
    if (error instanceof CmsError && error.code === "FORBIDDEN") ownerError = true;
    else throw error;
  }
  if (ownerError) {
    const client = await createServerSupabaseClient();
    const { data: { user } } = await client.auth.getUser();
    return <div className="mx-auto max-w-lg py-16"><h1 className="text-2xl font-medium">編集権限がありません</h1><p className="mt-5 text-sm leading-7 text-muted-foreground">記事を編集するには、このアカウントの管理者登録が必要です。登録には、以下のユーザーIDを使用してください。</p><code className="my-6 block break-all rounded-md bg-surface p-4 text-xs select-all">{user?.id}</code><SignOut /></div>;
  }
  const drafts = await listDrafts();
  return <div className="mx-auto max-w-4xl">
    <header className="mb-10 flex items-center justify-between gap-5"><div><h1 className="text-2xl font-medium tracking-tight">記事</h1><p className="mt-3 text-sm text-muted-foreground">{drafts.length} 件の記事</p></div><div className="flex items-center gap-6"><SignOut /><Link href="/admin/blog/new" className="button-primary">記事を書く</Link></div></header>
    {drafts.length ? <ul className="divide-y divide-border">{drafts.map(draft => <li key={draft.id}><Link href={`/admin/blog/${draft.id}`} className="flex items-start justify-between gap-6 py-6"><div><h2 className="font-medium">{draft.title}</h2><p className="mt-2 text-xs text-muted-foreground">/{draft.slug}</p></div><span className="shrink-0 text-xs text-muted-foreground">{draft.publication ? draft.publication.revision === draft.revision ? "公開中" : "未公開の変更あり" : "下書き"}</span></Link></li>)}</ul> : <div className="py-20 text-center"><p className="text-sm text-muted-foreground">まだ記事がありません。</p><Link href="/admin/blog/new" className="mt-4 inline-block text-sm underline underline-offset-4">最初の記事を書く</Link></div>}
    <p className="mt-12 text-xs text-muted-foreground">下書きの変更は「公開する」を押すとサイトに反映されます。</p>
  </div>;
}
