export type SkillGroup = {
  name: string;
  items: string[];
};

export type TimelineEntry = {
  period: string;
  organization: string;
  role: string;
  summary: string;
};

export type ContactLink = {
  label: string;
  href: string;
};

export const profile = {
  name: "Hiroto Furugen",
  intro: [
    "マーケティング、プロダクトマネジメント、バックエンド開発、起業と領域を横断しながら、毎回「何が本質的な課題か」を整理し、技術とビジネスの両面から解決策をかたちにしてきました。",
    "現在は友人と共同創業した hyphen technologies で Tech Lead として、SEO / GEO / AIO に対応したコンテンツ運用自動化プラットフォーム「SCAS」をつくっています。",
    "課題発見力・課題解決力・分析力を土台に、行動力と成長意欲を持って最後までやり切ることが強みです。変化の大きい環境でも学び続け、周囲を巻き込みながら前進します。",
  ],
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
        "Go",
        "Python / FastAPI",
        "TypeScript / React / Next.js",
        "Google Cloud (GCP)",
        "AI / LLM 活用",
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
  timeline: [
    {
      period: "2026.03 — 現在",
      organization: "hyphen technologies",
      role: "Co-founder / Tech Lead",
      summary:
        "「情報の非対称を、技術で解く。」を掲げるソフトウェア企業を友人と共同創業。SEO / GEO / AIO に対応したコンテンツ運用自動化プラットフォーム「SCAS」の開発を Tech Lead として主導。複数業種での PoC を経て 2026 年 6 月に β 提供を開始。",
    },
    {
      period: "2026.07 — 現在",
      organization: "CyberAgent",
      role: "Software Engineer(長期インターン)",
      summary:
        "CyberACE – GrowthTech – CARU にて、FastAPI・Google Cloud Platform・React を用いたフルスタック開発に従事。",
    },
    {
      period: "2026.04 — 現在",
      organization: "Google",
      role: "Campus Ambassador",
      summary:
        "全国の大学・大学院から選抜された約15名の一人として、生成AI「Gemini」のマーケティングチームと協働。フィールドマーケティングを軸に、イベント企画・運営、学生コミュニティ形成、大学教授・理系学部との連携をアカウントマネジメントとして推進。",
    },
    {
      period: "2026.02 — 2026.03",
      organization: "CyberAgent",
      role: "Backend Engineer(Go College)",
      summary:
        "Go 言語と API 開発を中心とした育成型インターン。実装力に加え、設計・責務分割・保守性と拡張性を意識した、システム全体を俯瞰する視点を養った。",
    },
    {
      period: "2025.08 — 2026.07",
      organization: "LayerX",
      role: "Product Manager / Product Marketing Manager(長期インターン)",
      summary:
        "AIエージェント開発プラットフォーム「Ai Workforce」にて、プロダクト企画から仕様策定、改善提案まで従事。PdM として新機能開発とプロダクト戦略を主軸に、Agentic なシステム設計と AI ネイティブなプロダクト開発に深く関わる。ビジネスとエンジニアリングの間に立ち、市場理解と技術理解の両輪で意思決定を支えた。",
    },
    {
      period: "2024.12 — 2025.07",
      organization: "GMO Internet Group",
      role: "マーケティングプランナー(長期インターン)",
      summary:
        "Google 広告・Yahoo! 広告の運用、予算管理、クリエイティブ改善、効果測定まで一連のプロセスを担当。事業部内で GEO・AIO・LLMO など最新技術活用のリードを担い、生成AI/LLM を業務高度化につなげた。",
    },
    {
      period: "2024.04 — 2028.03(卒業見込)",
      organization: "法政大学",
      role: "地理学専攻",
      summary:
        "ゼミでは植生学・生態学における機械学習を利用した研究手法と、古典統計学手法の比較に取り組む。リベラルアーツと STEM を横断して学ぶ。",
    },
  ] satisfies TimelineEntry[],
  contact: [
    { label: "GitHub", href: "https://github.com/gen-hiroto0119" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/gen-hiroto" },
  ] satisfies ContactLink[],
} as const;
