const FONT_SAMPLES = [
  { label: "本文 / Inter・Noto Sans JP", className: "font-sans", text: "日本語の文字を確認するためのサンプルです。" },
  { label: "コード / JetBrains Mono", className: "font-mono", text: "const message = 'Hello, world!';" },
] as const;

const FONT_SIZE_SCALE = [
  { name: "text-xs", value: "12 px", className: "text-xs" },
  { name: "text-sm", value: "14 px", className: "text-sm" },
  { name: "text-base", value: "16 px", className: "text-base" },
  { name: "text-xl", value: "20 px", className: "text-xl" },
  { name: "text-2xl", value: "24 px", className: "text-2xl" },
  { name: "text-4xl", value: "36 px", className: "text-4xl" },
] as const;

export function DesignTypographySection() {
  return (
    <section aria-labelledby="design-typography" className="pb-20">
      <h2 id="design-typography" className="mb-6 border-b border-border pb-3 text-xs text-muted-foreground">文字</h2>
      <div className="space-y-8">
        {FONT_SAMPLES.map((sample) => (
          <div key={sample.label} className="border-b border-border pb-8">
            <p className="mb-4 text-xs text-muted-foreground">{sample.label}</p>
            <p className={`break-words text-xl leading-relaxed ${sample.className}`}>{sample.text}</p>
            <p className={`mt-2 text-sm text-muted-foreground ${sample.className}`}>The quick brown fox 0123456789</p>
          </div>
        ))}
        <div className="space-y-6">
          {FONT_SIZE_SCALE.map((item) => (
            <div key={item.name} className="grid items-baseline gap-2 sm:grid-cols-[9rem_1fr]">
              <p className="font-mono text-[10px] text-muted-foreground">{item.name} · {item.value}</p>
              <p className={`tracking-tight ${item.className}`}>文字サイズのサンプル。Sample text.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
