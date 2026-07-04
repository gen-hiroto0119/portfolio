import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { HeaderNav } from "@/components/layout/header-nav";
import {
  colors,
  fontSize,
  fonts,
  letterSpacing,
  maxWidth,
  motion,
  spacing,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  header: {
    WebkitBackdropFilter: "blur(8px)",
    backgroundColor: `color-mix(in srgb, ${colors.bg} 85%, transparent)`,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  inner: {
    gap: spacing.lg,
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    // Fixed height keeps the hero's 100svh offset calculation exact.
    height: "4rem",
    paddingInline: spacing.lg,
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
});

export function Header() {
  return (
    <header
      {...stylex.props(
        styles.header,
        x.position.sticky,
        x.top._0,
        x.zIndex._50,
        x.backdropFilter["blur(8px)"],
      )}
    >
      <div
        {...stylex.props(
          styles.inner,
          x.display.flex,
          x.alignItems.center,
          x.justifyContent["space-between"],
          x.width["100%"],
        )}
      >
        <Link
          href="/"
          {...stylex.props(
            styles.logo,
            x.textTransform.lowercase,
            x.textDecoration.none,
          )}
        >
          hiroto
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
