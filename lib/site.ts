export const site = {
  name: "Hiroto Furugen",
  shortName: "Hiroto",
  description:
    "本質的な課題を、技術とビジネスの両輪でかたちにする。マーケティング・PdM・バックエンド開発を横断する Hiroto Furugen のポートフォリオ。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiroto-portfolio.vercel.app",
  socials: {
    github: "https://github.com/gen-hiroto0119",
    linkedin: "https://www.linkedin.com/in/gen-hiroto",
  },
} as const;

export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Works", href: "/works" },
  { label: "Blog", href: "/blog" },
  { label: "Idea", href: "/idea" },
  { label: "Lab", href: "/lab" },
  { label: "Design", href: "/design" },
  { label: "About", href: "/about" },
];
