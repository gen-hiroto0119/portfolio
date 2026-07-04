import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { site } from "@/lib/site";
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
  footer: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: colors.border,
    marginTop: "auto",
  },
  inner: {
    gap: spacing.md,
    maxWidth: maxWidth.wide,
    marginInline: "auto",
    paddingBlock: spacing.lg,
    paddingInline: spacing.lg,
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    color: colors.fgMuted,
  },
  links: {
    gap: spacing.md,
  },
  link: {
    color: colors.fgMuted,
    transitionProperty: "color",
    transitionDuration: motion.durationFast,
    transitionTimingFunction: motion.easing,
    ":hover": {
      color: colors.fg,
    },
  },
});

export function Footer() {
  return (
    <footer {...stylex.props(styles.footer)}>
      <div
        {...stylex.props(
          styles.inner,
          x.display.flex,
          x.alignItems.center,
          x.justifyContent["space-between"],
          x.flexWrap.wrap,
          x.width["100%"],
        )}
      >
        <span>© 2026 {site.name}</span>
        <div
          {...stylex.props(
            styles.links,
            x.display.flex,
            x.alignItems.center,
          )}
        >
          <a
            href={site.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            {...stylex.props(
              styles.link,
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
              styles.link,
              x.textTransform.uppercase,
              x.textDecoration.none,
            )}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
