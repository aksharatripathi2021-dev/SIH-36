"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardService } from "@/services/dashboardService";
import { instrumentService } from "@/services/instrumentService";
import { applicationService } from "@/services/applicationService";
import { authService } from "@/services/authService";
import { StatusBadge } from "@/app/components/StatusBadge";
import { OwnerDashboardMetrics, Instrument, Application, UserProfile } from "@/types";

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function MobileBottomNav({ active }: { active: "home" | "instruments" | "applications" | "profile" }) {
  const navItems = [
    { key: "home", label: "Home", href: "/owner/mobile", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { key: "instruments", label: "Instruments", href: "/owner/dashboard", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    )},
    { key: "applications", label: "Applications", href: "/owner/applications/LM-2026-00124", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { key: "profile", label: "Profile", href: "/owner/profile", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              isActive ? "text-[#801424] bg-[#801424]/8" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {item.icon}
            <span className={`text-[9px] font-semibold ${isActive ? "text-[#801424]" : ""}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Verified: "bg-emerald-500",
    Pending: "bg-amber-400",
    Expiring: "bg-orange-500",
    Expired: "bg-rose-600",
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[status] ?? "bg-slate-300"}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MobileOwnerDashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<OwnerDashboardMetrics | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [recentApp, setRecentApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then(async (user) => {
      let active = user;
      if (!active || active.role !== "OWNER") {
        const ownerUser = await authService.getUserByRole("OWNER");
        if (ownerUser) active = ownerUser;
      }
      setCurrentUser(active);
      const ownerId = active?.id || "user-owner-demo";
      const [m, instr, app] = await Promise.all([
        dashboardService.getOwnerMetrics(ownerId),
        instrumentService.getInstrumentsByOwner(ownerId),
        applicationService.getApplicationById("LM-2026-00124"),
      ]);
      setMetrics(m);
      setInstruments(instr);
      setRecentApp(app);
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-20">
      {/* Mobile App Bar */}
      <header className="bg-[#0D1B2A] text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400">Welcome back,</p>
            <h1 className="text-lg font-bold leading-tight">{currentUser?.organization || "Supermarket"}</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#801424] text-white font-bold text-sm flex items-center justify-center shadow-sm">
            {currentUser?.avatarInitials || "AR"}
          </div>
        </div>

        {/* 2×2 KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Instruments", value: metrics.totalInstruments, color: "bg-white/10" },
            { label: "Verified", value: metrics.verifiedCount, color: "bg-emerald-600/80" },
            { label: "Pending", value: metrics.pendingCount, color: "bg-amber-500/80" },
            { label: "Expiring Soon", value: metrics.expiringCount, color: "bg-rose-600/80" },
          ].map((kpi) => (
            <div key={kpi.label} className={`${kpi.color} rounded-xl p-3.5 text-white`}>
              <div className="text-2xl font-extrabold tabular-nums">{kpi.value}</div>
              <div className="text-[10px] font-medium text-white/80 mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">

        {/* Expiry alert banner */}
        {metrics.alertMessage && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-amber-500 text-base mt-0.5 shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-800">{metrics.alertMessage}</p>
              <Link
                href={`/owner/re-verify/${metrics.alertInstrumentId}`}
                className="text-[11px] text-amber-700 font-bold underline mt-0.5 inline-block"
              >
                Apply for re-verification →
              </Link>
            </div>
          </div>
        )}

        {/* Instruments list */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-slate-800">My Instruments</h2>
            <Link href="/owner/dashboard" className="text-[11px] text-[#801424] font-semibold">View all</Link>
          </div>
          <div className="space-y-2.5">
            {instruments.map((instr) => (
              <div
                key={instr.id}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-xs"
              >
                <StatusDot status={instr.currentStatus} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{instr.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{instr.category} · Expires {instr.certificateExpiryDate}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  instr.currentStatus === "Verified" ? "bg-emerald-50 text-emerald-700" :
                  instr.currentStatus === "Expiring" ? "bg-orange-50 text-orange-700" :
                  instr.currentStatus === "Expired" ? "bg-rose-50 text-rose-700" :
                  "bg-amber-50 text-amber-700"
                }`}>
                  {instr.currentStatus}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent application */}
        {recentApp && (
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-sm font-bold text-slate-800">Recent Application</h2>
              <Link href={`/owner/applications/${recentApp.id}`} className="text-[11px] text-[#801424] font-semibold">
                Track →
              </Link>
            </div>
            <Link
              href={`/owner/applications/${recentApp.id}`}
              className="block bg-white border border-slate-200 rounded-xl px-4 py-4 shadow-xs hover:border-[#801424]/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">{recentApp.id}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{recentApp.instrumentName}</p>
                </div>
                <StatusBadge status={recentApp.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>Submitted: {recentApp.submittedDate}</span>
                <span>Updated: {recentApp.lastUpdated}</span>
              </div>
              {/* Mini timeline */}
              <div className="mt-3 flex items-center gap-1">
                {recentApp.timeline.slice(0, 6).map((step, i) => (
                  <React.Fragment key={step.stepNumber}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                      step.isCompleted
                        ? "bg-emerald-500 text-white"
                        : step.isCurrent
                        ? "bg-[#801424] text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {step.isCompleted ? "✓" : step.stepNumber}
                    </div>
                    {i < 5 && (
                      <div className={`flex-1 h-0.5 rounded-full ${step.isCompleted ? "bg-emerald-500" : "bg-slate-100"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </Link>
          </section>
        )}

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-bold text-slate-800 mb-2.5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Apply Re-verification", href: "/owner/re-verify/W-104", emoji: "📋", primary: true },
              { label: "Track Application", href: "/owner/applications/APP-26036-0148", emoji: "📍", primary: false },
              { label: "Verify Certificate", href: "/verify-certificate?id=CERT-2025-00981", emoji: "🏅", primary: false },
              { label: "Full Dashboard", href: "/owner/dashboard", emoji: "🖥️", primary: false },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all ${
                  action.primary
                    ? "bg-[#801424] border-[#801424] text-white hover:bg-[#6b1020]"
                    : "bg-white border-slate-200 text-slate-700 hover:border-[#801424]/30 hover:shadow-sm"
                }`}
              >
                <span className="text-xl">{action.emoji}</span>
                <span className={`text-[11px] font-semibold leading-tight ${action.primary ? "text-white" : "text-slate-700"}`}>
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav active="home" />
    </div>
  );
}
