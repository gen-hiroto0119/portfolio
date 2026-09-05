"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import type { Editor, JSONContent } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code2,
  Heading2,
  ImagePlus,
  Images,
  Italic,
  Link2,
  List,
  ListOrdered,
  PanelRightClose,
  Quote,
  Redo2,
  Undo2,
  Upload,
  X,
} from "lucide-react";

import { codeLanguages, lowlight } from "@/lib/syntax-highlight";
import { UploadAnchor, uploadAnchorKey } from "./upload-anchor";

export type EditorMediaItem = {
  id: string;
  url: string;
  alt?: string;
  name: string;
};

export type UploadedEditorImage = Omit<EditorMediaItem, "name">;

export type TiptapEditorProps = {
  value: JSONContent;
  onChange: (document: JSONContent) => void;
  onUpload?: (files: File[]) => Promise<UploadedEditorImage[]>;
  media: EditorMediaItem[];
  busy?: boolean;
  readOnly?: boolean;
};

const MEDIA_DRAG_TYPE = "application/x-portfolio-media";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const AssetImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-asset-id"),
        renderHTML: (attributes) => attributes.assetId ? { "data-asset-id": attributes.assetId } : {},
      },
    };
  },
});

function imageContent(image: UploadedEditorImage): JSONContent {
  return { type: "image", attrs: { src: image.url, alt: image.alt ?? "", assetId: image.id } };
}

