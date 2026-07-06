# Content

ポートフォリオの **Blog / Idea** コンテンツは `content/` 配下の **MDX ファイル**がソースです。  
frontmatter は [lib/content/schema.ts](../lib/content/schema.ts) の Zod スキーマで検証されます。

**Works** は Obsidian Vault 外の [`app/works/_entries/`](../app/works/_entries/) で管理します（TypeScript + Markdown）。

```
content/
├── blog/       → /blog/:slug
├── idea/       → /idea/:slug
└── templates/  → Obsidian テンプレート（サイト非公開）
```

## Obsidian（Vault = `content/`）

このフォルダを Obsidian Vault として開き、MDX を直接編集できます。サイトが読むのは **frontmatter の YAML** のみです（インライン `#タグ` や `[[リンク]]` は自動連携しません）。

### 日付の書き方

| 書き方 | 例 | 備考 |
|--------|-----|------|
| クォートなし | `date: 2026-07-06` | Obsidian Properties **Date 型**推奨。ビルド時に `YYYY-MM-DD` 文字列へ正規化 |
| クォートあり | `date: "2026-07-06"` | 従来どおり有効 |
| Date & time 型 | `2026-07-06T10:00:00` | **非推奨**（TZ なしのため Vercel ビルド等でずれる可能性） |

Blog / Idea の日付は **カレンダー日付**（時刻なし）です。アプリ内部も `YYYY-MM-DD` 文字列で保持します。

### テンプレート

[`templates/`](templates/) に Obsidian Templates 用ファイルがあります（サイトには公開されません）。

1. Obsidian 設定 → **Templates** → Template folder location → `templates`
2. 対象フォルダ（例 `blog/`）で `.mdx` を新規作成（Edit MDX プラグイン）
3. コマンド **「テンプレートを挿入」** で雛形を挿入

| テンプレート         | 挿入先                  |
| -------------- | -------------------- |
| `blog-post.md` | `content/blog/*.mdx` |
| `idea-note.md` | `content/idea/*.mdx` |

テンプレートの `{{date}}` は `YYYY-MM-DD` 形式です。新規下書きは `published: false` がデフォルトです。

---

## 共通ルール

| 項目 | ルール |
|------|--------|
| ファイル形式 | `.mdx`（YAML frontmatter + Markdown 本文） |
| slug | ファイル名から自動決定（`my-post.mdx` → `my-post`） |
| 日付 | `YYYY-MM-DD`（クォートあり/なしどちらも可） | 例: `2026-07-06` |
| `published` | 省略時 `true`。`false` のファイルはサイトに表示されない |
| 本文 | 標準 Markdown + MDX。コードブロックは Shiki でハイライト |

`published: false` のファイルはビルド対象から除外されます。下書きは残したくない場合はファイルごと削除してください。

---

## Blog — `content/blog/`

エッセイ・技術記事・写真・日記。

### フィールド

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `title` | string | ✅ | — | 記事タイトル |
| `description` | string | ✅ | — | 一覧・OGP 用の要約 |
| `date` | `YYYY-MM-DD` | ✅ | — | 公開日（新しい順に並ぶ） |
| `category` | `tech` \| `photo` \| `daily` | — | `tech` | カテゴリタブのフィルタ |
| `tags` | string[] | ✅ | — | タグ（空配列可） |
| `published` | boolean | — | `true` | 公開フラグ |

### 例

```yaml
---
title: デザインとエンジニアリングの境界
description: 仕様の受け渡しを減らし、品質を上げるためにチームで使える共通言語について。
date: 2026-07-03
category: tech
tags:
  - Design
  - Engineering
  - Process
published: true
---
```

### 表示先

- 一覧: `/blog`（カテゴリフィルタ: `?category=tech` 等）
- 詳細: `/blog/{slug}`
- RSS: `/feed.xml`

---

## Works — `app/works/_entries/`（Vault 外）

実績・ケーススタディ。コード側で定義し、Obsidian では編集しません。

| ファイル | 内容 |
|---|---|
| `{slug}.meta.ts` | タイトル・metrics・links 等（[`app/works/_lib/schema.ts`](../app/works/_lib/schema.ts)） |
| `{slug}.case.md` | ケーススタディ本文（Markdown） |

新規追加: `_entries/` に meta + case を追加し、[`_entries/index.ts`](../app/works/_entries/index.ts) の `works` 配列に登録。

表示先: `/works`、`/works/{slug}`、トップ Featured Works（`featured: true`）

---

## Idea — `content/idea/`

アイデアメモ・思考の断片。メモ同士を `related` でつなげてグラフ表示。

### フィールド

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `title` | string | ✅ | — | メモのタイトル |
| `planted` | `YYYY-MM-DD` | ✅ | — | 最初に書いた日 |
| `tended` | `YYYY-MM-DD` | ✅ | — | 最後に手入れした日 |
| `status` | 下表 | ✅ | — | 育ち具合 |
| `tags` | string[] | ✅ | — | タグ |
| `related` | string[] | — | `[]` | 関連メモの **slug** 配列 |
| `published` | boolean | — | `true` | 公開フラグ |

### `status` の値

| 値 | 表示名 | 意味 |
|----|--------|------|
| `seedling` | Seedling | 芽生え・たたき台 |
| `budding` | Budding | 育成中 |
| `evergreen` | Evergreen | 定着した知見 |

### 例

```yaml
---
title: コマンドパレットのキー配列メモ
description: 修飾キーと単キーの優先順位を整理中。
planted: 2026-07-02
tended: 2026-07-04
status: seedling
tags:
  - UX
  - Keyboard
related:
  - static-preview-draft-flow
published: true
---
```

`related` には **同じ `content/idea/` 内の slug**（拡張子なし）を指定します。双方向リンクは自動では作られませんが、バックリンクはサイト側で計算されます。

### 表示先

- 一覧: `/idea`（カード / IDEA GRAPH）
- 詳細: `/idea/{slug}`
- グラフ: Idea ページの「IDEA」タブ、および「ALL」タブ内のノード

---

## 新規ファイルの追加手順

1. 対応フォルダに `{slug}.mdx` を作成
2. 上記スキーマに沿って frontmatter を書く
3. `npm run dev` で表示を確認
4. `published: true` にして commit → push（Vercel 自動デプロイ）

## スキーマ変更時

フィールドを追加・変更する場合は **必ず** [lib/content/schema.ts](../lib/content/schema.ts) を更新し、この README も合わせて直してください。
