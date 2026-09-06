"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTransition } from "react";

export function PageRecovery({ retry, admin = false }: { retry: () => void; admin?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-10">
      <div className="max-w-md">
        <RefreshCw size={24} className="text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-6 text-2xl font-medium tracking-tight">{admin ? "管理画面を開けませんでした" : "ページを読み込めませんでした"}</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">一時的に接続が途切れた可能性があります。少し待ってから、もう一度読み込んでみてください。</p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <button type="button" className="button-primary" disabled={pending} onClick={() => startTransition(retry)}>{pending ? "読み込み中…" : "もう一度読み込む"}</button>
          <Link href={admin ? "/admin" : "/"} className="text-sm underline underline-offset-4">{admin ? "記事一覧へ" : "ホームへ"}</Link>
        </div>
      </div>
    </section>
  );
}
