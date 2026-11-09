export const site = {
  name: "Hiroto Furugen",
  description:
    "Hiroto Furugenの個人サイト。つくったものや、ソフトウェア開発で学んだこと、日々の記録をまとめています。",
  url: import.meta.env.SITE.replace(/\/$/, ""),
  socials: {
    github: "https://github.com/gen-hiroto0119",
    linkedin: "https://www.linkedin.com/in/gen-hiroto",
  },
} as const;
