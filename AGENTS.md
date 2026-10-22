# Portfolio — Agent Guide

Hiroto Furugen の個人サイト。Astro。HTMLはサーバーで描画し、本文のReactコンポーネントはサーバーだけで使う。現在の公開ページはトップとブログで、CSS Modules を使用する。

## コンテンツ方針

- Blog の公開記事は Blob の強整合スナップショットから取得する。Blob 設定がないビルドでは空の一覧になる。Git にサンプル記事やローカル検証用データを追加しない。
- 管理画面はない。Notion の読み取り、同期用認証、private Vercel Blob の公開スナップショットを使用する。Supabase のランタイムコードとローカルマイグレーションはない。
- 公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残す。既存の URL・画像検証を弱めない。
- プロフィールと経歴のコピーは `src/components/home.tsx` にある。事実を保ち、経歴・実績を創作しない。
- Idea は廃止済み。`Blog Content/` は Git 管理外の旧Vaultであり、サイトから読み込まない。
- Notion → Workflow → private Blob → Astro の公開フローは実装済みだが、実サービスの秘密値がないため未接続。実サービスへの変更・記事公開は明示的な許可なしに行わない。
- 日本語のコピーは具体的で自然な文章にする。

## 主要ファイル

| 用途 | 場所 |
|---|---|
| 公開記事の取得 | `lib/content/index.ts` |
| Tiptap JSON の検証・表示 | `lib/cms/document.ts`, `components/blog/tiptap-content.tsx` |
| サイト設定 | `lib/site.ts` |
| プロフィール・経歴コピー | `src/components/home.tsx` |
| 公開トップ・ブログのレイアウトとCSS | `src/pages/`, `src/layouts/site.astro`, `components/portfolio/` |
| 共通フォールバック画面 | `src/pages/[...path].astro` |

## コーディング規約

- 公開トップ・ブログ・フォールバック画面は CSS Modules と CSS カスタムプロパティを使う。本文などの共通スタイルには Tailwind CSS を使う。Base UI は使用していない。StyleX を再導入しない。
- import はファイル先頭にまとめる。
- union / enum の switch は default で never チェックを行う。
- サーバー専用処理には `import "server-only"` を付ける。Astroのビルド設定がブラウザー側へのimportを拒否する。
- 公開スナップショットは毎リクエスト取得する。共有キャッシュを追加する場合は取り下げと複数プロセスへの反映を先に検証する。
- 依頼外のリファクタ・ドキュメント・テストを追加しない。明示されない限り commit / push しない。

## コマンドと環境変数

`npm run dev`、`npm run check`、`npm run build`、`npm run lint`、`npm test`、`npm run test:publishing`、`npm run test:delivery` を使用する。

通常のビルドはVercel向け。ローカルの本番検証は `ASTRO_ADAPTER=node npm run build` の後、`HOST=127.0.0.1 PORT=3002 npm start` を使う。

`NEXT_PUBLIC_SITE_URL` は公開URLの指定に使う。連携の環境変数は `.env.example` を参照し、`BLOG_SYNC_ENABLED=false` を初期値とする。

## デプロイ

実サービスへの変更・記事公開・デプロイや commit / push は明示的な依頼がない限り行わない。cron は設定せず、slug 変更前の URL は 404 とする。実サービスの配信は未検証。
