import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { Theme } from "@/components/theme/theme-provider";
import { navItems, site } from "@/lib/site";

export type CommandGroup = "Navigation" | "Theme" | (string & {});

export type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  keywords?: string[];
  perform: () => void;
};

export function createNavigationCommands(
  router: AppRouterInstance,
): CommandItem[] {
  const home: CommandItem = {
    id: "nav-home",
    group: "Navigation",
    label: "Home",
    keywords: ["ほーむ", "home", "トップ", "top"],
    perform: () => router.push("/"),
  };

  const pages = navItems.map((item) => ({
    id: `nav-${item.href.slice(1)}`,
    group: "Navigation" as const,
    label: item.label,
    keywords: getNavKeywords(item.label, item.href),
    perform: () => router.push(item.href),
  }));

  return [home, ...pages];
}

export function createThemeCommands(
  setTheme: (theme: Theme) => void,
): CommandItem[] {
  return [
    {
      id: "theme-dark",
      group: "Theme",
      label: "Dark theme",
      keywords: ["だーく", "dark", "ダーク", "暗い"],
      perform: () => setTheme("dark"),
    },
    {
      id: "theme-light",
      group: "Theme",
      label: "Light theme",
      keywords: ["らいと", "light", "ライト", "明るい"],
      perform: () => setTheme("light"),
    },
    {
      id: "theme-system",
      group: "Theme",
      label: "System theme",
      keywords: ["しすてむ", "system", "システム", "自動", "auto"],
      perform: () => setTheme("system"),
    },
  ];
}

export function createStaticCommands(
  router: AppRouterInstance,
  setTheme: (theme: Theme) => void,
): CommandItem[] {
  return [...createNavigationCommands(router), ...createThemeCommands(setTheme)];
}

function getNavKeywords(label: string, href: string): string[] {
  const slug = href.slice(1);
  const keywordMap: Record<string, string[]> = {
    works: ["わーくす", "works", "作品", "ポートフォリオ"],
    blog: ["ぶろぐ", "blog", "記事", "ブログ"],
    garden: ["がーでん", "garden", "ガーデン"],
    lab: ["らぼ", "lab", "ラボ", "実験"],
    design: ["でざいん", "design", "デザイン"],
    about: ["あばうと", "about", "アバウト", "自己紹介", site.name.toLowerCase()],
  };

  return [label.toLowerCase(), slug, ...(keywordMap[slug] ?? [])];
}

export function filterCommands(
  commands: CommandItem[],
  query: string,
): CommandItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return commands;

  return commands.filter((command) => {
    const haystack = [command.label, ...(command.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function groupCommands(
  commands: CommandItem[],
): { group: CommandGroup; items: CommandItem[] }[] {
  const groups = new Map<CommandGroup, CommandItem[]>();

  for (const command of commands) {
    const existing = groups.get(command.group);
    if (existing) {
      existing.push(command);
    } else {
      groups.set(command.group, [command]);
    }
  }

  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
}
