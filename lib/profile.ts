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
  strengths: ["プロダクト企画", "ソフトウェア開発"],
  skills: [
    {
      name: "Product",
      items: [
        "Product Management",
        "Product Marketing",
        "Product Strategy",
      ],
    },
    {
      name: "Engineering",
      items: [
        "Next.js",
        "TypeScript",
        "Go",
        "Google Cloud",
      ],
    },
  ] satisfies SkillGroup[],
  contact: [
    { label: "GitHub", href: "https://github.com/gen-hiroto0119" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/gen-hiroto" },
  ] satisfies ContactLink[],
} as const;
