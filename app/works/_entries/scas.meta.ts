import type { Work } from "@/app/works/_lib/schema";

export const scasWork: Work = {
  slug: "scas",
  title: "SCAS — SEO / GEO / AIO Agent Platform",
  description:
    "記事の作成・改善・公開までのコンテンツ運用を AI エージェントで自動化するプラットフォーム。共同創業した hyphen technologies で Tech Lead として開発を主導。",
  date: "2026-06-25",
  role: "Co-founder / Tech Lead",
  stack: ["TypeScript / Next.js", "Python", "LLM Agents", "Google Cloud"],
  client: "hyphen technologies(自社プロダクト)",
  challenge:
    "生成AI時代に「見つけてもらい、正しく引用される」ためのコンテンツ運用は、反復作業が多く属人化していた",
  outcome:
    "作成・改善・公開までの運用を自動化し、担当者は判断と仕上げに集中。複数業種での PoC を経て β 提供を開始",
  featured: true,
  metrics: [
    { label: "実証 (PoC)", value: "複数業種" },
    { label: "現在", value: "β 提供中" },
  ],
  links: [
    { label: "SCAS", href: "https://scas.jp" },
    { label: "hyphen technologies", href: "https://hyphen-tech.co.jp" },
  ],
  published: true,
};
