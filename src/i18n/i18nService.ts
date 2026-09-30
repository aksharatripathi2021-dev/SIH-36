import { useState, useEffect } from "react";
import { SupportedLanguage } from "../types";
import { storageService } from "../services/storageService";
import { translations } from "./translations";
import { SUPPORTED_LANGUAGES, LanguageOption } from "./types";

type LanguageChangeListener = (lang: SupportedLanguage) => void;

class I18nService {
  private currentLanguage: SupportedLanguage = "en";
  private listeners: Set<LanguageChangeListener> = new Set();
  private isClient = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.isClient = true;
      this.currentLanguage = storageService.getLanguage();
    }
  }

  /**
   * Get the active language code
   */
  public getCurrentLanguage(): SupportedLanguage {
    if (this.isClient) {
      return storageService.getLanguage();
    }
    return this.currentLanguage;
  }

  /**
   * Return available language options
   */
  public getAvailableLanguages(): LanguageOption[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Set language, persist to storageService, and notify active listeners
   */
  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    storageService.saveLanguage(language);

    // If an active authenticated user exists, update their preferredLanguage field safely
    try {
      const activeUser = storageService.getActiveUser();
      if (activeUser && activeUser.id) {
        const langOption = SUPPORTED_LANGUAGES.find((l) => l.code === language);
        const updated = {
          ...activeUser,
          preferredLanguage: langOption?.label || language
        };
        storageService.saveActiveUser(updated);

        const users = storageService.getUsers();
        const userIdx = users.findIndex((u) => u.id === activeUser.id);
        if (userIdx !== -1) {
          users[userIdx] = updated;
          storageService.saveUsers(users);
        }
      }
    } catch {
      // Non-blocking in case user is not logged in
    }

    // Notify all subscribed components
    this.listeners.forEach((listener) => {
      try {
        listener(language);
      } catch (err) {
        console.error("[i18nService] Listener error:", err);
      }
    });
  }

  /**
   * Subscribe to reactive language changes
   */
  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Translate a key with fallback order:
   * 1. Selected language translation
   * 2. English translation
   * 3. Safe human-readable fallback ("—")
   *
   * Never returns raw semantic key names, undefined, null, or empty string.
   */
  public translate(key: string, variables?: Record<string, string | number>): string {
    const lang = this.getCurrentLanguage();
    const langDict = translations[lang];
    let template = langDict ? langDict[key] : undefined;

    // 1. Fallback to English if key missing in selected language
    if (!template && lang !== "en") {
      template = translations.en ? translations.en[key] : undefined;
    }

    // 2. Safe fallback if missing in both selected language and English
    if (!template) {
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation for key: "${key}" (language: "${lang}", fallback: "en")`);
      }
      return "—";
    }

    // 3. Variable interpolation, e.g. {count}
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        template = template!.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return template;
  }
}

export const i18nService = new I18nService();

/**
 * React hook for consuming translations reactively in UI components
 */
export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(i18nService.getCurrentLanguage());

  useEffect(() => {
    // Sync initial state on mount in browser
    setCurrentLang(i18nService.getCurrentLanguage());
    const unsubscribe = i18nService.subscribe((newLang) => {
      setCurrentLang(newLang);
    });
    return unsubscribe;
  }, []);

  return {
    t: (key: string, variables?: Record<string, string | number>) => i18nService.translate(key, variables),
    language: currentLang,
    setLanguage: (lang: SupportedLanguage) => i18nService.setLanguage(lang),
    languages: i18nService.getAvailableLanguages()
  };
}
