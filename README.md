# Hiroto Portfolio

Hiroto Furugenの個人サイト。現在の公開ページはトップとブログです。

## 技術スタック

- Next.js 16 / React 19 / TypeScript
- CSS Modules for the public site; Tailwind CSS for shared fallback screens
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

公開URLは `NEXT_PUBLIC_SITE_URL` で指定します。現在、Supabase や CMS への接続はありません。

## コンテンツ

ブログの公開記事は現在ありません。`lib/content/index.ts` は空の一覧を返します。Git にサンプル記事やローカル検証用データを追加しないでください。公開記事用の Tiptap JSON 検証・表示は `lib/cms/document.ts` と `components/blog/tiptap-content.tsx` に残しています。プロフィールと経歴のコピーは `app/(site)/page.tsx` にあります。

将来の記事公開フローとして Notion → Integration Webhooks → Blob → Next.js を計画していますが、まだ実装していません。現在 Supabase や Notion への接続はなく、今回の変更でリモートデータにはアクセスも変更もしていません。管理画面、認証、記事・画像の保存先もありません。
