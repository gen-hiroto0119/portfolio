<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Portfolio — Agent Guide

Hiroto Furugen の個人サイト。Next.js App Router。公開トップ・ブログは CSS Modules、既存画面は Tailwind CSS と Base UI を使用する。

## コンテンツ方針

- Blog の公開記事は現在空。`lib/content/index.ts` は空の一覧と記事なしを返し、新しい CMS が接続されるまで公開データを追加しない。
- Git にサンプル記事やローカル検証用データを追加しない。管理画面・認証・記事や画像の保存先はない。
- 将来の CMS が公開スナップショットを提供する場合に備え、Tiptap JSON の検証・表示を維持する。
- Works は `app/(legacy)/works/_entries/` の共通メタ情報 (`*.meta.ts`) と作品別コンポーネント (`*.tsx`) で管理する。`index.ts` で両者を登録する。
- Works の一覧・検索・SEOにはメタ情報だけを渡す。本文コンポーネントを Client Component の props に含めない。
- Idea は廃止済み。`Blog Content/` は Git 管理外の旧Vaultであり、サイトから読み込まない。
- コピーは日本語を基本に、具体的で自然な文章にする。経歴・実績を創作しない。

## 主要ファイル

| 用途 | 場所 |
|---|---|
| 公開記事の取得（現在は空） | `lib/content/index.ts` |
| Tiptap JSON の検証・表示 | `lib/cms/document.ts`, `components/blog/tiptap-content.tsx` |
| Worksの定義・表示 | `app/(legacy)/works/_entries/`, `components/works/work-detail.tsx` |
| サイト設定・ナビ | `lib/site.ts` |
| プロフィール・コピー | `lib/profile.ts`, `lib/i18n/messages.ts` |
| Tailwind・色・本文スタイル | `app/globals.css` |
| 公開トップ・ブログのレイアウトとCSS | `app/(site)/`, `components/portfolio/` |
| DBマイグレーション | `supabase/migrations/` |

## コーディング規約

- 公開トップ・ブログは CSS Modules と CSS カスタムプロパティを使う。既存画面は Tailwind CSS を使い、UIの挙動は Base UI を優先する。StyleX を再導入しない。
- import はファイル先頭にまとめる。サーバー専用処理には `import "server-only"` を付ける。
- union / enum の switch は default で never チェックを行う。
- Next.js APIを変更する前に、インストール済みバージョンの `node_modules/next/dist/docs/` を読む。
- `supabase/migrations/` は旧データモデルとセキュリティ設定の履歴として保持する。編集・適用せず、リモートデータを変更・削除しない。
- 依頼外のリファクタ・ドキュメント・テストを追加しない。明示されない限り commit / push しない。

## コマンドと環境変数

`npm run dev`、`npm run build`、`npm run lint`、`npm test` を使用する。

Supabase 接続用の環境変数はない。`NEXT_PUBLIC_SITE_URL` は公開URLの指定に使う。

## デプロイ

デプロイや commit / push は明示的な依頼がない限り行わない。記事管理は当面 Notion を採用し、公開済み記事の編集は次の同期でサイトに反映する方針。Notion 接続は未実装で、今回の公開サイト刷新には含めない。MinRich の Rust 製公開プラグインとサイト側 SDK は後回し。
