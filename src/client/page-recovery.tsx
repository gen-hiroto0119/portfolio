/** @jsxImportSource hono/jsx/dom */
import { useTransition } from "hono/jsx";

export function PageRecovery() {
  const [pending, startTransition] = useTransition();
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-10">
      <div className="max-w-md">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-muted-foreground" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        <h1 className="mt-6 text-2xl font-medium tracking-tight">ページを読み込めませんでした</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">一時的に接続が途切れた可能性があります。少し待ってから、もう一度読み込んでみてください。</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button type="button" className="button-primary" disabled={pending} onClick={() => startTransition(() => location.reload())}>{pending ? "読み込み中…" : "もう一度読み込む"}</button>
          <a href="/" className="text-sm underline underline-offset-4">ホームへ</a>
        </div>
      </div>
    </section>
  );
}
