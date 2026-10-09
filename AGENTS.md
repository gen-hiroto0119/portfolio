<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — Agent Guide

Hiroto Furugen の個人サイト。Next.js App Router。現在の公開ページはトップとブログで、CSS Modules を使用する。

## コンテンツ方針

- Blog の公開記事は Blob の強整合スナップショットから取得する。Blob 設定がないビルドでは空の一覧になる。Git にサンプル記事やローカル検証用データを追加しない。
- 管理画面はない。Notion の読み取り、同期用認証、private Vercel Blob の公開スナップショットを使用する。Supabase のランタイムコードとローカルマイグレーションはない。
- 公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残す。既存の URL・画像検証を弱めない。
- プロフィールと経歴のコピーは `app/(site)/page.tsx` にある。事実を保ち、経歴・実績を創作しない。
- Idea は廃止済み。`Blog Content/` は Git 管理外の旧Vaultであり、サイトから読み込まない。
- Notion → Workflow → private Blob → Next.js の公開フローは実装済みだが、実サービスの秘密値がないため未接続。実サービスへの変更・記事公開は明示的な許可なしに行わない。
- 日本語のコピーは具体的で自然な文章にする。

## 主要ファイル

| 用途 | 場所 |
|---|---|
| 公開記事の取得 | `lib/content/index.ts` |
| Tiptap JSON の検証・表示 | `lib/cms/document.ts`, `components/blog/tiptap-content.tsx` |
| サイト設定 | `lib/site.ts` |
| プロフィール・経歴コピー | `app/(site)/page.tsx` |
| 公開トップ・ブログのレイアウトとCSS | `app/(site)/`, `components/portfolio/` |
| 共通フォールバック画面 | `app/error.tsx`, `app/not-found.tsx`, `components/page-recovery.tsx` |

## コーディング規約

- 公開トップ・ブログは CSS Modules と CSS カスタムプロパティを使う。共通フォールバック画面では Tailwind CSS を使う。Base UI は使用していない。StyleX を再導入しない。
- import はファイル先頭にまとめる。サーバー専用処理には `import "server-only"` を付ける。
- union / enum の switch は default で never チェックを行う。
- Next.js APIを変更する前に、インストール済みバージョンの `node_modules/next/dist/docs/` を読む。
- 依頼外のリファクタ・ドキュメント・テストを追加しない。明示されない限り commit / push しない。

## コマンドと環境変数

`npm run dev`、`npm run build`、`npm run lint`、`npm test`、`npm run test:publishing` を使用する。

`NEXT_PUBLIC_SITE_URL` は公開URLの指定に使う。連携の環境変数は `.env.example` を参照し、`BLOG_SYNC_ENABLED=false` を初期値とする。

## デプロイ

実サービスへの変更・記事公開・デプロイや commit / push は明示的な依頼がない限り行わない。cron は設定せず、slug 変更前の URL は 404 とする。実サービスの配信は未検証。
