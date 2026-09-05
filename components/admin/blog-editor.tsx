"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { Tabs } from "@base-ui/react/tabs";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { TiptapEditor, type EditorMediaItem } from "@/components/editor/tiptap-editor";
import { TiptapContent } from "@/components/blog/tiptap-content";
import { EMPTY_DOCUMENT, parseTiptapDocument } from "@/lib/cms/document";
import type { DraftPost, PublicationInfo } from "@/lib/cms/posts";
import type { MediaAsset } from "@/lib/cms/media";
import type { BlogCategory } from "@/lib/content/schema";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { saveDraftAction, publishPostAction, unpublishPostAction, prepareMediaAction, completeMediaAction, loadMediaAction } from "@/app/admin/actions";

type Fields = { title: string; slug: string; description: string; date: string; category: BlogCategory; tagsText: string; body: JSONContent };
function mediaItem(asset: MediaAsset): EditorMediaItem { return { id: asset.id, name: asset.filename, url: asset.src, alt: asset.alt }; }

type Recovery = { fields: Fields; revision: number | null };
const RECOVERY_PREFIX = "portfolio-draft-recovery:";

function writeRecovery(key: string, fields: Fields, revision: number | null) {
  try { sessionStorage.setItem(key, JSON.stringify({ fields, revision })); } catch { /* The unload guard still protects tabs with storage disabled. */ }
}
function clearRecovery(key: string) {
  try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
}
function readRecovery(key: string): Recovery | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("fields" in value)) return null;
    const fields = (value as Recovery).fields;
    if (!fields || [fields.title, fields.slug, fields.description, fields.date, fields.tagsText].some(item => typeof item !== "string")) return null;
    if (!["tech", "photo", "daily"].includes(fields.category)) return null;
    parseTiptapDocument(fields.body);
    return { fields, revision: "revision" in value && typeof value.revision === "number" ? value.revision : null };
  } catch { return null; }
}

