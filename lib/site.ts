export const site = {
  name: "Hiroto Furugen",
  shortName: "Hiroto",
  description:
    "Hiroto Furugenの個人サイト。つくったものや、ソフトウェア開発で学んだこと、日々の記録をまとめています。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://hiroto-portfolio.vercel.app",
  socials: {
    github: "https://github.com/gen-hiroto0119",
    linkedin: "https://www.linkedin.com/in/gen-hiroto",
  },
} as const;
