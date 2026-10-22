# PortfolioのAstro移行計画

プロフィールとブログの表示をAstroへ移す。現在の見た目、URL、記事の公開・取り下げを保ちながら、ブラウザーに送るJavaScriptと保守する仕組みを減らす。

現行のNext.jsは `e41eb89` を比較基準とする。表示調整は[PR #13](https://github.com/gen-hiroto0119/portfolio/pull/13)に分けた。Astro移行は別ブランチで進める。既存の[Hono移行PR #12](https://github.com/gen-hiroto0119/portfolio/pull/12)は別案として扱い、変更しない。

## 最初は独立した最小構成で進める

`migration/astro` に公式のminimalテンプレートを生成した。Astroは7.4.2に固定し、専用のpackage.jsonとlockfileを持つ。Next.jsの開発・ビルド・配信は引き続きルートのコマンドを使う。

最小構成の起動・型検査・ビルドを確認した後、ページ、コンテンツ取得、同期APIの順に移す。全機能の移植と配信確認が済んでから、ルートのNext.js構成を置き換える。途中のAstro画面は検索対象にしない。

```sh
npm --prefix migration/astro ci
npm --prefix migration/astro run check
npm --prefix migration/astro run build
npm --prefix migration/astro run dev -- --host 127.0.0.1
```

現在の最小構成には、記事や同期APIはない。この段階の軽い画面を、現行サイトとの性能比較には使わない。

## 移行前の実測値

2026年10月22日にLighthouse 13.5.0、Chrome 155.0.8059.85、Node 24.14.0で測った。各条件3回の中央値。モバイルとPCはそれぞれLighthouse標準の模擬条件を使った。

| ページ | 条件 | Performance | LCP | JavaScript転送量 | フォント転送量 |
|---|---|---:|---:|---:|---:|
| `/` | モバイル | 87 | 3.76秒 | 160.0KiB | 209.9KiB |
| `/` | PC | 100 | 0.77秒 | 160.0KiB | 209.9KiB |
| `/blog` | モバイル | 89 | 3.45秒 | 160.0KiB | 179.4KiB |
| `/blog` | PC | 100 | 0.63秒 | 160.0KiB | 179.4KiB |

ローカルの本番ビルドで、記事は空。Notion／Blobは未接続で、GAは読み込んでいない。Vercel Speed InsightsのローカルURLは404になる。本番CDN、実記事、INP、同時アクセス性能はこの測定に含まない。

再現コマンド、計測設定、指標ごとの最小値・最大値は[基準データ](benchmarks/next-e41eb89.json)に保存した。生のJSON・HTMLはGit管理外の `test-output/benchmarks/next-e41eb89-2026-10-22/` にある。

## 表示は既存のコピーとCSSを引き継ぐ

トップ、ブログ一覧、記事詳細、404、エラー画面を移す。現在のCSS Modules、色の変数、Geist、白いHFファビコンを再利用し、プロフィールや経歴の事実は変えない。ライト／ダーク切り替えは端末設定を初期値とし、`portfolio-theme`の保存値を引き継ぐ。

| 現在の依存 | 移行先の案 | 確認すること |
|---|---|---|
| `app/(site)/` と `next/link` | `.astro` のページ・レイアウトと通常のリンク | パス、見出し、余白、戻る操作 |
| `next/image` と `next/font/local` | 既存画像・フォントの配信 | サイズ指定、ロゴの反転、フォント表示 |
| Reactの本文表示 | AstroのReact連携でサーバー描画する案 | `client:*`を付けず、本文表示用のJSを送らない |
| ThemeToggle | Astroコンポーネント内の小さなブラウザー処理 | 初回表示、保存、端末設定、ストレージ利用不可時 |
| Next.jsのMetadataと `next/og` | Astroのheadと画像生成用エンドポイント | canonical、OGP、Twitter、PNG、配信ヘッダー |

本文の検証は `lib/cms/document.ts`、表示は `components/blog/tiptap-content.tsx` の処理を基にする。URL・画像・Tiptap JSONの検証を弱めない。React連携を使うか、本文表示もAstroへ書き換えるかは、同じ入力と出力で比較して決める。

## 記事の取得とキャッシュを先に検証する

`lib/content/index.ts` の `use cache`、`cacheLife`、`cacheTag` と、失効処理の `revalidateTag` は作り直す。現在はトップ・一覧・詳細・RSS・sitemap・OGPが公開スナップショットを共有している。

キャッシュ方式は未決。以下の案を比較して決める。

- 毎リクエストBlobを読み、サーバーで描画する案。失効処理を減らせる一方、読み取り回数と応答時間が増える。1リクエスト内では取得結果を共有する。
- 共有キャッシュを使う案。保存期間だけでなく、失効中の読み取りや複数プロセスへの反映を検証する。プロセス内メモリだけの失効を、本番全体への反映として扱わない。

どちらもBlobの `useCache: false` を保つ。公開の変更後に本文とメタデータが一致し、取り下げ後に旧記事が配信されないことをHTTPテストで確認してから採用する。取得回数と費用も方式の判断材料とする。

## 同期と画像配信の挙動を保つ

Notion → Workflow → private Blobの処理は既存の実装を基にする。Workflowには公式の `workflow/astro` 連携がある。現在のページ単位の待機・置き換え・再試行と、Vercel用アダプターとの組み合わせは、移植後に検証する。

| URL | 確認する挙動 |
|---|---|
| `/api/notion/sync` | Bearer認証、1件同期、全件照合 |
| `/api/notion/webhook/[key]` | 秘密URL、署名確認、初回設定、通知の置き換え |
| `/api/notion/revalidate` | 認証、失効処理、失敗時の応答と再試行 |
| `/media/[assetId]` | 公開状態の再確認、転送中の取り下げ検知、`no-store` |
| `/feed.xml`、`/sitemap.xml` | 同期した公開記事との一致、旧slugの除外 |
| OGP画像のURL | メタデータからの参照、PNG応答、記事画像の `no-store` |

`BLOG_SYNC_ENABLED=false` を初期値のまま保ち、秘密値はブラウザーへ渡さない。サンプル記事をGitに追加せず、テストで必要な記事は実行時に生成する。旧Vaultは読み込まない。

## 実装と確認の順序

1. **最小構成:** 独立したAstroを起動し、型検査・ビルドを通す。Next.js側の既存チェックも通ることを確認する。
2. **表示の移植:** トップと共通レイアウト、配色、ブログ一覧・詳細を移す。同じ内容・画面幅で見た目と操作を比較する。
3. **公開データ:** スナップショット取得とキャッシュ方式を検証し、本文・RSS・sitemap・OGPの読み取りを揃える。
4. **公開フロー:** Workflow、認証付きAPI、メディア配信を移し、既存のpublishing testsとdelivery testsを対応させる。
5. **切り替え準備:** 同じ内容で性能を再計測し、ルートのコマンド、CI、運用ガイドをAstroへ変更する。Next.js依存と移行用ディレクトリは、アプリを置き換える段階で整理する。

切り替え前には、公開→修正→slug変更→取り下げ→再公開、認証失敗、失効失敗からの回復、転送中の画像取り下げを検証する。既存の `scripts/delivery/run.mjs` と `tests/delivery/` はこの検証に使い、Next.js固有の起動・ビルド・出力確認だけを置き換える。

性能は同じChrome・Lighthouse・端末・本文・フォント・外部計測の条件で3回ずつ測る。Performance点数に加えてLCP、CLS、TBT、JavaScript・フォント・総転送量を比較する。構成だけ変えて高速化したとは判断しない。

実サービスへの接続、記事公開、デプロイは別途明示的な依頼を受けて実施する。切り替え前のコミットと配信設定を記録し、問題が起きた場合にNext.jsへ戻せる状態を保つ。

## 参照する公式資料

- [Astroのインストール](https://docs.astro.build/en/install-and-setup/)
- [Next.jsからの移行](https://docs.astro.build/en/guides/migrate-to-astro/from-nextjs/)
- [必要なルートをサーバーで描画する方法](https://docs.astro.build/en/guides/on-demand-rendering/)
- [WorkflowのAstro連携](https://workflow-sdk.dev/docs/getting-started/astro)
