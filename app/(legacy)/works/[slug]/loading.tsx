export default function Loading() {
  return (
    <div role="status" className="mx-auto w-full max-w-4xl px-6 py-16 sm:px-10">
      <p className="text-sm text-muted-foreground">作品を読み込んでいます</p>
      <div aria-hidden="true" className="mt-8 h-64 rounded-md bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
