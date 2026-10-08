@AGENTS.md

# Claude 向けメモ

`AGENTS.md` を正とする。Next.js の仕様は `node_modules/next/dist/docs/` で確認する。

- 現在の公開ページはトップとブログ。公開記事は空で、サンプル記事やローカル検証用データを追加しない。
- プロフィールと経歴のコピーは `app/(site)/page.tsx` にある。事実を保つ。
- 公開記事用の Tiptap JSON 検証・表示は維持する。Base UI は使用しない。
- Notion → Integration Webhooks → Blob → Next.js は計画中だが未実装。旧実装の整理ではリモートデータを変更しない。Notion 連携は別途合意した範囲で実装する。
- CSS Modules を公開サイトに、Tailwind CSS を共通フォールバック画面に使う。
- 明示的な依頼がない限り commit / push / deploy しない。
