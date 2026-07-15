# Attachments

Obsidian Vault（`content/`）内の画像置き場です。Blog / Idea の本文から参照します。

## 置き方

```
content/attachments/
├── blog/
│   └── {slug}/
│       └── hero.png
└── shared/
    └── mark.svg
```

記事固有の画像は `blog/{slug}/`、使い回しは `shared/` を推奨します。

## MDX での参照

Obsidian 埋め込み（推奨）:

```md
![[boundary.svg|キャプション]]
```

標準 Markdown:

```md
![キャプション](../attachments/blog/my-post/hero.png)
```

basename だけで参照できます（Vault 内でファイル名が重複しないこと）:

```md
![[hero.png]]
```

公開 URL は `/attachments/...` に解決され、`app/attachments/[...path]` が `content/attachments` から配信します。

## Blog cover

frontmatter の `cover` に同じ参照形式を書けます。

```yaml
cover: boundary.svg
```
