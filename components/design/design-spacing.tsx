const SPACING_SCALE = [
  { name: "1", value: "4 px", className: "w-1" },
  { name: "2", value: "8 px", className: "w-2" },
  { name: "3", value: "12 px", className: "w-3" },
  { name: "4", value: "16 px", className: "w-4" },
  { name: "6", value: "24 px", className: "w-6" },
  { name: "8", value: "32 px", className: "w-8" },
  { name: "12", value: "48 px", className: "w-12" },
  { name: "20", value: "80 px", className: "w-20" },
] as const;

const RADIUS_SCALE = [
  { name: "rounded-sm", value: "4 px", className: "rounded-sm" },
  { name: "rounded-md", value: "6 px", className: "rounded-md" },
  { name: "rounded-lg", value: "8 px", className: "rounded-lg" },
] as const;

export function DesignSpacingSection() {
  return (
    <section aria-labelledby="design-spacing" className="pb-20">
      <h2 id="design-spacing" className="mb-6 border-b border-border pb-3 text-xs text-muted-foreground">余白と角丸</h2>
      <div className="mb-10 space-y-4">
        {SPACING_SCALE.map((item) => (
          <div key={item.name} className="grid grid-cols-[6rem_1fr] items-center gap-4">
            <p className="font-mono text-[10px] text-muted-foreground">{item.name} · {item.value}</p>
            <div aria-hidden className={`h-1 rounded-full bg-foreground ${item.className}`} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-8">
        {RADIUS_SCALE.map((item) => (
          <div key={item.name}>
            <div aria-hidden className={`mb-3 size-16 border border-border bg-surface ${item.className}`} />
            <p className="font-mono text-[10px] text-muted-foreground">{item.name}<br />{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
