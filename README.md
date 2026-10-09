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
npm run test:delivery
```

公開URLは `NEXT_PUBLIC_SITE_URL` で指定します。公開連携の設定例は `.env.example` にあります。`BLOG_SYNC_ENABLED=false` のままでは書き込みルートは無効です。

## CI

GitHub Actions の `quality` は lint・型生成・型検査・単体テスト・publishing tests を、`delivery` は本番ビルド後の隔離された HTTP キャッシュライフサイクルを検証します。どちらも Node 24 と `npm ci` を使います。delivery テストは実行時に合成記事とダミー認証情報を作り、private Blob 読み取りをモックします。Notion、実 Blob、Vercel デプロイ、実環境でのイベント到着やキャッシュ伝播は検証しません。

ローカルで同じゲートを実行する場合:

```bash
npm ci
npm run lint
npx next typegen
npx tsc --noEmit
npm test
npm run test:publishing
npm run test:delivery
```

この workflow はブランチ保護を変更しません。`quality` と `delivery` を必須にする場合は、GitHub の branch protection rules で required status checks として手動設定してください。

## コンテンツ

記事は private Blob の公開スナップショットから取得します。Blob 未設定時は空の一覧を返します。Git にサンプル記事やローカル検証用データを追加しないでください。公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残しています。プロフィールと経歴のコピーは `app/(site)/page.tsx` にあります。

記事公開フローは Notion → Workflow → private Vercel Blob → Next.js です。`blog/snapshot.json` と `blog/assets/{uuid}` は private Blob に保存します。記事の読み取りは Next.js 16.4 の Cache Components（`use cache`）で共通スナップショットをキャッシュし、トップ・一覧・詳細・RSS・sitemap・OGP が同じ `blog` タグを使います。`blog` プロファイルはクライアント stale 30秒、サーバー再検証5分、期限1時間です。キャッシュ再生成時の Blob 読み取りは `useCache: false` のままです。公開本文は段落、見出し、リスト、引用、コード、区切り線、表、Notion 画像に対応します。画像は HTTPS の許可された Notion ホストからのみ取得し、PNG/JPEG/GIF/WebP、4 MiB 以下に限定します。外部画像は Notion へアップロードしてください。古い画像は同期後の cleanup で削除されます。CAS 競合や失敗したステージ済み画像は安全のため private のまま残る場合があります。

Workflow はスナップショット保存後、独立した再試行可能なステップから `POST /api/notion/revalidate` を呼びます。Route Handler 内で `revalidateTag("blog", { expire: 0 })` を実行し、失効後のサーバーアクセスは古いデータを返さず再生成を待ちます。失効要求の成功応答を受け取るまで同期完了とは扱いません。自動再試行の上限に達したら同期は失敗となり、手動同期で再試行できます。既に取り下げ済みで変更なしの場合や空の全件照合でも失効を要求し、保存後に失効だけが失敗した状態を修復します。同期失敗・CAS競合で保存できなかった記事では失効を要求しません。

Blob 更新とキャッシュ失効は原子的ではなく、その間は古い本文が表示され得ます。Next.js が管理する失効の伝播と、閲覧中・ブラウザーに保存済みの表示の即時回収までは保証しません。時間ベースの再検証は補助であり、Notion の同期自体を代替しません。RSS・OGP の応答と画像配信は引き続き `no-store` です。

`.env.example` を `.env.local` にコピーし、private Vercel Blob store と Notion integration を用意して値を設定してください。Notion integration には対象の data source へのアクセスを付与します。Notion 側の公開プロパティは `公開状態`（select: `公開`）、`タイトル`、`slug`、`公開日`、`概要`、`タグ` です。`公開日` は日付のみで、時刻を含む値は意図的に拒否します。

`BLOG_SYNC_SECRET`、`NOTION_WEBHOOK_PATH_SECRET`、`NOTION_WEBHOOK_SECRET` はサーバー側だけに設定し、いずれも32文字以上にします。手動同期は `POST /api/notion/sync` に `Authorization: Bearer …` を付けます。空 body は全件照合、`{"pageId":"<uuid>"}` は1ページ同期です。

キャッシュ失効には同じ `BLOG_SYNC_SECRET` を使います。`NEXT_PUBLIC_SITE_URL` は同じ環境・Blob store を使うサイトの正規 HTTPS オリジンに設定してください（パス・認証情報・クエリなし）。失効用URLの自動推測やリダイレクト追従はしません。ローカルの非Vercel環境のみ localhost の HTTP を許可します。失効ルートへの通信を Deployment Protection 等で遮断しないでください。Preview の同期は無効のままにします。

本番と Preview はそれぞれ別の private Blob store を割り当ててください。Preview では `BLOG_SYNC_ENABLED=false` を維持します。Vercel Workflow はデプロイ時にプロビジョニングされます。ローカル開発サーバー上の実行を耐久性のあるWorkflow実行として扱わないでください。

Webhook URL は `https://<deployment-host>/api/notion/webhook/<NOTION_WEBHOOK_PATH_SECRET>` です。URL 全体を秘密として扱い、ログに出さないでください。Notion Webhooks では `page.created`、`page.content_updated`、`page.properties_updated`、`page.deleted`、`page.undeleted`、`page.moved` と、対象 data source の `data_source.created`、`data_source.updated`、`data_source.deleted`、`data_source.moved` を購読します。

初回登録用の本番デプロイでは `BLOG_SYNC_ENABLED=true` と `NOTION_WEBHOOK_SETUP_ENABLED=true` を設定し、`NOTION_WEBHOOK_SECRET` は未設定にします。その間に Notion が送る verification request の候補を private Blob の `blog/setup/webhook-verification.json` に一度だけ保存します。無署名リクエストと、候補の `verification_token` を鍵として生のリクエスト本文の HMAC-SHA256 が `X-Notion-Signature` と一致する署名付きリクエストを受け付けます。不正な署名は拒否します。候補による署名は整合性確認であり、独立した送信元認証ではありません。秘密URL、一時的な setup mode、Notion 側での候補の照合を併用します。候補を Blob から安全に取得して Notion 側で確認した後、順に `NOTION_WEBHOOK_SECRET` を設定し、setup mode を無効化して、再デプロイしてください。確認候補は署名秘密に自動設定されません。同一トークンの再送は受け付けますが、別トークンで再登録・ローテーションする場合は、オペレーターが Blob 上の候補ファイルを明示的に削除してから行ってください。

画像配信は、レスポンス開始前に加えて最大64 KiBの各チャンクを渡す直前にも公開スナップショットをキャッシュなしで再確認します。取り下げを検知した場合や確認に失敗した場合、残りの転送と Blob の読み取りを中断します。転送開始後は404へ変更できず、本文の読み取りエラーになります。このため配信中のスナップショット読み取り回数・転送量が増えます。取り下げは Notion の変更が同期された後に効力を持ち、最後の確認とチャンク送出の間の競合、HTTP基盤が既にバッファしたデータ、送信済みデータの回収までを原子的に保証するものではありません。

cron や自動スケジュール公開は設定しません。slug を変更した記事の旧 URL は自動リダイレクトせず 404 になります。

実サービス接続には Notion と Blob の認証情報およびデプロイ権限が必要です。これらがない場合は本番配信の確認・初回登録ができません。実サービスへの接続や変更は明示的な許可がある場合に限ります。現時点のテストはモックのみで、実サービスの配信は未検証です。
