"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "../../src/services/authService";
import { UserProfile } from "../../src/types";
import { useTranslation } from "@/i18n";

interface OwnerSidebarProps {
  activeItem?: "dashboard" | "instruments" | "applications" | "certificates" | "re-verification" | "notifications" | "profile";
  isOpen?: boolean;
  onClose?: () => void;
}

export function OwnerSidebar({ activeItem = "dashboard", isOpen = false, onClose }: OwnerSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    authService.getCurrentUser().then((user) => {
      if (mounted && user) {
        setCurrentUser(user);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isNavActive = (key: string, href: string) => {
    if (activeItem === key) return true;
    if (pathname === href) return true;
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
            <Link href="/owner/dashboard" className="flex items-center gap-3">
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
                  {t("roles.owner")}
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
                  href="/owner/dashboard"
                  onClick={onClose}
                  className={navItemClass(isNavActive("dashboard", "/owner/dashboard"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span>{t("nav.dashboard")}</span>
                </Link>

                <Link
                  href="/owner/instruments"
                  onClick={onClose}
                  className={navItemClass(isNavActive("instruments", "/owner/instruments"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span>{t("nav.myInstruments")}</span>
                </Link>

                <Link
                  href="/owner/applications"
                  onClick={onClose}
                  className={navItemClass(isNavActive("applications", "/owner/applications"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{t("nav.applications")}</span>
                </Link>
              </div>
            </div>

            {/* 2. VERIFICATION */}
            <div>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {t("nav.verification")}
              </p>
              <div className="space-y-1">
                <Link
                  href="/owner/certificates"
                  onClick={onClose}
                  className={navItemClass(isNavActive("certificates", "/owner/certificates"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>{t("nav.certificates")}</span>
                </Link>

                <Link
                  href="/owner/re-verify"
                  onClick={onClose}
                  className={navItemClass(isNavActive("re-verification", "/owner/re-verify"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t("nav.reVerification")}</span>
                </Link>
              </div>
            </div>

            {/* 3. ACCOUNT */}
            <div>
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {t("nav.account")}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-2 rounded-md text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-[#162334] cursor-pointer">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>{t("nav.notifications")}</span>
                  </div>
                  <span className="w-4 h-4 bg-[#801424] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    3
                  </span>
                </div>

                <Link
                  href="/owner/profile"
                  onClick={onClose}
                  className={navItemClass(isNavActive("profile", "/owner/profile"))}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{t("nav.profile")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Info Card */}
        <div className="p-3 border-t border-[#1E2E42]">
          <Link
            href="/owner/profile"
            className="flex items-center justify-between p-2 rounded-md bg-[#132235] hover:bg-[#1A2D44] transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#1A365D] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {currentUser?.avatarInitials || "RK"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">
                  {currentUser?.name || "Rajesh Kumar"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {currentUser?.email || "owner@bharatmart.com"}
                </span>
              </div>
            </div>
            <span className="text-slate-400 hover:text-white p-1" title="Account settings">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
