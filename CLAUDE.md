@AGENTS.md

# Claude 向けメモ

`AGENTS.md` を正とする。Next.js の仕様は `node_modules/next/dist/docs/` で確認する。

- 公開 Blog は現在空。新しい CMS が接続されるまで記事は公開せず、Git にサンプル記事やローカル検証用データを置かない。管理画面・Supabase 接続はない。
- Works は `app/(legacy)/works/_entries/` にメタ情報と作品別TSXを追加し、`index.ts` で登録する。
- 新しい公開トップ・ブログは CSS Modules、既存画面は Tailwind CSS を使う。UIの挙動は Base UI を使う。
- `supabase/migrations/` は旧データモデルとセキュリティ設定の履歴。変更・適用せず、リモートデータを削除しない。
- 日本語のコピーは、事実を保ちながら自然な語り口に整える。
- 明示的な依頼がない限り commit / push しない。
