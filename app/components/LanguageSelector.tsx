"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/i18n";
import { SupportedLanguage } from "@/types";

interface LanguageSelectorProps {
  variant?: "dark" | "light";
  className?: string;
}

export function LanguageSelector({ variant = "light", className = "" }: LanguageSelectorProps) {
  const { language, setLanguage, languages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const currentOption = languages.find((l) => l.code === language) || languages[0];

  const isDark = variant === "dark";

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block text-left ${className}`}
    >
      <button
        type="button"
        id="language-selector-button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${t("header.selectLanguage")}: ${currentOption.nativeName}`}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 ${
          isDark
            ? "text-neutral-200 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 focus:ring-neutral-400"
            : "text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:ring-slate-400"
        }`}
      >
        {/* Compact Globe Icon */}
        <svg
          className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-neutral-300" : "text-slate-500"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>

        {/* Visible Selected Language */}
        <span className="font-semibold tracking-tight">{currentOption.nativeName}</span>

        {/* Caret */}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""} ${
            isDark ? "text-neutral-400" : "text-slate-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Accessible Dropdown Menu */}
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby="language-selector-button"
          className="absolute right-0 mt-1 w-36 rounded-md bg-white shadow-lg border border-slate-200 py-1 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
        >
          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <li
                key={lang.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang.code as SupportedLanguage);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#801424]/10 text-[#801424] font-bold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium"
                }`}
              >
                <span>{lang.nativeName}</span>
                {isSelected && <span className="text-xs text-[#801424]">✓</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
