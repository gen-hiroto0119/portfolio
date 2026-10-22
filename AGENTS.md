# Portfolio — Agent Guide

Hiroto Furugenの個人サイト。Hono JSXでトップとブログをサーバー描画し、Nitroでビルドする。Workflowには`workflow/nitro`を使う。

## 構成

- `src/index.ts`はappをexportし、`src/app.ts`はmiddlewareとルートを組み立てる。
- `src/pages/`はページと共通レイアウト、`src/components/`は表示部品。
- `src/feature/`は`posts`・`publishing`・`media`に分ける。HTTP受付は`index.ts`、処理の手順は`service.ts`、外部I/Oは`repository.ts`、Zodの検証は`schema.ts`、型・公開条件は`domain.ts`に置く。必要なファイルだけを作る。
- ページからはserviceを呼ぶ。Notion・Blobへ直接アクセスしない。共有するBlob処理は`src/storage.ts`に置く。
- CSS・画像は`public/`から配信する。CSSは既存のカスタムプロパティと`portfolio-`のクラス名を使う。

## コンテンツ方針

- 記事はprivate Blobの公開スナップショットを`useCache: false`で取得する。Blob未設定時は空の一覧、設定済みの読み取り失敗はエラーとする。記事をアプリ内やCDNにキャッシュしない。
- Gitにサンプル記事やローカル検証用データを追加しない。`Blog Content/`はGit管理外の旧Vaultであり、サイトから読み込まない。
- 本文検証は`src/lib/cms/document.ts`、表示は`src/components/blog/tiptap-content.tsx`。URL・画像・本文の検証を弱めない。
- プロフィールと経歴は`src/pages/home.tsx`にある。事実を保ち、経歴・実績を創作しない。
- 日本語のコピーは具体的で自然な文章にする。

## 実装と運用

- Hono JSXを使い、ブラウザーの動作には必要な範囲のDOM処理を使う。
- importはファイル先頭にまとめる。domainはHono・Workflowや外部I/Oに依存させない。
- union / enumのswitchはdefaultでneverチェックを行う。
- 同期はNotion → Workflow → private Blob。認証、ページ単位の待機・通知の置き換え、CAS、再試行、画像配信中の公開確認を保つ。管理画面・cronは設けない。
- 環境変数はVercelのProductionで管理する。`NEXT_PUBLIC_SITE_URL`は既存設定との互換のため残し、秘密値はブラウザーへ渡さない。`BLOG_SYNC_ENABLED=false`を初期値とする。
- 必要最低限の構成を保つ。依頼外のリファクタ・ドキュメント・CI・テスト・検証用スクリプトは追加しない。
- 実サービスへの変更・記事公開・デプロイ・commit / pushは明示的な依頼がある場合に行う。
