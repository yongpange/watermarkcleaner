/**
 * Language detection utilities for UI language preference
 */

export type SupportedLocale = 'en' | 'zh';

/**
 * Detect user's preferred language based on multiple sources
 * Priority: URL params > LocalStorage > Browser language > Default
 */
export function detectUserLanguage(): SupportedLocale {
  // 1. Check URL parameters
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang === 'en' || urlLang === 'zh') {
      return urlLang;
    }
  }

  // 2. Check LocalStorage
  if (typeof window !== 'undefined') {
    const storedLang = localStorage.getItem('preferred-language');
    if (storedLang === 'en' || storedLang === 'zh') {
      return storedLang;
    }
  }

  // 3. Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
  }

  // 4. Default to English
  return 'en';
}

/**
 * Save user's language preference to LocalStorage
 */
export function saveLanguagePreference(locale: SupportedLocale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-language', locale);
  }
}

/**
 * Auto-switch language based on detection
 * Only switches if current locale doesn't match detected preference
 */
export function autoSwitchLanguage(): void {
  if (typeof window === 'undefined') return;

  const detected = detectUserLanguage();
  const pathParts = window.location.pathname.split('/');
  const currentLocale = pathParts[1];

  // Only switch if detected language is different and current locale is valid
  if (
    detected !== currentLocale &&
    (currentLocale === 'en' || currentLocale === 'zh')
  ) {
    const newPath = window.location.pathname.replace(
      `/${currentLocale}`,
      `/${detected}`
    );
    window.location.href = newPath + window.location.search;
  }
}

/**
 * Get locale from current URL path
 */
export function getLocaleFromPath(): SupportedLocale {
  if (typeof window === 'undefined') return 'en';

  const pathParts = window.location.pathname.split('/');
  const locale = pathParts[1];

  return locale === 'zh' ? 'zh' : 'en';
}

/**
 * Build localized path
 */
export function buildLocalizedPath(
  path: string,
  locale: SupportedLocale
): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // For English, use as-needed strategy (no prefix for default locale)
  if (locale === 'en') {
    return `/${cleanPath}`;
  }

  return `/${locale}/${cleanPath}`;
}

