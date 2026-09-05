"use client";

import { Button } from "@base-ui/react/button";
import { useState } from "react";

const MOTION_DEMOS = [
  { name: "150 ms", className: "duration-150" },
  { name: "200 ms", className: "duration-200" },
  { name: "300 ms", className: "duration-300" },
] as const;

function MotionDemo({ name, className }: { name: string; className: string }) {
  const [active, setActive] = useState(false);

  return (
    <Button aria-label={`${name}の動きを試す`} aria-pressed={active} onClick={() => setActive((value) => !value)} className="rounded-md border border-border p-5 text-left hover:bg-surface">
      <span className="mb-4 block font-mono text-xs text-muted-foreground">{name}</span>
      <span aria-hidden className="relative block h-8 overflow-hidden rounded bg-surface">
        <span className={`absolute top-1.5 size-5 rounded-sm bg-foreground transition-[left] ease-out motion-reduce:transition-none ${className} ${active ? "left-[calc(100%-1.75rem)]" : "left-2"}`} />
      </span>
    </Button>
  );
}

export function DesignMotionSection() {
  return (
    <section aria-labelledby="design-motion" className="pb-20">
      <h2 id="design-motion" className="mb-6 border-b border-border pb-3 text-xs text-muted-foreground">動き</h2>
      <p className="mb-6 text-sm leading-7 text-muted-foreground">クリックすると、アニメーションにかかる時間の違いを確認できます。</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {MOTION_DEMOS.map((demo) => <MotionDemo key={demo.name} {...demo} />)}
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">動きを減らす設定に対応しています。</p>
    </section>
  );
}
