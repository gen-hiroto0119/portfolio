<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — Agent Guide

Hiroto Furugen の個人サイト。Next.js App Router、Tailwind CSS、Base UI を使用する。

## コンテンツ方針

- Blog は Supabase の管理画面 `/admin` だけで作成・編集・公開する。Git・MDX・外部CMSとの二重管理を作らない。
- 認証は Supabase Auth の GitHub ログイン。`cms_owners` に登録された本人だけが執筆できる。
- 下書きと公開スナップショットを分ける。保存だけでは公開内容を変えない。
- Works は `app/works/_entries/` の共通メタ情報 (`*.meta.ts`) と作品別コンポーネント (`*.tsx`) で管理する。`index.ts` で両者を登録する。
- Works の一覧・検索・SEOにはメタ情報だけを渡す。本文コンポーネントを Client Component の props に含めない。
- Idea は廃止済み。`Blog Content/` は Git 管理外の旧Vaultであり、サイトから読み込まない。
- コピーは日本語を基本に、具体的で自然な文章にする。経歴・実績を創作しない。

## 主要ファイル

| 用途 | 場所 |
|---|---|
| 公開記事の取得 | `lib/content/index.ts` |
| 下書き・公開・画像処理 | `lib/cms/` |
| 認証・DBクライアント・生成型 | `lib/supabase/` |
| 記事編集画面 | `components/admin/blog-editor.tsx` |
| Tiptapと画像ライブラリ | `components/editor/tiptap-editor.tsx` |
| 本文の検証・表示 | `lib/cms/document.ts`, `components/blog/tiptap-content.tsx` |
| Worksの定義・表示 | `app/works/_entries/`, `components/works/work-detail.tsx` |
| サイト設定・ナビ | `lib/site.ts` |
| プロフィール・コピー | `lib/profile.ts`, `lib/i18n/messages.ts` |
| Tailwind・色・本文スタイル | `app/globals.css` |
| DBマイグレーション | `supabase/migrations/` |

## コーディング規約

- スタイリングは Tailwind CSS。StyleX を再導入しない。UIの挙動は Base UI を優先する。
- import はファイル先頭にまとめる。サーバー専用処理には `import "server-only"` を付ける。
- union / enum の switch は default で never チェックを行う。
- Next.js APIを変更する前に、インストール済みバージョンの `node_modules/next/dist/docs/` を読む。
- Supabase の RLS・所有者チェック・公開時のリビジョンチェックを維持する。
- 適用済みDBマイグレーションは書き換えず、新規マイグレーションを追加する。
- 依頼外のリファクタ・ドキュメント・テストを追加しない。明示されない限り commit / push しない。

## コマンドと環境変数

`npm run dev`、`npm run build`、`npm run lint`、`npm test` を使用する。

ローカルの接続値は Git 管理外の `.env.local` に置く。

- `NEXT_PUBLIC_SITE_URL`: 公開サイトのURL
- `NEXT_PUBLIC_SUPABASE_URL`: Portfolio専用Supabaseプロジェクト
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: 公開用クライアントキー

GitHub OAuth の Client Secret は Supabase 側で管理する。service role キーをブラウザへ渡さない。

## デプロイ

コードは main への push で Vercel に反映される。ブログ記事は管理画面で公開し、再デプロイせずサイトへ反映する。