function getCodeLanguage(editor: Editor | null): string {
  const language: unknown = editor?.getAttributes("codeBlock").language;
  return typeof language === "string" ? language : "";
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-35 ${active ? "bg-surface text-foreground" : "text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

export function TiptapEditor({ value, onChange, onUpload, media, busy = false, readOnly = false }: TiptapEditorProps) {
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [libraryTab, setLibraryTab] = useState("library");
  const [search, setSearch] = useState("");
  const [pendingUploads, setPendingUploads] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef({ onUpload, onChange, media, busy, readOnly });
  const lastEmittedValue = useRef<string | null>(null);
  const libraryId = useId();
  const linkId = useId();

  useEffect(() => {
    optionsRef.current = { onUpload, onChange, media, busy, readOnly };
  }, [onUpload, onChange, media, busy, readOnly]);

  const uploadImages = useCallback(async (editor: Editor, files: File[], position: number) => {
    const upload = optionsRef.current.onUpload;
    if (!files.length || editor.isDestroyed || optionsRef.current.readOnly) return;
    if (!upload) {
      setError("画像の保存先が設定されていません。接続設定を確認してください。");
      return;
    }
    if (optionsRef.current.busy) {
      setError("処理が終わってから、もう一度画像を追加してください。");
      return;
    }
    const invalid = files.find((file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) {
      setError(`${invalid.name}: PNG・JPEG・WebP・GIFの画像を、1枚10 MB以下で追加してください。`);
      return;
    }

    const id = crypto.randomUUID();
    editor.view.dispatch(editor.state.tr.setMeta(uploadAnchorKey, {
      add: { id, position, count: files.length },
    }));
    setError(null);
    setPendingUploads((count) => count + 1);

    try {
      const uploaded = await upload(files);
      if (editor.isDestroyed) return;
      const anchor = uploadAnchorKey.getState(editor.state)?.find(
        undefined, undefined, (spec) => spec.id === id,
      )[0];
      if (!anchor) return;
      if (!uploaded.length) throw new Error("画像が保存されませんでした。もう一度お試しください。");
      if (optionsRef.current.readOnly) throw new Error("画像は保存されました。編集を再開してからライブラリで挿入してください。");

      const inserted = editor.chain()
        .insertContentAt(anchor.from, uploaded.map(imageContent), { updateSelection: false })
        .setMeta(uploadAnchorKey, { remove: id })
        .run();
      if (!inserted) throw new Error("この位置には画像を挿入できません。ライブラリから別の位置に追加してください。");
      setLibraryTab("library");
    } catch (cause) {
      if (!editor.isDestroyed) {
        setError(cause instanceof Error ? cause.message : "画像をアップロードできませんでした。もう一度お試しください。");
      }
    } finally {
      if (!editor.isDestroyed) {
        editor.view.dispatch(editor.state.tr.setMeta(uploadAnchorKey, { remove: id }));
        setPendingUploads((count) => Math.max(0, count - 1));
      }
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3] },
        link: { openOnClick: false, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer" } },
        dropcursor: { color: "currentColor", width: 2 },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: null,
        HTMLAttributes: { class: "syntax-highlight" },
      }),
      AssetImage.configure({ HTMLAttributes: { class: "editor-image" } }),
      TableKit.configure({
        table: { resizable: false, renderWrapper: true, HTMLAttributes: { class: "my-6 w-full border-collapse text-left text-sm" } },
        tableCell: { HTMLAttributes: { class: "min-w-24 border border-border px-3 py-2 align-top" } },
        tableHeader: { HTMLAttributes: { class: "min-w-24 border border-border bg-surface px-3 py-2 text-left align-top font-medium" } },
      }),
      UploadAnchor,
      // FileHandler stores callbacks here and invokes them only on drop/paste events.
      // eslint-disable-next-line react-hooks/refs
      FileHandler.configure({
        consumePasteEvent: true,
        onDrop: (instance, files, position) => { void uploadImages(instance, files, position); },
        onPaste: (instance, files) => { void uploadImages(instance, files, instance.state.selection.from); },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "記事本文",
        "aria-multiline": "true",
        class: "min-h-[28rem] outline-none leading-[1.9] text-base text-foreground break-words",
      },
      handleDrop(view, event) {
        const id = event.dataTransfer?.getData(MEDIA_DRAG_TYPE);
        if (!id) return false;
        event.preventDefault();
        if (optionsRef.current.readOnly) return true;
        const item = optionsRef.current.media.find((candidate) => candidate.id === id);
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (!item || !position) return true;
        const image = view.state.schema.nodes.image.create({
          src: item.url,
          alt: item.alt ?? "",
          assetId: item.id,
        });
        view.dispatch(view.state.tr.replaceRangeWith(position.pos, position.pos, image));
        view.focus();
        return true;
      },
      handleDOMEvents: {
        dragover: (_view, event) => {
          if (event.dataTransfer?.types.includes(MEDIA_DRAG_TYPE)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor: instance }) => {
      const document = instance.getJSON();
      lastEmittedValue.current = JSON.stringify(document);
      optionsRef.current.onChange(document);
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable === readOnly) editor.setEditable(!readOnly, false);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;
    const serialized = JSON.stringify(value);
    // Saving normalizes empty content and default attributes. An equivalent
    // document must keep the selection, undo history, and pending upload anchors.
    if (serialized === lastEmittedValue.current || editor.schema.nodeFromJSON(value).eq(editor.state.doc)) return;
    editor.commands.setContent(value, { emitUpdate: false });
    editor.view.dispatch(editor.state.tr.setMeta(uploadAnchorKey, { clear: true }));
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => instance ? {
      heading: instance.isActive("heading"),
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      link: instance.isActive("link"),
      bulletList: instance.isActive("bulletList"),
      orderedList: instance.isActive("orderedList"),
      blockquote: instance.isActive("blockquote"),
      codeBlock: instance.isActive("codeBlock"),
      codeLanguage: getCodeLanguage(instance),
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
      characters: instance.getText().replace(/\s/g, "").length,
    } : null,
  });

  const insertMedia = (item: EditorMediaItem) => {
    if (!editor || readOnly) return;
    const inserted = editor.chain().focus().insertContent(imageContent(item)).run();
    if (!inserted) setError("この位置には画像を挿入できません。本文の別の位置を選んでください。");
  };

  const applyLink = (event: FormEvent) => {
    event.preventDefault();
    if (!editor || readOnly) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      if (!/^(https?:\/\/|mailto:)/i.test(url)) {
        setError("リンクは https://、http://、mailto: で始まるURLを入力してください。");
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setError(null);
    setLinkOpen(false);
  };

  const filteredMedia = media.filter((item) => `${item.name} ${item.alt ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const uploading = pendingUploads > 0;
  // The deferred editor can mount before useEditorState receives its first transaction.
  const characters = state?.characters ?? editor?.getText().replace(/\s/g, "").length ?? 0;
  const codeBlockActive = state?.codeBlock ?? editor?.isActive("codeBlock") ?? false;
  const codeLanguage = state?.codeLanguage ?? getCodeLanguage(editor);

  return (
    <section aria-label="記事エディタ" className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2">
        <div role="group" aria-label="文字と段落の書式" className="flex flex-wrap items-center gap-0.5">
          <ToolButton label="見出し" active={state?.heading} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={17} aria-hidden /></ToolButton>
          <ToolButton label="太字" active={state?.bold} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={17} aria-hidden /></ToolButton>
          <ToolButton label="斜体" active={state?.italic} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={17} aria-hidden /></ToolButton>
          <ToolButton label="リンク" active={state?.link} disabled={!editor || readOnly} onClick={() => {
            const href: unknown = editor?.getAttributes("link").href;
            setLinkUrl(typeof href === "string" ? href : "");
            setLinkOpen((open) => !open);
          }}><Link2 size={17} aria-hidden /></ToolButton>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <ToolButton label="箇条書き" active={state?.bulletList} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={17} aria-hidden /></ToolButton>
          <ToolButton label="番号付きリスト" active={state?.orderedList} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} aria-hidden /></ToolButton>
          <ToolButton label="引用" active={state?.blockquote} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={17} aria-hidden /></ToolButton>
          <ToolButton label="コードブロック" active={codeBlockActive} disabled={!editor || readOnly} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code2 size={17} aria-hidden /></ToolButton>
          {codeBlockActive && (
            <select
              aria-label="コードの言語"
              title="コードの言語"
              value={codeLanguage}
              disabled={!editor || readOnly}
              onChange={(event) => editor?.chain().focus().updateAttributes("codeBlock", { language: event.target.value || null }).run()}
              className="mx-1 h-8 max-w-40 rounded border border-border bg-background px-2 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            >
              {codeLanguage && !codeLanguages.some((language) => language.value === codeLanguage) && <option value={codeLanguage}>{codeLanguage}（既存の設定）</option>}
              {codeLanguages.map((language) => <option key={language.value} value={language.value}>{language.label}</option>)}
            </select>
          )}
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          <ToolButton label="元に戻す" disabled={readOnly || !state?.canUndo} onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={17} aria-hidden /></ToolButton>
          <ToolButton label="やり直す" disabled={readOnly || !state?.canRedo} onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={17} aria-hidden /></ToolButton>
        </div>
        <button type="button" aria-expanded={libraryOpen} aria-controls={libraryId} onClick={() => setLibraryOpen((open) => !open)} className="inline-flex min-h-9 items-center gap-2 rounded px-3 text-xs text-muted-foreground hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2">
          {libraryOpen ? <PanelRightClose size={16} aria-hidden /> : <Images size={16} aria-hidden />}
          画像ライブラリ
        </button>
      </div>

      {linkOpen && (
        <form onSubmit={applyLink} className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3">
          <label htmlFor={linkId} className="text-xs text-muted-foreground">リンク先</label>
          <input id={linkId} type="text" disabled={readOnly} inputMode="url" autoFocus value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" className="min-w-40 flex-1 rounded border border-border bg-background px-3 py-2 text-sm outline-offset-2" />
          <button type="submit" disabled={readOnly} className="rounded bg-foreground px-3 py-2 text-xs text-background">適用</button>
          <button type="button" disabled={readOnly} onClick={() => { editor?.chain().focus().extendMarkRange("link").unsetLink().run(); setLinkOpen(false); }} className="px-2 py-2 text-xs text-muted-foreground">解除</button>
          <button type="button" onClick={() => setLinkOpen(false)} aria-label="リンク編集を閉じる" className="rounded p-2 hover:bg-background"><X size={16} aria-hidden /></button>
        </form>
      )}

      {error && (
        <div role="alert" className="flex items-start justify-between gap-4 border-b border-border bg-surface px-4 py-3 text-sm">
          <p>{error}</p>
          <button type="button" aria-label="エラーを閉じる" onClick={() => setError(null)} className="shrink-0 rounded p-1"><X size={14} aria-hidden /></button>
        </div>
      )}

      <div className={libraryOpen ? "grid min-w-0 md:grid-cols-[minmax(0,1fr)_15rem]" : "min-w-0"}>
        <div className="min-w-0 px-6 py-8 sm:px-10 sm:py-10">
          {!editor && <p role="status" className="min-h-[28rem] text-sm text-muted-foreground">エディタを読み込んでいます…</p>}
          <EditorContent
            editor={editor}
            className="[&_.tableWrapper]:overflow-x-auto [&_.selectedCell]:bg-surface [&_.tiptap>p]:mb-5 [&_.tiptap_h2]:mb-5 [&_.tiptap_h2]:mt-10 [&_.tiptap_h2]:text-2xl [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:tracking-tight [&_.tiptap_h3]:mb-4 [&_.tiptap_h3]:mt-8 [&_.tiptap_h3]:text-xl [&_.tiptap_h3]:font-semibold [&_.tiptap_a]:underline [&_.tiptap_a]:underline-offset-4 [&_.tiptap_ul]:mb-5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:mb-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:my-6 [&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-5 [&_.tiptap_blockquote]:text-muted-foreground [&_.tiptap_pre]:my-6 [&_.tiptap_pre]:overflow-x-auto [&_.tiptap_pre]:rounded [&_.tiptap_pre]:bg-surface [&_.tiptap_pre]:p-5 [&_.tiptap_pre]:text-sm [&_.tiptap_code]:font-mono [&_.tiptap_img]:my-6 [&_.tiptap_img]:h-auto [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded [&_.tiptap_hr]:my-8 [&_.tiptap_hr]:border-border [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-offset-2 [&_.ProseMirror-selectednode]:outline-foreground"
          />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{characters} 文字</span>
            <span role="status">{uploading ? "画像をアップロードしています…" : "画像はドラッグや貼り付けで追加できます"}</span>
          </div>
        </div>

        {libraryOpen && (
          <aside id={libraryId} aria-label="画像ライブラリ" className="border-t border-border bg-surface/40 p-4 md:border-t-0 md:border-l">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-medium"><Images size={15} aria-hidden />画像</h2>
              <span className="text-xs text-muted-foreground">{media.length}</span>
            </div>
            <input ref={inputRef} type="file" disabled={readOnly} multiple accept={IMAGE_TYPES.join(",")} className="hidden" aria-label="アップロードする画像を選択" onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (editor) void uploadImages(editor, files, editor.state.selection.from);
            }} />
            <Tabs.Root value={libraryTab} onValueChange={(tab) => { if (typeof tab === "string") setLibraryTab(tab); }}>
              <Tabs.List aria-label="画像の管理" className="mb-4 flex gap-3 border-b border-border">
                <Tabs.Tab value="library" className="border-b-2 border-transparent px-1 pb-2 text-xs text-muted-foreground outline-offset-2 data-active:border-foreground data-active:text-foreground">ライブラリ</Tabs.Tab>
                <Tabs.Tab value="upload" className="border-b-2 border-transparent px-1 pb-2 text-xs text-muted-foreground outline-offset-2 data-active:border-foreground data-active:text-foreground">アップロード</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="library" className="outline-offset-2">
            <p className="text-[11px] leading-relaxed text-muted-foreground">画像を本文にドラッグするか、クリックして挿入できます。</p>
            {media.length > 0 && (
              <input type="search" aria-label="画像を検索" placeholder="画像を検索…" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-5 w-full rounded border border-border bg-background px-3 py-2 text-xs outline-offset-2" />
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 md:max-h-[36rem] md:overflow-y-auto">
              {filteredMedia.map((item) => (
                <button key={item.id} type="button" disabled={!editor || readOnly} draggable={!!editor && !readOnly} aria-label={`${item.name}を本文に挿入`} title={`${item.name} — ドラッグまたはクリックで挿入`} onClick={() => insertMedia(item)} onDragStart={(event) => {
                  event.dataTransfer.setData(MEDIA_DRAG_TYPE, item.id);
                  event.dataTransfer.effectAllowed = "copy";
                }} className="group min-w-0 cursor-grab rounded text-left outline-offset-2 active:cursor-grabbing disabled:cursor-default">
                  {/* Uploaded image URLs are managed by the parent storage adapter. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt ?? item.name} draggable={false} loading="lazy" className="aspect-square w-full rounded border border-border object-cover transition-opacity group-hover:opacity-75" />
                  <span className="mt-1.5 block truncate text-[10px] text-muted-foreground">{item.name}</span>
                </button>
              ))}
            </div>
            {filteredMedia.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <ImagePlus size={25} strokeWidth={1.2} aria-hidden className="mx-auto mb-3" />
                <p className="text-xs">{media.length ? "一致する画像がありません" : "まだ画像がありません"}</p>
                {!media.length && <p className="mt-2 text-[11px] leading-relaxed">アップロードした画像が<br />ここに表示されます。</p>}
              </div>
            )}
              </Tabs.Panel>
              <Tabs.Panel value="upload" className="outline-offset-2">
                <button type="button" disabled={!editor || readOnly || busy || uploading || !onUpload} onClick={() => inputRef.current?.click()} onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }} onDrop={(event) => {
                  event.preventDefault();
                  if (editor) void uploadImages(editor, Array.from(event.dataTransfer.files), editor.state.selection.from);
                }} className="flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded border border-dashed border-border bg-background px-3 py-6 text-xs hover:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45">
                  <Upload size={20} strokeWidth={1.3} aria-hidden />
                  {uploading ? "アップロード中…" : "画像を選択するか、ここにドロップ"}
                </button>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{onUpload ? "PNG・JPEG・WebP・GIFを1枚10 MBまで追加できます。アップロード後、本文に挿入されます。" : "画像を追加するには、保存先の接続設定が必要です。"}</p>
              </Tabs.Panel>
            </Tabs.Root>
          </aside>
        )}
      </div>
    </section>
  );
}
