@AGENTS.md

# Claude 向けメモ

`AGENTS.md` を正とする。Next.js の仕様は `node_modules/next/dist/docs/` で確認する。

- 現在の公開ページはトップとブログ。記事は private Blob のスナップショットから読み込み、Blob 未設定時は空として扱う。サンプル記事やローカル検証用データを追加しない。
- プロフィールと経歴のコピーは `app/(site)/page.tsx` にある。事実を保つ。
- 公開記事用の Tiptap JSON 検証・表示は維持する。Base UI は使用しない。
- Notion → Workflow → private Blob → Next.js を実装した。`BLOG_SYNC_ENABLED=false` が初期値で、実サービスの秘密値がないため配信は未検証。実サービスへの変更は明示的な許可なしに行わない。
- CSS Modules を公開サイトに、Tailwind CSS を共通フォールバック画面に使う。
- 明示的な依頼がない限り commit / push / deploy やリモートサービス変更をしない。
