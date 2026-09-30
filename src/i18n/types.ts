import { SupportedLanguage } from "../types";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeName: "मराठी" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "te", label: "Telugu", nativeName: "తెలుగు" }
];

export type TranslationDictionary = Record<string, string>;
export type TranslationsByLanguage = Record<SupportedLanguage, TranslationDictionary>;
