# PortfolioのAstro移行計画

プロフィールとブログの表示をAstroへ移す。移行前の見た目、URL、記事の公開・取り下げを保ちながら、ブラウザーに送るJavaScriptと保守する仕組みを減らす。

移行前のNext.jsは `e41eb89` を比較基準とする。表示調整は[PR #13](https://github.com/gen-hiroto0119/portfolio/pull/13)、Astro移行はそれをベースにした[Draft PR #14](https://github.com/gen-hiroto0119/portfolio/pull/14)に分けた。既存の[Hono移行PR #12](https://github.com/gen-hiroto0119/portfolio/pull/12)は別案として扱い、変更しない。

## ルートの構成をAstroへ切り替えた

公式のminimalテンプレートから始め、独立した構成で表示と公開ライフサイクルを検証した。現在はAstro 7.4.2をルートから起動する。中間のscaffoldはコミット `12f4475`、移植済みの独立構成は `25a7d9c` に残している。

```sh
npm ci
npm run check
npm run lint
npm test
npm run test:publishing
npm run test:delivery
npm run dev -- --host 127.0.0.1
```

通常の `npm run build` はVercel向け。ローカルの本番検証は `ASTRO_ADAPTER=node npm run build` の後、`HOST=127.0.0.1 PORT=3002 npm start` を使う。実サービス連携と本番への切り替えは別途の作業とする。

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

## 移行後の実測値

同日、移植後の `5fe8b8e` をNodeアダプターの本番ビルドで計測した。Chrome・Lighthouse・端末・URL・記事なしの内容・フォントの元ファイル・外部計測の条件を揃え、各条件3回の中央値を取った。

| ページ | 条件 | Performance | LCP | CLS | TBT | 外部JS転送量 | フォント転送量 | 総転送量 |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | モバイル | 85 | 3.75秒 | 0 | 0ms | 0.2KiB | 279.2KiB | 435.7KiB |
| `/` | PC | 99 | 0.78秒 | 0 | 0ms | 0.2KiB | 279.2KiB | 435.7KiB |
| `/blog` | モバイル | 89 | 3.38秒 | 0 | 0ms | 0.2KiB | 248.8KiB | 376.1KiB |
| `/blog` | PC | 100 | 0.69秒 | 0 | 0ms | 0.2KiB | 248.8KiB | 376.1KiB |

Next.jsのローカルサーバーはHTML・CSS・TTF・SVGをgzipで返す一方、今回のAstro Nodeサーバーは非圧縮で返した。同じ元ファイルでも転送量が増えており、この比較からフレームワーク自体や本番CDNでの速度差は判断できない。モバイルのPerformanceはトップで87→85、ブログで89→89だった。高速化を確認した結果としては扱わず、CDN上で圧縮条件を揃えた再測定を残す。

外部JSは160.0KiBから0.2KiBへ減った。この0.2KiBはローカルで404となるSpeed Insightsのリクエストで、ReactやAstroのクライアント用フレームワークJSは取得していない。配色用のインラインJSは合計418バイトあり、外部JSではなくHTMLの転送量に含む。全条件でAccessibilityは100、Best Practicesは96、SEOは100。Best Practicesには同じローカル404の影響がある。

再現条件・中央値・範囲は[Astroの計測データ](benchmarks/astro-5fe8b8e.json)、生のJSON・HTMLはGit管理外の `test-output/benchmarks/astro-2026-10-22/` に保存した。

## 表示と本文検証を引き継ぐ

トップ、ブログ一覧、記事詳細、404、エラー表示をAstroへ移した。CSS Modules、色の変数、Geist、白いHFファビコンを使い、プロフィールや経歴のコピーを保つ。配色切り替えは端末設定と `portfolio-theme` の保存値を引き継ぐ。

Reactは本文と静的な表示部品のサーバー描画に使う。`client:*` は付けていない。ブラウザーで動く処理はAstroコンポーネント内の配色切り替えにまとめた。`next/link`、`next/image`、`next/font` のランタイム依存は取り除いた。

本文の検証は `lib/cms/document.ts`、表示は `components/blog/tiptap-content.tsx` に残す。OGPはSatoriとResvgでPNGを生成する。URL・画像・Tiptap JSONの検証は維持する。

## 記事は毎リクエスト最新のBlobを読む

共有キャッシュを持たないSSRを採用した。`lib/content/index.ts` の `contentForRequest()` で読み取り処理を作り、同じHTTPリクエスト内ではスナップショットのPromiseを共有する。本文とメタデータは同じ記事オブジェクトを使う。HTML・RSS・sitemap・OGPは `no-store`、Blobは `useCache: false` を保つ。

この方式は共有キャッシュよりBlobの読み取り回数が増える。一方、複数プロセスへの失効伝播や、取得中の古い結果がキャッシュへ戻る問題を避けられる。隔離HTTPテストで、更新が失効要求なしでも次のリクエストに反映され、取り下げ後の本文とOGPが404になることを確認した。

`/api/notion/revalidate` は認証付きの公開完了確認として残した。既存のWorkflowの確認応答、pendingフラグ、CASによる解除と失敗時の再試行を保つ。認証失敗時にはBlobを読まず401を返す。送信済みのレスポンスや、ブラウザーに残った表示の即時回収は保証しない。

## 同期と画像配信の挙動を保つ

Notion → Workflow → private Blobの処理は既存の実装を基にする。Workflowには公式の `workflow/astro` 連携がある。既存のページ単位の待機・置き換え・再試行は維持し、単体テストとWorkflowのビルドで確認する。実サービス上の耐久実行と配信は未検証。

| URL | 確認する挙動 |
|---|---|
| `/api/notion/sync` | Bearer認証、1件同期、全件照合 |
| `/api/notion/webhook/[key]` | 秘密URL、署名確認、初回設定、通知の置き換え |
| `/api/notion/revalidate` | 認証、公開完了の確認応答、失敗時の再試行 |
| `/media/[assetId]` | 公開状態の再確認、転送中の取り下げ検知、`no-store` |
| `/feed.xml`、`/sitemap.xml` | 同期した公開記事との一致、旧slugの除外 |
| OGP画像のURL | メタデータからの参照、PNG応答、記事画像の `no-store` |

`BLOG_SYNC_ENABLED=false` を初期値のまま保ち、秘密値はブラウザーへ渡さない。サンプル記事をGitに追加せず、テストで必要な記事は実行時に生成する。旧Vaultは読み込まない。

## 実装と確認の状況

1. **最小構成:** 独立したAstroの起動・型検査・ビルドと、Next.js側のチェックを確認済み。
2. **表示の移植:** トップと共通レイアウト、配色、ブログ一覧・詳細を移植済み。Geistの代替フォントのメトリクスとpreloadも引き継ぎ、フォント切り替え時のレイアウトのずれを解消した。
3. **公開データ:** 毎リクエスト取得を採用。本文・RSS・sitemap・OGPの更新と取り下げを隔離HTTPテストで確認済み。
4. **公開フロー:** Workflow、認証付きAPI、メディア配信を移植済み。単体テスト7件、publishing tests 70件、delivery testsが成功した。Node版の本番ビルドとVercel向けローカルビルドも成功した。
5. **ルートの切り替え:** コマンド、CI、運用ガイドをAstroへ変更済み。Next.js依存と移行用ディレクトリを削除した。実サービス連携と本番への切り替えは未実施。pushに連動するVercel Previewのビルド状態はPRのchecksで確認する。

公開→修正→slug変更→取り下げ→再公開、認証失敗、確認応答の失敗からの回復、転送中の画像取り下げをモックで検証した。既存の `scripts/delivery/run.mjs` と `tests/delivery/` はこの検証に使い、起動・ビルド・出力確認をAstroに対応させた。キャッシュ再利用の回数チェックは、毎HTTPリクエストで最新を読む回数チェックに変更した。

型検査とlintは成功した。型検査には既存のZod APIに関する非推奨ヒントが6件残る。実行時依存の `npm audit --omit=dev` は脆弱性0件。Vercel向けのWorkflow生成とOGP用フォント・画像の同梱は確認したが、実サービス上のWorkflow実行とCDN配信は未検証。

実サービスへの接続、記事公開、本番へのデプロイは別途明示的な依頼を受けて実施する。Next.jsへの復旧基準は `e41eb89`。戻す場合はコードに加えてVercelのframeworkをNext.jsへ戻す。公開スナップショットの形式は変えていない。

## 参照する公式資料

- [Astroのインストール](https://docs.astro.build/en/install-and-setup/)
- [Next.jsからの移行](https://docs.astro.build/en/guides/migrate-to-astro/from-nextjs/)
- [必要なルートをサーバーで描画する方法](https://docs.astro.build/en/guides/on-demand-rendering/)
- [WorkflowのAstro連携](https://workflow-sdk.dev/docs/getting-started/astro)
