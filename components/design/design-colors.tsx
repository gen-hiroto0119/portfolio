const COLOR_TOKENS = [
  { name: "background", label: "背景", light: "#FFFFFF", dark: "#141414", className: "bg-background" },
  { name: "surface", label: "面", light: "#F7F7F8", dark: "#1E1E20", className: "bg-surface" },
  { name: "foreground", label: "本文", light: "#202124", dark: "#EEEEEF", className: "bg-foreground" },
  { name: "muted-foreground", label: "補足", light: "#71717A", dark: "#A1A1AA", className: "bg-muted-foreground" },
  { name: "border", label: "境界", light: "#E8E8EB", dark: "#303033", className: "bg-border" },
  { name: "accent", label: "強調", light: "#202124", dark: "#EEEEEF", className: "bg-accent" },
] as const;

export function DesignColorsSection() {
  return (
    <section aria-labelledby="design-colors" className="pb-20">
      <h2 id="design-colors" className="mb-6 border-b border-border pb-3 text-xs text-muted-foreground">色</h2>
      <p className="mb-8 max-w-xl text-sm leading-7 text-muted-foreground">
        背景や文字に使っている色です。テーマを切り替えると、ライト・ダークそれぞれの配色を確認できます。
      </p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
        {COLOR_TOKENS.map((token) => (
          <div key={token.name}>
            <div aria-hidden className={`mb-3 aspect-[3/2] rounded-md border border-border ${token.className}`} />
            <p className="text-sm font-medium">{token.label}</p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">{token.name}</p>
            <p className="mt-2 font-mono text-[10px] leading-5 text-muted-foreground">
              Light {token.light}<br />Dark {token.dark}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
