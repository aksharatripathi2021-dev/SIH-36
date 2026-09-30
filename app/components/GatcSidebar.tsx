"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n";

interface GatcSidebarProps {
  activeItem?: "dashboard" | "assigned" | "testing" | "results" | "history";
  isOpen?: boolean;
  onClose?: () => void;
}

export function GatcSidebar({ activeItem = "dashboard", isOpen = false, onClose }: GatcSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isNavActive = (key: string, href: string) => {
    if (activeItem === key) return true;
    if (pathname.startsWith(href)) return true;
    return false;
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? "bg-[#1E2E42] text-white shadow-xs font-semibold"
        : "text-slate-300 hover:text-white hover:bg-[#162334]"
    }`;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0D1B2A] text-slate-100 flex flex-col justify-between border-r border-[#1B2A3D] transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E2E42]">
            <Link href="/gatc/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#164E63] border border-cyan-400/30 flex items-center justify-center text-cyan-200 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">e-Tarazu</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">{t("roles.gatc")}</span>
              </div>
            </Link>
          </div>

          <nav className="px-3 py-4 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 py-1.5">{t("nav.overview")}</p>

            <Link href="/gatc/dashboard" className={navItemClass(isNavActive("dashboard", "/gatc/dashboard"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>{t("nav.dashboard")}</span>
            </Link>

            <Link href="/gatc/assigned" className={navItemClass(isNavActive("assigned", "/gatc/assigned"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>{t("nav.assignedApplications")}</span>
            </Link>

            <Link href="/gatc/results" className={navItemClass(isNavActive("results", "/gatc/results"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t("nav.testResults")}</span>
            </Link>

            <Link href="/gatc/history" className={navItemClass(isNavActive("history", "/gatc/history"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t("nav.testingHistory")}</span>
            </Link>
          </nav>
        </div>

        <div className="px-4 py-4 border-t border-[#1E2E42] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#164E63] text-white font-bold text-xs flex items-center justify-center shrink-0">
              GL
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">GATC Delhi Lab</p>
              <p className="text-[10px] text-slate-400 truncate">Govt. Testing Centre</p>
            </div>
          </div>
          <Link href="/login" className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