export function BlogEditor({ initial, initialMedia, suggestedSlug, today }: { initial: DraftPost | null; initialMedia: MediaAsset[]; suggestedSlug: string; today: string }) {
  const [fields, setFields] = useState<Fields>(() => ({ title: initial?.title ?? "", slug: initial?.slug ?? suggestedSlug, description: initial?.description ?? "", date: initial?.date ?? today, category: initial?.category ?? "tech", tagsText: initial?.tags.join(", ") ?? "", body: initial?.body ?? EMPTY_DOCUMENT }));
  const [publication, setPublication] = useState<PublicationInfo | null>(initial?.publication ?? null);
  const [media, setMedia] = useState(initialMedia.map(mediaItem));
  const mediaOffset = useRef(initialMedia.length);
  const mediaLoading = useRef(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(initialMedia.length === 60);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [status, setStatus] = useState("下書き");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [tab, setTab] = useState("write");
  const [uploading, setUploading] = useState(0);
  const [persisted, setPersisted] = useState(initial !== null);
  const [savedValue, setSavedValue] = useState(() => JSON.stringify(fields));
  const [recovery, setRecovery] = useState<Recovery | null>(null);
  const [reviewRecovery, setReviewRecovery] = useState(false);
  const recoveryKey = useRef(`${RECOVERY_PREFIX}${initial?.id ?? "new"}`);
  const mounted = useRef(true);
  const uploadingCount = useRef(0);
  const publishingNow = useRef(false);
  const navigating = useRef(false);
  const live = useRef(fields);
  const saved = useRef<DraftPost | null>(initial);
  const savedSnapshot = useRef(JSON.stringify(fields));
  const pendingSave = useRef<Promise<DraftPost> | null>(null);
  const dirty = JSON.stringify(fields) !== savedValue;
  const locked = publishing || uploading > 0 || recovery !== null;

  const change = useCallback((patch: Partial<Fields>) => {
    if (publishingNow.current) return;
    const next = { ...live.current, ...patch };
    live.current = next;
    setFields(next);
    writeRecovery(recoveryKey.current, next, saved.current?.revision ?? null);
  }, []);

  const save = useCallback(async (): Promise<DraftPost> => {
    // Recheck after every awaited save: multiple callers can wake together.
    for (;;) {
      while (pendingSave.current) await pendingSave.current;
      if (!mounted.current) throw new Error("編集画面を開き直してください。");
      const snapshot = JSON.stringify(live.current);
      if (snapshot === savedSnapshot.current && saved.current) return saved.current;
      const values = live.current;
      setStatus("保存中…"); setError("");
      const task = (async () => {
        const result = await saveDraftAction({
          ...(saved.current ? { id: saved.current.id, expectedRevision: saved.current.revision } : {}),
          title: values.title, slug: values.slug, description: values.description, date: values.date, category: values.category,
          tags: values.tagsText.split(",").map(tag => tag.trim()).filter(Boolean), body: values.body,
        });
        if (!result.ok) throw new Error(result.error);
        saved.current = result.data;
        savedSnapshot.current = snapshot;
        const oldKey = recoveryKey.current;
        recoveryKey.current = `${RECOVERY_PREFIX}${result.data.id}`;
        if (oldKey !== recoveryKey.current) clearRecovery(oldKey);
        if (JSON.stringify(live.current) === snapshot) clearRecovery(recoveryKey.current);
        else writeRecovery(recoveryKey.current, live.current, result.data.revision);
        if (mounted.current) {
          setSavedValue(snapshot); setPersisted(true); setReviewRecovery(false);
          setPublication(result.data.publication); setStatus("保存済み");
          // Preserve the mounted editor and undo history when assigning its URL.
          const editorPath = `/admin/blog/${result.data.id}`;
          if (window.location.pathname === "/admin/blog/new" || window.location.pathname === editorPath) {
            window.history.replaceState(null, "", editorPath);
          }
        }
        return result.data;
      })();
      pendingSave.current = task;
      try { await task; }
      catch (cause) {
        if (mounted.current) {
          setStatus("未保存");
          setError(cause instanceof Error ? cause.message : "保存に失敗しました。");
        }
        throw cause;
      } finally { if (pendingSave.current === task) pendingSave.current = null; }
      // Flush edits made during the request before a caller publishes or leaves.
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const stored = readRecovery(recoveryKey.current);
    if (stored && JSON.stringify(stored.fields) !== savedSnapshot.current) setRecovery(stored);
    else if (stored) clearRecovery(recoveryKey.current);
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!dirty || locked || reviewRecovery || !fields.title.trim() || !fields.slug.trim()) return;
    const timer = window.setTimeout(() => { void save().catch(() => {}); }, 1200);
    return () => window.clearTimeout(timer);
  }, [fields, dirty, locked, reviewRecovery, save]);

  useEffect(() => {
    const hasWork = () => JSON.stringify(live.current) !== savedSnapshot.current || !!pendingSave.current || uploadingCount.current > 0;
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (!hasWork()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (!["http:", "https:"].includes(destination.protocol)) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search && destination.origin === window.location.origin) return;
      if (!hasWork() && !publishingNow.current) return;
      event.preventDefault(); event.stopPropagation();
      if (reviewRecovery) {
        setError("復元した文章を確認して保存してから移動してください。");
        return;
      }
      if (uploadingCount.current > 0 || publishingNow.current) {
        setError("画像のアップロードや公開処理が終わってから移動してください。");
        return;
      }
      if (navigating.current) return;
      navigating.current = true;
      void save().then(() => { if (mounted.current) window.location.assign(destination.href); })
        .catch(() => {})
        .finally(() => { navigating.current = false; });
    };
    window.addEventListener("beforeunload", preventLoss);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", preventLoss);
      document.removeEventListener("click", navigate, true);
    };
  }, [save, reviewRecovery]);

  async function publish() {
    if (publishingNow.current || uploadingCount.current > 0) return;
    publishingNow.current = true;
    setPublishing(true); setError("");
    try {
      const draft = await save();
      const result = await publishPostAction(draft.id, draft.revision);
      if (!result.ok) throw new Error(result.error);
      const info = { slug: result.data.slug, publishedAt: result.data.publishedAt, revision: result.data.revision };
      saved.current = { ...draft, publication: info };
      if (mounted.current) { setPublication(info); setStatus("公開しました"); }
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "公開できませんでした。"); }
    finally { publishingNow.current = false; if (mounted.current) setPublishing(false); }
  }
  async function unpublish() {
    if (!saved.current) return;
    if (publishingNow.current || uploadingCount.current > 0) return;
    publishingNow.current = true;
    setPublishing(true); setError("");
    try {
      while (pendingSave.current) {
        try { await pendingSave.current; } catch { /* An invalid draft should not prevent unpublishing. */ }
      }
      const result = await unpublishPostAction(saved.current.id);
      if (!result.ok) throw new Error(result.error);
      saved.current = { ...saved.current, publication: null };
      if (mounted.current) { setPublication(null); setStatus("下書きに戻しました"); }
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "非公開にできませんでした。"); }
    finally { publishingNow.current = false; if (mounted.current) setPublishing(false); }
  }
  async function upload(files: File[]) {
    if (mediaLoading.current) throw new Error("画像ライブラリの読み込みが終わってから追加してください。");
    uploadingCount.current += 1;
    setUploading(uploadingCount.current);
    const uploaded: EditorMediaItem[] = [];
    try {
      const client = createBrowserSupabaseClient();
      for (const file of files) {
        const prepared = await prepareMediaAction({ name: file.name, mimeType: file.type, size: file.size });
        if (!prepared.ok) throw new Error(prepared.error);
        const target = prepared.data;
        const result = await client.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type });
        if (result.error) throw new Error("画像をアップロードできませんでした。もう一度お試しください。");
        const completed = await completeMediaAction({ id: target.id, path: target.path, name: file.name });
        if (!completed.ok) throw new Error(completed.error);
        const item = mediaItem(completed.data); uploaded.push(item);
        mediaOffset.current += 1;
        if (mounted.current) setMedia(items => [item, ...items.filter(existing => existing.id !== item.id)]);
      }
      return uploaded;
    } finally { uploadingCount.current -= 1; if (mounted.current) setUploading(uploadingCount.current); }
  }
  async function loadMore() {
    if (mediaLoading.current || uploadingCount.current > 0) return;
    mediaLoading.current = true;
    setLoadingMedia(true);
    try {
      const result = await loadMediaAction(mediaOffset.current);
      if (!result.ok) throw new Error(result.error);
      mediaOffset.current += result.data.length;
      if (mounted.current) {
        setMedia(items => [...new Map([...items, ...result.data.map(mediaItem)].map(item => [item.id, item])).values()]);
        setHasMoreMedia(result.data.length === 60);
      }
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "画像を読み込めませんでした。"); }
    finally { mediaLoading.current = false; if (mounted.current) setLoadingMedia(false); }
  }
  let preview: ReturnType<typeof parseTiptapDocument> | null = null;
  if (tab === "preview") { try { preview = parseTiptapDocument(fields.body); } catch { /* An upload may still be pending. */ } }

  return <div>
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={15} aria-hidden />記事一覧</Link>
      <div className="flex flex-wrap items-center gap-3">
        <span role="status" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{status === "保存中…" ? <Loader2 size={12} className="animate-spin" /> : !dirty && persisted ? <Check size={12} /> : null}{dirty && status !== "保存中…" ? "未保存" : status}</span>
        <button className="button" disabled={locked} onClick={() => { void save().catch(() => {}); }}>保存</button>
        {publication && <a href={`/blog/${publication.slug}`} target="_blank" rel="noopener noreferrer" className="hidden text-xs text-muted-foreground sm:block">公開ページ ↗</a>}
        <button className="button-primary" disabled={locked || !fields.title.trim()} onClick={() => { void publish(); }}>{publishing ? "処理中…" : publication ? "公開内容を更新" : "公開する"}</button>
      </div>
    </header>
    {error && <p role="alert" className="mb-6 rounded-md bg-surface p-4 text-sm">{error} 入力内容はこの画面に残っています。</p>}
    {recovery && <div role="status" className="mb-6 rounded-md border border-border p-4 text-sm"><p>このタブに未保存の内容が残っています。復元後に内容を確認して保存してください。</p><div className="mt-3 flex gap-3"><button type="button" className="button" onClick={() => { change(recovery.fields); setReviewRecovery(true); setRecovery(null); setStatus("復元した下書き"); }}>復元する</button><button type="button" className="button" onClick={() => { clearRecovery(recoveryKey.current); setRecovery(null); }}>破棄する</button></div></div>}
    {reviewRecovery && <p role="status" className="mb-6 text-sm text-muted-foreground">復元した文章を確認し、「保存」を押してください。自動保存は一時停止しています。</p>}
    <fieldset disabled={publishing || recovery !== null} className="min-w-0">
      <div className="mb-8 max-w-3xl space-y-5">
        <input aria-label="記事タイトル" placeholder="記事のタイトル" value={fields.title} onChange={event => change({ title: event.target.value })} className="w-full border-0 bg-transparent text-2xl font-medium tracking-tight outline-none placeholder:text-muted-foreground/60 sm:text-3xl" />
        <textarea aria-label="記事の概要" placeholder="記事の概要" value={fields.description} onChange={event => change({ description: event.target.value })} rows={2} className="w-full resize-y bg-transparent text-sm leading-7 text-muted-foreground outline-none" />
      </div>
      <Tabs.Root value={tab} onValueChange={value => setTab(String(value))}>
        <Tabs.List className="mb-6 flex gap-6 border-b border-border"><Tabs.Tab value="write" className="pb-3 text-sm text-muted-foreground data-[active]:border-b data-[active]:border-foreground data-[active]:text-foreground">執筆</Tabs.Tab><Tabs.Tab value="preview" className="pb-3 text-sm text-muted-foreground data-[active]:border-b data-[active]:border-foreground data-[active]:text-foreground">プレビュー</Tabs.Tab><Tabs.Tab value="settings" className="pb-3 text-sm text-muted-foreground data-[active]:border-b data-[active]:border-foreground data-[active]:text-foreground">記事の設定</Tabs.Tab></Tabs.List>
        <Tabs.Panel value="write" keepMounted className="data-[hidden]:hidden"><div className={publishing ? "pointer-events-none opacity-70" : ""}><TiptapEditor readOnly={publishing || recovery !== null} value={fields.body} onChange={body => change({ body })} onUpload={upload} media={media} busy={locked || loadingMedia} /></div>{hasMoreMedia && <button className="button mt-4" disabled={loadingMedia || uploading > 0} onClick={() => void loadMore()}>{loadingMedia ? "読み込み中…" : "画像をさらに読み込む"}</button>}</Tabs.Panel>
        <Tabs.Panel value="preview" className="mx-auto max-w-3xl py-10"><h1 className="mb-10 text-3xl font-medium tracking-tight">{fields.title || "記事のタイトル"}</h1>{preview ? <TiptapContent document={preview} /> : <p className="text-sm text-muted-foreground">画像のアップロード完了をお待ちください。</p>}</Tabs.Panel>
        <Tabs.Panel value="settings" className="max-w-xl space-y-6 py-6">
          <label className="block space-y-2 text-sm"><span>記事のURL</span><div className="flex items-center gap-2"><span className="text-muted-foreground">/blog/</span><input className="field" value={fields.slug} onChange={event => change({ slug: event.target.value })} /></div></label>
          <label className="block space-y-2 text-sm"><span>日付</span><input type="date" className="field" value={fields.date} onChange={event => change({ date: event.target.value })} /></label>
          <label className="block space-y-2 text-sm"><span>カテゴリ</span><select className="field" value={fields.category} onChange={event => change({ category: event.target.value as BlogCategory })}><option value="tech">技術</option><option value="photo">写真</option><option value="daily">日常</option></select></label>
          <label className="block space-y-2 text-sm"><span>タグ（カンマ区切り）</span><input className="field" value={fields.tagsText} onChange={event => change({ tagsText: event.target.value })} /></label>
          {publication && <AlertDialog.Root><AlertDialog.Trigger className="button">非公開にする</AlertDialog.Trigger><AlertDialog.Portal><AlertDialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20" /><AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-background p-6 shadow-xl"><AlertDialog.Title className="font-medium">記事を非公開にしますか？</AlertDialog.Title><AlertDialog.Description className="mt-3 text-sm leading-7 text-muted-foreground">下書きと画像は残ります。後からもう一度公開できます。</AlertDialog.Description><div className="mt-6 flex justify-end gap-3"><AlertDialog.Close className="button">キャンセル</AlertDialog.Close><AlertDialog.Close className="button-primary" onClick={() => void unpublish()}>非公開にする</AlertDialog.Close></div></AlertDialog.Popup></AlertDialog.Portal></AlertDialog.Root>}
        </Tabs.Panel>
      </Tabs.Root>
    </fieldset>
  </div>;
}
