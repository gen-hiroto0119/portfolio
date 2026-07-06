# Hiroto Portfolio

デザインとエンジニアリングのポートフォリオサイト。

## 技術スタック

- **Next.js 16** (App Router, SSG)
- **TypeScript**
- **StyleX** — スタイリングとデザイントークン
- **MDX** — コンテンツ (`gray-matter` + `next-mdx-remote`)

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
npx tsc --noEmit
```

本番 URL は `NEXT_PUBLIC_SITE_URL` 環境変数で上書きできます（未設定時は `https://hiroto-portfolio.vercel.app`）。

## コンテンツの追加

`content/` 配下に Blog / Idea の MDX を追加します。Works は `app/works/_entries/` を編集します。

| パス | 用途 |
|---|---|
| `content/blog/` | ブログ記事（MDX + frontmatter） |
| `content/idea/` | アイデアメモ（MDX + frontmatter） |
| `app/works/_entries/` | ケーススタディ（`*.meta.ts` + `*.case.md`） |

Blog / Idea のファイル名（拡張子除く）が URL の slug になります。

## デザイントークン

`lib/theme/tokens.stylex.ts` に色・タイポグラフィ・スペーシングなどのセマンティックトークンを定義しています。ライトテーマは `lib/theme/themes.stylex.ts` を参照してください。
