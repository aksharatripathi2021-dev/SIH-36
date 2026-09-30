"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n";

interface LmoSidebarProps {
  activeItem?: "dashboard" | "pending" | "history" | "schedule" | "certificates" | "reports" | "qr-confirmations";
  isOpen?: boolean;
  onClose?: () => void;
}

export function LmoSidebar({ activeItem = "dashboard", isOpen = false, onClose }: LmoSidebarProps) {
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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0D1B2A] text-slate-100 flex flex-col justify-between border-r border-[#1B2A3D] transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E2E42]">
            <Link href="/lmo/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#1A365D] border border-blue-400/30 flex items-center justify-center text-blue-200 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  LM Verify
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {t("roles.lmo")}
                </span>
              </div>
            </Link>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="md:hidden text-slate-400 hover:text-white p-1"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Navigation Sections */}
          <div className="px-3 py-4 space-y-6 overflow-y-auto">
            {/* 1. OVERVIEW */}
            <div>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {t("nav.overview")}
              </p>
              <div className="space-y-1">
                <Link
                  href="/lmo/dashboard"
                  onClick={onClose}
                  className={navItemClass(isNavActive("dashboard", "/lmo/dashboard"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>{t("nav.dashboard")}</span>
                </Link>

                <Link
                  href="/lmo/applications"
                  onClick={onClose}
                  className={navItemClass(isNavActive("pending", "/lmo/applications"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t("nav.applications")}</span>
                </Link>

                <div className="flex items-center gap-3 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#162334] cursor-pointer">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t("nav.testingHistory")}</span>
                </div>
              </div>
            </div>

            {/* 2. WORK QUEUE */}
            <div>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {t("nav.verification")}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#162334] cursor-pointer">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{t("status.scheduled")}</span>
                </div>

                <Link
                  href="/verify-certificate?id=CERT-2025-00981"
                  onClick={onClose}
                  className={navItemClass(isNavActive("certificates", "/verify-certificate"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>{t("nav.certificates")}</span>
                </Link>

                <Link
                  href="/lmo/qr-confirmations"
                  onClick={onClose}
                  className={navItemClass(isNavActive("qr-confirmations", "/lmo/qr-confirmations"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>{t("nav.qrConfirmations")}</span>
                </Link>

                <div className="flex items-center gap-3 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#162334] cursor-pointer">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Info Card */}
        <div className="p-3 border-t border-[#1E2E42]">
          <div className="flex items-center justify-between p-2 rounded-md bg-[#132235]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                PS
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">Priya Sharma</span>
                <span className="text-[10px] text-slate-400 truncate">lmo.delhisouth@go...</span>
              </div>
            </div>
            <button type="button" className="text-slate-400 hover:text-white p-1" title="Account settings">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
