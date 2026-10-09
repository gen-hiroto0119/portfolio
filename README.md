# Hiroto Portfolio

Hiroto Furugenの個人サイト。現在の公開ページはトップとブログです。

## 技術スタック

- Next.js 16 / React 19 / TypeScript
- CSS Modules for the public site; Tailwind CSS for shared fallback screens
- Read-only Tiptap JSON rendering
- Vercel

## 開発

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
npm run test:publishing
```

公開URLは `NEXT_PUBLIC_SITE_URL` で指定します。公開連携の設定例は `.env.example` にあります。`BLOG_SYNC_ENABLED=false` のままでは書き込みルートは無効です。

## コンテンツ

記事は private Blob の公開スナップショットから取得します。Blob 未設定時は空の一覧を返します。Git にサンプル記事やローカル検証用データを追加しないでください。公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残しています。プロフィールと経歴のコピーは `app/(site)/page.tsx` にあります。

記事公開フローは Notion → Workflow → private Vercel Blob → Next.js です。`blog/snapshot.json` と `blog/assets/{uuid}` は private Blob に保存し、読み取りはリクエストごとに強整合スナップショットを確認します（永続キャッシュなし）。公開本文は段落、見出し、リスト、引用、コード、区切り線、表、Notion 画像に対応します。画像は HTTPS の許可された Notion ホストからのみ取得し、PNG/JPEG/GIF/WebP、4 MiB 以下に限定します。外部画像は Notion へアップロードしてください。古い画像は同期後の cleanup で削除されます。CAS 競合や失敗したステージ済み画像は安全のため private のまま残る場合があります。

`.env.example` を `.env.local` にコピーし、private Vercel Blob store と Notion integration を用意して値を設定してください。Notion integration には対象の data source へのアクセスを付与します。Notion 側の公開プロパティは `公開状態`（select: `公開`）、`タイトル`、`slug`、`公開日`、`概要`、`タグ` です。`公開日` は日付のみで、時刻を含む値は意図的に拒否します。

`BLOG_SYNC_SECRET`、`NOTION_WEBHOOK_PATH_SECRET`、`NOTION_WEBHOOK_SECRET` はサーバー側だけに設定し、いずれも32文字以上にします。手動同期は `POST /api/notion/sync` に `Authorization: Bearer …` を付けます。空 body は全件照合、`{"pageId":"<uuid>"}` は1ページ同期です。

本番と Preview はそれぞれ別の private Blob store を割り当ててください。Preview では `BLOG_SYNC_ENABLED=false` を維持します。Vercel Workflow はデプロイ時にプロビジョニングされます。ローカル開発サーバー上の実行を耐久性のあるWorkflow実行として扱わないでください。

Webhook URL は `https://<deployment-host>/api/notion/webhook/<NOTION_WEBHOOK_PATH_SECRET>` です。URL 全体を秘密として扱い、ログに出さないでください。Notion Webhooks では `page.created`、`page.content_updated`、`page.properties_updated`、`page.deleted`、`page.undeleted`、`page.moved` と、対象 data source の `data_source.created`、`data_source.updated`、`data_source.deleted`、`data_source.moved` を購読します。

初回登録用の本番デプロイでは `BLOG_SYNC_ENABLED=true` と `NOTION_WEBHOOK_SETUP_ENABLED=true` を設定し、`NOTION_WEBHOOK_SECRET` は未設定にします。その間に Notion が送る unsigned verification request の候補を private Blob の `blog/setup/webhook-verification.json` に一度だけ保存します。候補を Blob から安全に取得して Notion 側で確認した後、順に `NOTION_WEBHOOK_SECRET` を設定し、setup mode を無効化して、再デプロイしてください。確認候補は署名秘密に自動設定されません。同一トークンの再送は受け付けますが、別トークンで再登録・ローテーションする場合は、オペレーターが Blob 上の候補ファイルを明示的に削除してから行ってください。

cron や自動スケジュール公開は設定しません。slug を変更した記事の旧 URL は自動リダイレクトせず 404 になります。

実サービス接続には Notion と Blob の認証情報およびデプロイ権限が必要です。これらがない場合は本番配信の確認・初回登録ができません。実サービスへの接続や変更は明示的な許可がある場合に限ります。現時点のテストはモックのみで、実サービスの配信は未検証です。
