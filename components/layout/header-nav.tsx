"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { useCommandPalette } from "@/components/command-palette/command-palette-provider";
import { useLocale } from "@/components/i18n/locale-provider";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { iconSize, iconStroke } from "@/lib/icons";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems } from "@/lib/site";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  motion,
  radius,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  nav: {
    gap: spacing.lg,
  },
  links: {
    gap: spacing.md,
    "@media (max-width: 640px)": {
      display: "none",
    },
  },
  link: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
    },
  },
  linkActive: {
    color: colors.accent,
  },
  actions: {
    gap: spacing.sm,
  },
  commandButton: {
    paddingInline: spacing.sm,
    backgroundColor: "transparent",
    color: colors.fgMuted,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    transitionProperty: "color, border-color, background-color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
      borderColor: colors.borderStrong,
      backgroundColor: colors.bgSubtle,
    },
    ":focus-visible": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: colors.accent,
      outlineOffset: "2px",
    },
  },
  commandLabel: {
    "@media (max-width: 640px)": {
      display: "none",
    },
  },
  commandIcon: {
    display: "none",
    "@media (max-width: 640px)": {
      display: "block",
    },
  },
});

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav() {
  const pathname = usePathname();
  const { openPalette } = useCommandPalette();
  const { t } = useLocale();

  return (
    <nav
      {...stylex.props(styles.nav, x.display.flex, x.alignItems.center)}
      aria-label="Main"
    >
      <div
        {...stylex.props(
          styles.links,
          x.display.flex,
          x.alignItems.center,
        )}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            {...stylex.props(
              styles.link,
              x.textTransform.uppercase,
              x.textDecoration.none,
              isNavActive(pathname, item.href) && styles.linkActive,
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div
        {...stylex.props(
          styles.actions,
          x.display.flex,
          x.alignItems.center,
        )}
      >
        <MobileMenu />
        <button
          type="button"
          {...stylex.props(
            styles.commandButton,
            x.display["inline-flex"],
            x.alignItems.center,
            x.justifyContent.center,
            x.minWidth["2.5rem"],
            x.height["2rem"],
            x.cursor.pointer,
          )}
          aria-label={t.nav.openCommandPalette}
          onClick={openPalette}
        >
          <span {...stylex.props(styles.commandLabel)}>⌘K</span>
          <Search
            {...stylex.props(styles.commandIcon)}
            size={iconSize}
            strokeWidth={iconStroke}
            aria-hidden
          />
        </button>
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </nav>
  );
}
