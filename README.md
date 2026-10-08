# Hiroto Portfolio

Hiroto Furugenの個人サイト。作品の紹介と、開発や日々の記録を載せています。

## 技術スタック

- Next.js 16 / React 19 / TypeScript
- CSS Modules for the public home and blog; Tailwind CSS / Base UI for existing screens
- Read-only Tiptap JSON rendering
- Vercel

## 開発

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

公開URLは `NEXT_PUBLIC_SITE_URL` で指定します。Supabase 接続用の環境変数はありません。

## コンテンツ

ブログの公開記事は現在ありません。`lib/content/index.ts` は空の一覧と記事なしを返し、新しい CMS を接続するまで公開データを表示しません。管理画面、認証、記事・画像の保存先はありません。Git にサンプル記事を追加したり、ローカル検証用データを公開コンテンツとして扱ったりしないでください。将来の CMS が公開スナップショットを提供する場合に備え、Tiptap JSON の読み込みと表示は維持しています。

当面の記事管理には Notion を採用し、公開済み記事の編集は次の同期でサイトに反映する方針です。Notion 接続は未実装で、今回の公開サイト刷新には含めていません。MinRich の Rust 製公開プラグインとサイト側 SDK は後回しにします。

作品は `app/(legacy)/works/_entries/` に `*.meta.ts` と `*.tsx` を用意し、`index.ts` で登録します。タイトル・担当・公開状態などは共通管理し、本文やレイアウトは作品ごとにコードで組みます。

色と本文のスタイルは `app/globals.css`、プロフィールとコピーは `lib/profile.ts` と `lib/i18n/messages.ts` にあります。

`supabase/migrations/` は旧データモデルとセキュリティ設定の履歴です。変更・適用せず、リモートデータの削除や変更も行わないでください。
