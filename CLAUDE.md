@AGENTS.md

# Claude 向けメモ

`AGENTS.md` を正とする。ここは Claude Code / Cursor 作業時の補足のみ。

## 作業前に読むもの

1. `AGENTS.md` — プロジェクト方針・スタック・規約
2. 触る MDX なら `lib/content/schema.ts` — frontmatter の型
3. Next.js API を変えるなら `node_modules/next/dist/docs/` — このリポジトリの Next 16 は学習データと異なる場合がある

## よく触るファイル

| 目的 | ファイル |
|------|----------|
| 記事・実績・メモの追加 | `content/**/*.mdx` |
| 画像（Blog / Idea） | `content/attachments/` |
| frontmatter 定義 | `lib/content/schema.ts` |
| データ取得 | `lib/content/index.ts` |
| MDX 見た目 | `components/mdx/mdx-content.tsx` |
| サイト設定・ナビ | `lib/site.ts` |
| デザイントークン | `lib/theme/tokens.stylex.ts` |

## コンテンツ方針

- **MDX + Git が正**。CMS は使わない。
- 将来 **Obsidian Git** で `content/` を Vault 化する予定。WikiLink 対応は未実装。
- 新規コンテンツは既存 MDX の frontmatter・トーンに合わせる。

## 実装時の注意

- 差分は小さく。既存パターン（StyleX、`lib/content`、ページ構成）に合わせる。
- ユーザーが明示しない限り commit / push しない。
- レスポンスは日本語で書く。
