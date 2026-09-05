@AGENTS.md

# Claude 向けメモ

`AGENTS.md` を正とする。Next.js の仕様は `node_modules/next/dist/docs/` で確認する。

- Blog は Supabase と Tiptap の管理画面で編集する。Git に記事本文を置かない。
- Works は `app/works/_entries/` にメタ情報と作品別TSXを追加し、`index.ts` で登録する。
- スタイリングは Tailwind CSS、UIの挙動は Base UI を使う。
- 日本語のコピーは、事実を保ちながら自然な語り口に整える。
- 明示的な依頼がない限り commit / push しない。
