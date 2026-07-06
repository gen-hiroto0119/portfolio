"use client";

import { Languages } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import x from "@stylexjs/atoms";

import { useLocale } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/messages";
import { iconSize, iconStroke } from "@/lib/icons";
import {
  colors,
  motion,
  radius,
} from "@/lib/theme/tokens.stylex";

const styles = stylex.create({
  button: {
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
  },
});

function nextLocale(current: Locale): Locale {
  return current === "ja" ? "en" : "ja";
}

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      type="button"
      {...stylex.props(
        styles.button,
        x.display["inline-flex"],
        x.alignItems.center,
        x.justifyContent.center,
        x.width["2rem"],
        x.height["2rem"],
        x.padding._0,
        x.cursor.pointer,
      )}
      aria-label={locale === "ja" ? t.locale.switchToEn : t.locale.switchToJa}
      onClick={() => setLocale(nextLocale(locale))}
    >
      <Languages size={iconSize} strokeWidth={iconStroke} aria-hidden />
    </button>
  );
}
