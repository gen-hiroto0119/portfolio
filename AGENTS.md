<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — Agent Guide

Hiroto Furugen の個人サイト。Next.js App Router。現在の公開ページはトップとブログで、CSS Modules を使用する。

## コンテンツ方針

- Blog の公開記事は現在空。`lib/content/index.ts` は空の一覧を返す。Git にサンプル記事やローカル検証用データを追加しない。
- 管理画面・認証・CMS 接続・記事や画像の保存先はない。Supabase のランタイムコードとローカルマイグレーションはない。
- 公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残す。既存の URL・画像検証を弱めない。
- プロフィールと経歴のコピーは `app/(site)/page.tsx` にある。事実を保ち、経歴・実績を創作しない。
- Idea は廃止済み。`Blog Content/` は Git 管理外の旧Vaultであり、サイトから読み込まない。
- Notion → Integration Webhooks → Blob → Next.js の公開フローを計画中だが未実装。旧実装の整理ではリモートデータを変更しない。Notion 連携は別途合意した範囲で実装する。
- 日本語のコピーは具体的で自然な文章にする。

## 主要ファイル

| 用途 | 場所 |
|---|---|
| 公開記事の取得（現在は空） | `lib/content/index.ts` |
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

`npm run dev`、`npm run build`、`npm run lint`、`npm test` を使用する。

`NEXT_PUBLIC_SITE_URL` は公開URLの指定に使う。Supabase や Notion の接続用環境変数はない。

## デプロイ

デプロイや commit / push は明示的な依頼がない限り行わない。Notion → Integration Webhooks → Blob → Next.js の連携は未実装。今回の変更ではリモートデータにアクセス・変更していない。
