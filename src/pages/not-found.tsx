export default function NotFoundPage({
  article = false,
}: {
  article?: boolean;
}) {
  return (
    <main id="main" class="portfolio-main">
      {!article && <p class="portfolio-secondary">404</p>}
      <h1>
        {article
          ? "記事が見つかりませんでした。"
          : "ページが見つかりませんでした。"}
      </h1>
      <a href={article ? "/blog" : "/"}>
        {article ? "← 記事一覧に戻る" : "ホームへ戻る"}
      </a>
    </main>
  );
}
