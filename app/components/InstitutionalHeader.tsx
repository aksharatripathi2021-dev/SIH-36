"use client";

import React from "react";
import { EmblemOfIndia } from "./EmblemOfIndia";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslation } from "@/i18n";

export function InstitutionalHeader() {
  const { t } = useTranslation();

  return (
    <header className="w-full select-none bg-white">
      {/* 1. Top Utility Bar (Black) */}
      <div className="bg-[#111111] text-[#E5E7EB] text-xs font-normal border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          {/* Left: Government of India in Hindi & English */}
          <div className="flex items-center space-x-2 text-[11px] sm:text-xs tracking-tight text-neutral-300">
            <span>भारत सरकार</span>
            <span className="text-neutral-500">|</span>
            <span>Government of India</span>
          </div>

          {/* Right: Accessibility Controls & Language Selector */}
          <div className="flex items-center space-x-3 sm:space-x-4 text-[11px] sm:text-xs text-neutral-300">
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title={t("header.accessibility")}
            >
              {t("header.accessibility")}
            </button>
            <span className="text-neutral-600 hidden xs:inline">|</span>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer hidden xs:inline"
              title={t("header.screenReader")}
            >
              {t("header.screenReader")}
            </button>
            <span className="text-neutral-600">|</span>
            <LanguageSelector variant="dark" />
          </div>
        </div>
      </div>

      {/* 2. Institutional Branding Banner (White) */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left: Ashoka Emblem + Department Name */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="shrink-0 flex items-center justify-center">
              <EmblemOfIndia className="w-10 h-12 sm:w-12 sm:h-14 drop-shadow-xs" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-slate-900 font-bold text-sm sm:text-base leading-tight tracking-tight">
                उपभोक्ता मामले विभाग
              </span>
              <span className="text-slate-700 font-semibold text-xs sm:text-sm tracking-wider uppercase leading-tight mt-0.5">
                DEPARTMENT OF CONSUMER AFFAIRS
              </span>
            </div>
          </div>

          {/* Right: Portal Title & Authority */}
          <div className="flex flex-col md:items-end justify-center pt-1 md:pt-0 border-t border-neutral-100 md:border-t-0">
            <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase">
              DEPARTMENT OF CONSUMER AFFAIRS
            </span>
            <h1 className="text-slate-900 font-bold text-base sm:text-lg lg:text-xl tracking-tight leading-snug">
              Legal Metrology — Online Verification System
            </h1>
          </div>
        </div>
      </div>

      {/* 3. Deep Crimson / Maroon Government Accent Stripe */}
      <div className="w-full bg-[#801424] h-7 sm:h-8 shadow-xs border-y border-[#6D0E1C]" />
    </header>
  );
}
