"use client";

import { Button } from "@base-ui/react/button";
import Link from "next/link";
import { useState } from "react";

import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function DesignComponentsSection() {
  const { openPalette } = useCommandPalette();
  const [count, setCount] = useState(0);

  return (
    <section aria-labelledby="design-components" className="pb-20">
      <h2 id="design-components" className="mb-6 border-b border-border pb-3 text-xs text-muted-foreground">ボタンとリンク</h2>
      <div className="divide-y divide-border">
        <div className="flex flex-wrap items-center gap-5 py-6">
          <p className="w-full text-xs text-muted-foreground sm:w-36">テーマ</p>
          <ThemeToggle />
        </div>
        <div className="flex flex-wrap items-center gap-5 py-6">
          <p className="w-full text-xs text-muted-foreground sm:w-36">コマンドパレット</p>
          <Button className="button" onClick={openPalette}>検索を開く <kbd className="ml-3 text-xs text-muted-foreground">⌘K</kbd></Button>
        </div>
        <div className="flex flex-wrap items-center gap-5 py-6">
          <p className="w-full text-xs text-muted-foreground sm:w-36">リンク</p>
          <Link href="/about" className="text-sm underline decoration-border underline-offset-4 hover:decoration-foreground">プロフィールを見る</Link>
        </div>
        <div className="flex flex-wrap items-center gap-3 py-6">
          <p className="w-full text-xs text-muted-foreground sm:mr-2 sm:w-36">ボタン</p>
          <Button className="button-primary" onClick={() => setCount((value) => value + 1)}>操作を試す</Button>
          <Button className="button" disabled={count === 0} onClick={() => setCount(0)}>リセット</Button>
          <output aria-live="polite" className="text-xs text-muted-foreground">{count} 回</output>
        </div>
      </div>
    </section>
  );
}
