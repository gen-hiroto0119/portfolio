# Hiroto Portfolio

Hiroto Furugenの個人サイト。トップとブログをHono JSXでサーバー描画します。

## 構成

- Hono / Hono JSX / TypeScript
- Nitro + Vercel Workflow
- CSSとローカルフォントの静的配信
- Notion → Workflow → private Vercel Blob → Hono

```text
src/
  index.ts          # appをexport
  app.ts            # middlewareとルートの組み立て
  pages/            # 公開ページ・レイアウト・RSS・sitemap・OGPのルート
  components/       # 共通の表示部品
  feature/
    posts/          # 公開記事の取得
    publishing/     # 同期API・Webhook・Workflow
    media/          # 公開状態を確認した画像配信
  storage.ts        # 各Featureで共有するBlobの読み書き
  lib/              # 本文の検証・シンタックスハイライト・サイト設定
public/             # CSS・画像・フォント
```

各Featureは必要なファイルだけを持ちます。`index.ts`はHTTPの受付、`service.ts`は処理の手順、`repository.ts`は外部との読み書き、`schema.ts`は入力・保存形式の検証、`domain.ts`は型と公開条件などのルールです。ページはserviceを通じて記事を取得し、repositoryを直接呼びません。

## 開発

Node.js 24を使用します。

```sh
npm install
npm run dev
npm run build
npm run start
npm run lint
```

Nitroの開発サーバーと`start`は`.env.local`を読み込みます。Workflowは`workflow/nitro`でビルドします。本番ではVercelのNitro設定を使います。

環境変数はVercelのProductionで管理します。

```sh
vercel env pull .env.local --environment=production --project=portfolio --scope=gen-hirotos-projects
```

設定例は`.env.example`にあります。公開URLの変数名`NEXT_PUBLIC_SITE_URL`は既存のVercel設定を引き継ぐため残しています。Honoではサーバー側で参照し、秘密値はHTMLに含めません。`BLOG_SYNC_ENABLED=false`を初期値とします。

## 記事の取得と表示

`blog/snapshot.json`をprivate Blobから読み込みます。読み取りは`useCache: false`で、アプリ内やCDNに記事をキャッシュしません。トップ・一覧・詳細・RSS・sitemap・記事OGPはリクエスト時の公開スナップショットを使います。記事詳細は1回の読み取りから本文とメタデータを作ります。Next.jsのキャッシュ・失効コールバックと`/api/notion/revalidate`は廃止しました。

Blob未設定時は空の一覧になります。設定済みのBlobへの読み取りに失敗した場合はエラーを返します。サンプル記事やローカル検証用データはGitに追加しません。`Blog Content/`は旧Vaultで、サイトから読み込みません。

本文の検証は`src/lib/cms/document.ts`、表示は`src/components/blog/tiptap-content.tsx`にあります。段落・見出し・リスト・引用・コード・区切り線・表・Notion画像に対応します。プロフィールと経歴は`src/pages/home.tsx`にあります。

## 同期と公開

Notion integrationに対象data sourceへのアクセスを付与します。公開プロパティは`公開状態`（select: `公開`）、`タイトル`、`slug`、`公開日`、`概要`、`タグ`です。`公開日`は日付のみを受け付けます。slug変更後の旧URLは404になります。cronや自動スケジュール公開は設定しません。

手動同期は`POST /api/notion/sync`に`Authorization: Bearer <BLOG_SYNC_SECRET>`を付けます。空bodyは全件照合、`{"pageId":"<uuid>"}`は1ページ同期です。受付後は202と`runId`を返します。

Webhook URLは`https://<公開ホスト>/api/notion/webhook/<NOTION_WEBHOOK_PATH_SECRET>`です。URL全体を秘密として扱います。`BLOG_SYNC_SECRET`、`NOTION_WEBHOOK_PATH_SECRET`、`NOTION_WEBHOOK_SECRET`は32文字以上にします。

Webhookは生の本文に対するHMAC-SHA256署名を確認します。購読イベントは`page.created`、`page.content_updated`、`page.properties_updated`、`page.deleted`、`page.undeleted`、`page.moved`と、対象data sourceの`data_source.created`、`data_source.updated`、`data_source.deleted`、`data_source.moved`です。

公開中のページは約60秒待って同期します。`blog/sync/{uuid}.json`の協調レコードで後続の通知が待機中の古い通知を置き換えます。取り下げ・削除・移動などの通知は待たずに処理します。待機後や再試行時には最新のmarkerとNotionの状態を確認します。既に開始した同期と新しい通知の競合による追加同期は起こり得ます。

スナップショットの更新はETagによるCASを使います。競合時はNotionから取得し直し、準備済みの古い本文を再送しません。各ステップの再試行上限は5回です。上限を超えた場合は同期失敗となり、手動同期などで復旧します。

### Webhookの初回登録

1. `BLOG_SYNC_ENABLED=true`、`NOTION_WEBHOOK_SETUP_ENABLED=true`とし、`NOTION_WEBHOOK_SECRET`を未設定にします。
2. Notionからのverification requestで、候補をprivate Blobの`blog/setup/webhook-verification.json`に保存します。
3. 候補を安全に取得し、Notion側で照合してから`NOTION_WEBHOOK_SECRET`に設定します。
4. setup modeを無効化し、再デプロイします。

setup modeでは無署名リクエストと、候補トークンを鍵にした正しい署名付きリクエストを受け付けます。候補による署名だけでは送信元認証になりません。秘密URL・一時的なsetup mode・Notion側での照合を併用します。候補は署名秘密に自動設定されません。同一候補の再送は許可し、別候補への変更にはBlob上の候補ファイルの明示的な削除が必要です。

### 画像

画像はHTTPSの許可されたNotionホストから取得し、PNG/JPEG/GIF/WebP、4 MiB以下に限定します。SVGや外部画像URLは受け付けません。private Blobの`blog/assets/{uuid}`へ保存し、公開スナップショットに含まれる画像だけを`/media/{assetId}`で配信します。

配信開始前と最大64 KiBの各チャンクを送る直前に、公開状態をキャッシュなしで確認します。取り下げや読み取り失敗時は残りの転送を中断します。送信済みのデータは回収できません。この確認によりBlobの読み取り回数が増えます。公開状態の変更はNotionの同期完了後に反映されます。

使われなくなった画像は同期後のcleanupで削除します。競合や失敗時のステージ済み画像はprivateのまま残る場合があります。

## 運用

記事・画像・OGPは`no-store`で配信します。記事スナップショットの読み取りはリクエストごとに発生します。閲覧済みの画面や送信済みデータの即時回収は保証しません。

実サービスへの変更・記事公開・デプロイは明示的な依頼がある場合に実施します。公開先は[hirotofurugen.dev](https://hirotofurugen.dev/)です。
