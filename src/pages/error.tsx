export default function ErrorPage({ path }: { path: string }) {
  return (
    <main id="main" class="portfolio-main">
      <h1>読み込みに失敗しました。</h1>
      <p>時間をおいて、もう一度お試しください。</p>
      <a class="portfolio-retry" href={path}>
        再試行
      </a>
      <a href="/">ホームへ戻る</a>
    </main>
  );
}
