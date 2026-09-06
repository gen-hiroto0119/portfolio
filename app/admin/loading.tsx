export default function Loading() {
  return (
    <div role="status" className="mx-auto max-w-4xl py-12">
      <p className="text-sm text-muted-foreground">管理画面を読み込んでいます</p>
      <div aria-hidden="true" className="mt-8 h-48 rounded-md bg-surface motion-safe:animate-pulse" />
    </div>
  );
}
