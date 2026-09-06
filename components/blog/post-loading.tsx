export function PostListLoading() {
  return (
    <div role="status" className="space-y-8 py-6">
      <span className="sr-only">記事を読み込んでいます</span>
      <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-3">
            <div className="h-5 w-3/4 rounded bg-surface" />
            <div className="h-3 w-24 rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostDetailLoading() {
  return (
    <div role="status" className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
      <span className="sr-only">記事を読み込んでいます</span>
      <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
        <div className="h-4 w-20 rounded bg-surface" />
        <div className="h-10 w-4/5 rounded bg-surface" />
        <div className="h-4 w-32 rounded bg-surface" />
        <div className="h-64 rounded bg-surface" />
      </div>
    </div>
  );
}
