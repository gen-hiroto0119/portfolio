# Portfolio — Agent Guide

Hiroto Furugen の個人サイト。Hono と hono/jsx。公開ページはサーバーで HTML を描画し、画面上の操作が必要な部分だけ hono/jsx/dom を使う。現在の公開ページはトップとブログで、CSS Modules を使用する。

## コンテンツ方針

- Blog の公開記事は Blob の強整合スナップショットから取得する。Blob 設定がないビルドでは空の一覧になる。Git にサンプル記事やローカル検証用データを追加しない。
- 管理画面はない。Notion の読み取り、同期用認証、private Vercel Blob の公開スナップショットを使用する。Supabase のランタイムコードとローカルマイグレーションはない。
- 公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残す。既存の URL・画像検証を弱めない。
- プロフィールと経歴のコピーは `src/site.tsx` にある。事実を保ち、経歴・実績を創作しない。
- Idea は廃止済み。`Blog Content/` は Git 管理外の旧Vaultであり、サイトから読み込まない。
- Notion → Workflow → private Blob → Hono の公開フローは実装済みだが、実サービスの秘密値がないため未接続。実サービスへの変更・記事公開は明示的な許可なしに行わない。
- 日本語のコピーは具体的で自然な文章にする。

## 主要ファイル

| 用途 | 場所 |
|---|---|
| Hono のルート | `src/app.tsx`, `src/index.ts` |
| 公開ページの HTML | `src/site.tsx` |
| クライアントの初期化 | `src/client/main.tsx` |
| Vite / Nitro / Workflow | `vite.config.ts`, `vite.client.config.ts` |
| 公開記事の取得 | `lib/content/index.ts` |
| スナップショットキャッシュ | `lib/content/snapshot-cache.ts` |
| Tiptap JSON の検証・表示 | `lib/cms/document.ts`, `components/blog/tiptap-content.tsx` |
| サイト設定 | `lib/site.ts` |
| プロフィール・経歴コピー | `src/site.tsx` |
| 公開トップ・ブログの CSS | `components/portfolio/` |
| 共通フォールバック画面 | `src/app.tsx`, `src/client/page-recovery.tsx` |

## コーディング規約

- 公開トップ・ブログは CSS Modules と CSS カスタムプロパティを使う。共通フォールバック画面では Tailwind CSS を使う。Base UI は使用していない。StyleX を再導入しない。
- import はファイル先頭にまとめる。
- union / enum の switch は default で never チェックを行う。
- サーバーは Vite の Nitro プラグインと `workflow/vite` で組む。Workflow の対象ディレクトリは `lib/publishing`。
- 依頼外のリファクタ・ドキュメント・テストを追加しない。明示されない限り commit / push しない。

## コマンドと環境変数

`npm run dev`、`npm run build`、`npm run lint`、`npm test`、`npm run test:publishing` を使用する。

`NEXT_PUBLIC_SITE_URL` は公開URLの指定に使う。連携の環境変数は `.env.example` を参照し、`BLOG_SYNC_ENABLED=false` を初期値とする。

## デプロイ

実サービスへの変更・記事公開・デプロイや commit / push は明示的な依頼がない限り行わない。cron は設定せず、slug 変更前の URL は 404 とする。実サービスの配信は未検証。
