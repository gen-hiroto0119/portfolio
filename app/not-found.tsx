import Link from "next/link";
export default function NotFound() {
  return <div className="mx-auto w-full max-w-4xl px-6 py-28 sm:px-10"><p className="text-sm text-muted-foreground">404</p><h1 className="mt-4 text-2xl font-medium">ページが見つかりませんでした。</h1><Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">ホームへ戻る</Link></div>;
}
