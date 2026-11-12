# Hiroto Portfolio

Hiroto Furugenの個人サイト。トップとブログをAstroで静的生成します。

## 構成

- Astro / TypeScript（出力は静的HTMLのみ）
- 記事はGitで管理するMarkdown
- OGP画像はビルド時にsatoriで生成
- Vercelで配信

```text
src/
  pages/            # ページ・RSS・sitemap・robots・OGP画像
  layouts/          # 共通レイアウト
  components/       # 表示部品
  content/blog/     # 記事（<slug>.md）と画像
  content.config.ts # 記事のスキーマ
  feature/posts/    # 記事の取得
  lib/              # サイト設定・OGP・XML
  styles/           # 全体に効くCSS（部品ごとのCSSは各.astroに書く）
public/             # 画像・フォント
```

## 開発

Node.js 24を使用します。

```sh
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

PRではGitHub Actionsで`npm run lint`と`npm run build`を実行します。

環境変数はVercelのProductionで管理し、`vercel env pull`で取得します。使うのは公開URLの`NEXT_PUBLIC_SITE_URL`だけで、変数名は既存のVercel設定を引き継ぐため残しています。

## 記事

`src/content/blog/<slug>.md`を追加します。ファイル名がURL（`/blog/<slug>`）になり、英小文字・数字・ハイフンだけを使えます。

```md
---
title: 記事タイトル
description: 一覧・OGP・RSSに使う概要
date: 2026-11-10
updated: 2026-11-12 # 任意
tags: [astro]
---

本文

![画像の説明](./image.png)
```

画像は記事と同じディレクトリに置き、相対パスで参照するとビルド時に最適化されます。

`main`へのpushでデプロイされ、公開されます。取り下げは記事ファイルを削除してpushします。リポジトリは公開されているため、削除した記事もGitの履歴には残ります。

公開先は[hirotofurugen.dev](https://hirotofurugen.dev/)です。
