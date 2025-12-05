import { Pathnames } from "next-intl/routing";

export const locales = ["en", "zh", "es", "ar", "ru", "fr", "ko"];

export const localeNames: Record<string, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  ar: "العربية",
  ru: "Русский",
  fr: "Français",
  ko: "한국어",
};

export const defaultLocale = "en";

export const localePrefix = "as-needed";

export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";

// 定义所有支持的路径键
export type AppPathname =
  | "/"
  | "/blog"
  | "/blog/[slug]"
  | "/converter"
  | "/dashboard"
  | "/pricing"
  | "/console"
  | "/auth/login"
  | "/auth/signup"
  | "/auth/forgot"
  | "/pay-success/[session_id]"
  | "/privacy-policy"
  | "/terms-of-service";

export const pathnames = {
  "/": "/",
  "/blog": "/blog",
  "/blog/[slug]": "/blog/[slug]",
  "/converter": "/converter",
  "/dashboard": "/dashboard",
  "/pricing": "/pricing",
  "/console": "/console",
  "/auth/login": "/auth/login",
  "/auth/signup": "/auth/signup",
  "/auth/forgot": "/auth/forgot",
  "/pay-success/[session_id]": "/pay-success/[session_id]",
  "/privacy-policy": "/privacy-policy",
  "/terms-of-service": "/terms-of-service",
} satisfies Pathnames<typeof locales>;
