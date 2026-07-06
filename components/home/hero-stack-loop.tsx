"use client";

import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import type { IconType } from "react-icons";
import {
  SiDocker,
  SiFastapi,
  SiFirebase,
  SiGo,
  SiGooglecloud,
  SiHono,
  SiNextdotjs,
  SiPlanetscale,
  SiPostgresql,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
} from "react-icons/si";

import { useLocale } from "@/components/i18n/locale-provider";
import { DecryptedTextView } from "@/components/visuals/decrypted-text";
import { LogoLoop, type LogoItem } from "@/components/visuals/logo-loop";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  section: {
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
  },
  loop: {
    height: "2.25rem",
    color: colors.fgMuted,
  },
});

const STACK_ENTRIES: {
  Icon: IconType;
  title: string;
  href: string;
}[] = [
  { Icon: SiGo, title: "Go", href: "https://go.dev" },
  {
    Icon: SiTypescript,
    title: "TypeScript",
    href: "https://www.typescriptlang.org",
  },
  { Icon: SiPython, title: "Python", href: "https://www.python.org" },
  {
    Icon: SiFastapi,
    title: "FastAPI",
    href: "https://fastapi.tiangolo.com",
  },
  { Icon: SiHono, title: "Hono", href: "https://hono.dev" },
  { Icon: SiReact, title: "React", href: "https://react.dev" },
  { Icon: SiNextdotjs, title: "Next.js", href: "https://nextjs.org" },
  {
    Icon: SiTailwindcss,
    title: "Tailwind CSS",
    href: "https://tailwindcss.com",
  },
  {
    Icon: SiGooglecloud,
    title: "Google Cloud",
    href: "https://cloud.google.com",
  },
  { Icon: SiVercel, title: "Vercel", href: "https://vercel.com" },
  { Icon: SiDocker, title: "Docker", href: "https://www.docker.com" },
  {
    Icon: SiPostgresql,
    title: "PostgreSQL",
    href: "https://www.postgresql.org",
  },
  {
    Icon: SiPlanetscale,
    title: "PlanetScale",
    href: "https://planetscale.com",
  },
  {
    Icon: SiFirebase,
    title: "Firebase",
    href: "https://firebase.google.com",
  },
];

const stackLogos: LogoItem[] = STACK_ENTRIES.map(({ Icon, title, href }) => ({
  node: <Icon aria-hidden />,
  title,
  href,
}));

export function HeroStackLoop() {
  const { t } = useLocale();

  return (
    <div
      {...stylex.props(
        x.display.flex,
        x.flexDirection.column,
        x.width["100%"],
        styles.section,
      )}
    >
      <p {...stylex.props(x.textTransform.uppercase, x.margin._0, styles.label)}>
        <DecryptedTextView text={t.hero.stackLabel} />
      </p>
      <LogoLoop
        logos={stackLogos}
        speed={48}
        direction="left"
        logoHeight={22}
        gap={36}
        hoverSpeed={0}
        fadeOut
        fadeOutMode="mask"
        scaleOnHover
        ariaLabel={t.hero.stackAriaLabel}
        className={stylex.props(styles.loop).className}
      />
    </div>
  );
}
