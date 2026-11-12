# Portfolio — Agent Guide

Hiroto Furugenの個人サイト。Astroでトップとブログを静的生成し、Vercelから配信する。記事はGitで管理するMarkdown。

## 構成

- `src/pages/`はルート（ページ・RSS・sitemap・robots・OGP画像）、`src/layouts/`は共通レイアウト、`src/components/`は表示部品。
- 記事は`src/content/blog/<slug>.md`に置き、`src/content.config.ts`のスキーマで検証する。ファイル名がURLのslugになる。画像は記事と同じディレクトリに置き、相対パスで参照する。
- `src/feature/posts/`は記事の取得。`service.ts`は処理の手順、`repository.ts`はコレクションの読み取り、`domain.ts`は型とルールを置く。必要なファイルだけを作る。ページからはserviceを呼ぶ。
- フォント・ロゴは`public/`から配信する。CSSは`src/styles/portfolio.css`に置き、ビルド時にHTMLへインライン化する。既存のカスタムプロパティと`portfolio-`のクラス名を使う。コードのハイライトはShikiの`css-variables`テーマを`--syntax-*`に対応させる。

## コンテンツ方針

- 公開は`main`へのpushによるデプロイで行う。取り下げは記事ファイルの削除で行い、Gitの履歴には残る前提とする。
- Gitにサンプル記事やローカル検証用データを追加しない。`Blog Content/`はGit管理外の旧Vaultであり、サイトから読み込まない。
- プロフィールと経歴は`src/pages/index.astro`にある。事実を保ち、経歴・実績を創作しない。
- 日本語のコピーは具体的で自然な文章にする。

## 実装と運用

- `.astro`コンポーネントを使い、クライアントJSは配色切り替えのインラインスクリプトなど必要な範囲に限る。UIフレームワークのアイランドは追加しない。
- importはファイル先頭にまとめる。domainはAstroや外部I/Oに依存させない。
- union / enumのswitchはdefaultでneverチェックを行う。
- OGP画像はビルド時にsatoriと`@resvg/resvg-js`で生成する。
- 環境変数はVercelのProductionで管理する。`NEXT_PUBLIC_SITE_URL`は既存設定との互換のため残す。
- 必要最低限の構成を保つ。依頼外のリファクタ・ドキュメント・CI・テスト・検証用スクリプトは追加しない。
- 実サービスへの変更・記事公開・デプロイ・commit / pushは明示的な依頼がある場合に行う。
