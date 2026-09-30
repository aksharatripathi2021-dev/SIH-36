"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n";

interface MinistrySidebarProps {
  activeItem?: "dashboard" | "applications" | "instruments" | "certificates" | "reports" | "users";
  isOpen?: boolean;
  onClose?: () => void;
}

export function MinistrySidebar({ activeItem = "dashboard", isOpen = false, onClose }: MinistrySidebarProps) {
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

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#0D1B2A] text-slate-100 flex flex-col justify-between border-r border-[#1B2A3D] transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E2E42]">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#7B0D1E] border border-red-400/30 flex items-center justify-center text-red-200 shadow-xs">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  e-Tarazu
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {t("roles.admin")}
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-4 space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 py-1.5">{t("nav.overview")}</p>

            <Link href="/admin/dashboard" className={navItemClass(isNavActive("dashboard", "/admin/dashboard"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>{t("nav.dashboard")}</span>
            </Link>

            <Link href="/admin/applications" className={navItemClass(isNavActive("applications", "/admin/applications"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{t("nav.allApplications")}</span>
            </Link>

            <Link href="/admin/instruments" className={navItemClass(isNavActive("instruments", "/admin/instruments"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span>{t("nav.instruments")}</span>
            </Link>

            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 py-1.5 mt-3">{t("nav.compliance")}</p>

            <Link href="/admin/certificates" className={navItemClass(isNavActive("certificates", "/admin/certificates"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>{t("nav.certificatesIssued")}</span>
            </Link>

            <Link href="/admin/reports" className={navItemClass(isNavActive("reports", "/admin/reports"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>{t("nav.reports")}</span>
            </Link>

            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-3 py-1.5 mt-3">{t("nav.administration")}</p>

            <Link href="/admin/users" className={navItemClass(isNavActive("users", "/admin/users"))}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{t("nav.users")}</span>
            </Link>
          </nav>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[#1E2E42] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#7B0D1E] text-white font-bold text-xs flex items-center justify-center shrink-0">
              MA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Ministry Admin</p>
              <p className="text-[10px] text-slate-400 truncate">Dept. of Consumer Affairs</p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition-colors"
          >
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
