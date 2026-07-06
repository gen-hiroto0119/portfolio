"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";
import { useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { LocaleToggle } from "@/components/i18n/locale-toggle";
import { iconSize, iconStroke } from "@/lib/icons";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { navItems, site } from "@/lib/site";
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
  trigger: {
    display: "none",
    paddingInline: spacing.sm,
    backgroundColor: "transparent",
    color: colors.fgMuted,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
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
    "@media (max-width: 640px)": {
      display: "inline-flex",
    },
  },
  backdrop: {
    backgroundColor: `color-mix(in srgb, ${colors.bg} 98%, transparent)`,
    opacity: 1,
    transitionProperty: "opacity",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":is([data-starting-style], [data-ending-style])": {
      opacity: 0,
    },
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: "0ms",
      ":is([data-starting-style], [data-ending-style])": {
        opacity: 1,
      },
    },
  },
  popup: {
    backgroundColor: colors.bg,
    opacity: 1,
    transitionProperty: "opacity",
    transitionDuration: motion.durationBase,
    transitionTimingFunction: motion.easing,
    ":is([data-starting-style], [data-ending-style])": {
      opacity: 0,
    },
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: "0ms",
      ":is([data-starting-style], [data-ending-style])": {
        opacity: 1,
      },
    },
  },
  header: {
    height: "4rem",
    paddingInline: spacing.lg,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  logo: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    color: colors.fg,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.accent,
    },
  },
  closeButton: {
    paddingInline: spacing.sm,
    backgroundColor: "transparent",
    color: colors.fgMuted,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: radius.md,
    fontFamily: fonts.mono,
    fontSize: fontSize.lg,
    lineHeight: 1,
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
  menuBody: {
    paddingInline: spacing.lg,
    paddingBlock: spacing.md,
  },
  navLink: {
    gap: spacing.md,
    paddingBlock: spacing.md,
    fontFamily: fonts.display,
    fontSize: fontSize.xl,
    color: colors.fg,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.accent,
    },
  },
  navLinkActive: {
    color: colors.accent,
  },
  navNumber: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgFaint,
    flexShrink: 0,
    minWidth: "1.5rem",
  },
  footer: {
    gap: spacing.lg,
    paddingInline: spacing.lg,
    paddingBlock: spacing.lg,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
  },
  socialLink: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
    },
  },
});

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        {...stylex.props(
          styles.trigger,
          x.alignItems.center,
          x.justifyContent.center,
          x.minWidth["2.5rem"],
          x.height["2rem"],
          x.cursor.pointer,
        )}
        aria-label={t.nav.openMenu}
      >
        <Menu size={iconSize} strokeWidth={iconStroke} aria-hidden />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop
          {...stylex.props(
            styles.backdrop,
            x.position.fixed,
            x.inset._0,
            x.zIndex._50,
          )}
        />
        <Dialog.Popup
          {...stylex.props(
            styles.popup,
            x.position.fixed,
            x.inset._0,
            x.zIndex._50,
            x.display.flex,
            x.flexDirection.column,
            x.overflow.hidden,
          )}
        >
          <div
            {...stylex.props(
              styles.header,
              x.display.flex,
              x.alignItems.center,
              x.justifyContent["space-between"],
              x.flexShrink._0,
            )}
          >
            <Link
              href="/"
              {...stylex.props(styles.logo, x.textDecoration.none)}
              onClick={() => setOpen(false)}
            >
              Hiroto Furugen
            </Link>
            <Dialog.Close
              {...stylex.props(
                styles.closeButton,
                x.display["inline-flex"],
                x.alignItems.center,
                x.justifyContent.center,
                x.minWidth["2.5rem"],
                x.height["2rem"],
                x.cursor.pointer,
              )}
              aria-label={t.nav.closeMenu}
            >
              <X size={iconSize} strokeWidth={iconStroke} aria-hidden />
            </Dialog.Close>
          </div>

          <nav
            {...stylex.props(
              styles.menuBody,
              x.display.flex,
              x.flexDirection.column,
              x.flex._1,
              x.overflowY.auto,
            )}
            aria-label="Mobile"
          >
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                {...stylex.props(
                  styles.navLink,
                  x.display.flex,
                  x.alignItems.center,
                  x.textDecoration.none,
                  isNavActive(pathname, item.href) && styles.navLinkActive,
                )}
                onClick={() => setOpen(false)}
              >
                <span {...stylex.props(styles.navNumber)}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div
            {...stylex.props(
              styles.footer,
              x.display.flex,
              x.alignItems.center,
              x.flexShrink._0,
            )}
          >
            <a
              href={site.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              {...stylex.props(
                styles.socialLink,
                x.textTransform.uppercase,
                x.textDecoration.none,
              )}
            >
              GitHub
            </a>
            <a
              href={site.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              {...stylex.props(
                styles.socialLink,
                x.textTransform.uppercase,
                x.textDecoration.none,
              )}
            >
              LinkedIn
            </a>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
