export type SkillGroup = {
  name: string;
  items: string[];
};

export type ContactLink = {
  label: string;
  href: string;
};

export const profile = {
  name: "Hiroto Furugen",
  strengths: ["行動力", "成長意欲", "課題解決力", "協調性", "イノベーション"],
  skills: [
    {
      name: "Product",
      items: [
        "Product Management",
        "Product Marketing",
        "要件定義 / 仕様策定",
        "Agentic システム設計",
        "プロダクト戦略",
      ],
    },
    {
      name: "Engineering",
      items: [
        "Go / Echo",
        "Python / FastAPI",
        "TypeScript / React / Next.js",
        "Google Cloud (GCP)",
        "AI / LLM",
      ],
    },
    {
      name: "Marketing",
      items: [
        "広告運用 (Google / Yahoo!)",
        "効果分析・改善提案",
        "フィールドマーケティング",
        "GEO / AIO / LLMO",
        "アカウントマネジメント",
      ],
    },
  ] satisfies SkillGroup[],
  contact: [
    { label: "GitHub", href: "https://github.com/gen-hiroto0119" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/gen-hiroto" },
  ] satisfies ContactLink[],
} as const;
