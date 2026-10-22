# Astro移行の最小構成

Astro公式のminimalテンプレートを使った移行用の構成。現行サイトはリポジトリのルートから起動する。手順と完了条件は[移行計画](../../docs/astro-migration.md)を参照する。

```sh
npm --prefix migration/astro ci
npm --prefix migration/astro run check
npm --prefix migration/astro run build
npm --prefix migration/astro run dev -- --host 127.0.0.1
```

開発サーバーは `http://127.0.0.1:4321`。ビルドしたHTMLは次のコマンドで確認できる。

```sh
npm --prefix migration/astro run preview -- --host 127.0.0.1
```

現時点では見出しと既存の白いHFファビコンだけを表示する。記事、同期API、配色切り替えは未移植。検索対象にしないため、`noindex, nofollow`を付けている。
