# Hiroto Portfolio

Hiroto Furugenの個人サイト。作品の紹介と、開発や日々の記録を載せています。

## 技術スタック

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS / Base UI
- Tiptap / Supabase Auth・Postgres・Storage
- Vercel

## 開発

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

`.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` を設定します。公開URLは `NEXT_PUBLIC_SITE_URL` で指定します。

## コンテンツ

ブログは `/admin` から GitHub でログインし、管理者として記事を作成・編集・公開します。下書きの保存と公開は別の操作です。記事本文と画像は Supabase に保存し、Gitからは読み込みません。

作品は `app/works/_entries/` に `*.meta.ts` と `*.tsx` を用意し、`index.ts` で登録します。タイトル・担当・公開状態などは共通管理し、本文やレイアウトは作品ごとにコードで組みます。

色と本文のスタイルは `app/globals.css`、プロフィールとコピーは `lib/profile.ts` と `lib/i18n/messages.ts` にあります。
