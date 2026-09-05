"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { messages, type Locale, type Messages } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "locale";
const LOCALE_CHANGE_EVENT = "portfolio-locale-change";
let fallbackLocale: Locale | null = null;

function notifyLocaleChange(): void {
  window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
}

function readStoredLocale(): Locale {
  if (fallbackLocale !== null) return fallbackLocale;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ja" || stored === "en") return stored;
    return "ja";
  } catch {
    return "ja";
  }
}

function applyLocale(locale: Locale): void {
  document.documentElement.lang = locale;
}

function subscribeLocale(onStoreChange: () => void): () => void {
  const handleChange = () => onStoreChange();

  window.addEventListener(LOCALE_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function getLocaleSnapshot(): Locale {
  return readStoredLocale();
}

function getServerLocaleSnapshot(): Locale {
  return "ja";
}

type LocaleProviderProps = {
  children: ReactNode;
};

export function LocaleProvider({ children }: LocaleProviderProps) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );

  useEffect(() => {
    applyLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextLocale);
      fallbackLocale = null;
    } catch {
      // Language changes still apply when the browser blocks persistent storage.
      fallbackLocale = nextLocale;
    }
    applyLocale(nextLocale);
    notifyLocaleChange();
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: messages[locale],
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
