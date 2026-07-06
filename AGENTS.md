<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Portfolio — Agent Guide

Hiroto Furugen の個人ポートフォリオサイト。コンテンツは **Git 管理の MDX**、表示は **Next.js App Router**。

## 方針

- **コンテンツはファイルファースト** — DB / ヘッドレス CMS は使わない。Blog / Idea は `content/` の MDX、Works は `app/works/_entries/`。
- **執筆フロー** — Obsidian Git で `content/` を Vault として編集 → commit → push → Vercel 自動公開。
- **変更は最小限** — 依頼範囲外のリファクタ・抽象化・テスト追加はしない。
- **日本語 UI** — サイトのコピー・メタデータは日本語が基本。

## スタック

| 領域 | 技術 |
|------|------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, StyleX (`@stylexjs/stylex`, `@stylexjs/atoms`) |
| Content | MDX + `gray-matter` + `zod` + `next-mdx-remote/rsc` |
| Syntax | Shiki (`rehype-pretty-code`), `remark-gfm`, `rehype-slug` |
| Deploy | Vercel |

## ディレクトリ

```
portfolio/
├── app/                    # ルート・各セクションのページ
│   ├── blog/
│   ├── works/
│   │   ├── _entries/       # Works 定義（*.meta.ts + *.case.md）
│   │   └── _lib/           # getAllWorks / getWork / schema
│   ├── idea/
│   ├── lab/
│   ├── design/
│   └── about/
├── content/                # MDX（Obsidian Vault = blog + idea）
│   ├── blog/
│   └── idea/
├── components/             # UI コンポーネント（セクション別サブフォルダ）
├── lib/
│   ├── content/            # MDX 読み込み・Zod スキーマ
│   ├── content-commands.ts # コマンドパレット用データ
│   ├── site.ts             # サイトメタ・ナビ
│   └── theme/              # StyleX トークン・テーマ
└── public/
```

## コンテンツ

詳細なスキーマ定義・例: [content/README.md](content/README.md)

### コレクション

| パス | 用途 | frontmatter 主要フィールド |
|------|------|---------------------------|
| `content/blog/` | 記事 | `title`, `description`, `date`, `category` (tech/photo/daily), `tags`, `published` |
| `app/works/_entries/` | 実績 | `{slug}.meta.ts` + `{slug}.case.md` — スキーマは `app/works/_lib/schema.ts` |
| `content/idea/` | メモ | `title`, `planted`, `tended`, `status` (seedling/budding/evergreen), `tags`, `related` (slug 配列), `published` |

`published` は省略時 `true`。`false` の場合は一覧・詳細・sitemap・RSS から除外される。

スキーマ定義: `lib/content/schema.ts`（blog / idea）、`app/works/_lib/schema.ts`（works）  
読み込み API: `lib/content/index.ts`（blog / idea）、`app/works/_lib/get-works.ts`（works）

### 新規 MDX 追加手順

1. 適切な `content/<collection>/` に `.mdx` を作成
2. frontmatter を `lib/content/schema.ts` に合わせる
3. slug はファイル名（拡張子除く）
4. `npm run dev` で表示確認

### Obsidian 移行（予定）

```
content/
├── blog/
├── idea/
└── attachments/   # 画像（予定）
```

移行時は WikiLink (`[[note]]`) と `![[image]]` の変換レイヤーを `lib/content` に追加する。現状は標準 MDX のみ。

## コーディング規約

### StyleX

- スタイルは **Tailwind ではなく StyleX**。トークンは `lib/theme/tokens.stylex.ts` を使う。
- レイアウト用ユーティリティは `@stylexjs/atoms` の `x.*` を優先。
- コンポーネント固有スタイルは `stylex.create({ ... })` をファイル内に定義。

### TypeScript

- `switch` で union / enum を扱うときは `default` で `never` チェックを入れ、網羅性を保つ。
- import はファイル先頭にまとめる（インライン import 禁止）。

### React / Next.js

- サーバー専用ロジックは `import "server-only"` を付ける（`lib/content/index.ts` 参照）。
- MDX 本文レンダリングは `components/mdx/mdx-content.tsx`（`MDXRemote` + rehype パイプライン）。
- 動的ルートは `generateStaticParams` で SSG。詳細ページのパターンは既存の `[slug]/page.tsx` に合わせる。

### コンポーネント配置

- `components/<section>/` — セクション固有（`blog/`, `idea/`, `works/` 等）
- `components/layout/` — Header, Footer, ナビ
- `components/mdx/` — MDX 用スタイル付きプリミティブ

## コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
npm run start    # 本番サーバー
npm run lint     # ESLint
```

Node.js 22 推奨。

## 環境変数

| 変数 | 用途 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | サイト URL（OG, sitemap, metadata） |

必須は上記のみ。DB・CMS 用の secret は不要。

## やってはいけないこと

- **Payload / Neon / Drizzle 等の CMS・DB 層を勝手に再導入しない**（過去に試して却下済み）
- `content/` 以外にコンテンツソースを増やさない（二重管理を作らない）
- StyleX プロジェクトに Tailwind を混ぜない
- 依頼されていないドキュメント・テスト・コミットを作らない

## デプロイ

- `main` push → Vercel 自動デプロイ
- コンテンツ変更も Git push だけで公開される（ビルド時に MDX を読み込み）
