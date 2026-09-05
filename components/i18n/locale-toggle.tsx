"use client";

import { Languages } from "lucide-react";

import { useLocale } from "@/components/i18n/locale-provider";
import type { Locale } from "@/lib/i18n/messages";
import { iconSize, iconStroke } from "@/lib/icons";


function nextLocale(current: Locale): Locale {
  return current === "ja" ? "en" : "ja";
}

export function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <button
      type="button"
      className="icon-button"
      aria-label={locale === "ja" ? t.locale.switchToEn : t.locale.switchToJa}
      onClick={() => setLocale(nextLocale(locale))}
    >
      <Languages size={iconSize} strokeWidth={iconStroke} aria-hidden />
    </button>
  );
}
