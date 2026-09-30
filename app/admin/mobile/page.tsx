"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardService } from "@/services/dashboardService";
import { applicationService } from "@/services/applicationService";
import { StatusBadge } from "@/app/components/StatusBadge";
import { MinistryDashboardMetrics, Application } from "@/types";

// ─── Mobile Bottom Nav (Admin) ────────────────────────────────────────────────
function AdminMobileNav({ active }: { active: "overview" | "applications" | "reports" | "settings" }) {
  const items = [
    { key: "overview", label: "Overview", href: "/admin/mobile", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )},
    { key: "applications", label: "Applications", href: "/admin/dashboard", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { key: "reports", label: "Reports", href: "/admin/dashboard", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { key: "settings", label: "Settings", href: "/login", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 z-50 flex items-center justify-around shadow-lg">
      {items.map((item) => {
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

// ─── Mini horizontal bar ──────────────────────────────────────────────────────
function MiniBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-slate-500 text-[11px] truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-6 text-right text-[11px] font-semibold text-slate-600 shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MobileAdminOverview() {
  const [metrics, setMetrics] = useState<MinistryDashboardMetrics | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getMinistryMetrics(),
      applicationService.getApplications({}),
    ]).then(([m, apps]) => {
      setMetrics(m);
      setRecentApps(apps.slice(0, 4));
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
      <header className="bg-gradient-to-b from-[#0D1B2A] to-[#1A2D45] text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-slate-400">Ministry Admin</p>
            <h1 className="text-lg font-bold leading-tight">National Overview</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#801424] text-white text-[9px] font-bold rounded-full flex items-center justify-center">5</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#801424] text-white font-bold text-sm flex items-center justify-center">MA</div>
          </div>
        </div>

        {/* 2×2 KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3.5">
            <div className="text-2xl font-extrabold tabular-nums">{metrics.registeredInstruments.toLocaleString()}</div>
            <div className="text-[10px] font-medium text-white/70 mt-0.5">Registered Instruments</div>
          </div>
          <div className="bg-blue-600/80 rounded-xl p-3.5">
            <div className="text-2xl font-extrabold tabular-nums">{metrics.activeApplications.toLocaleString()}</div>
            <div className="text-[10px] font-medium text-white/80 mt-0.5">Active Applications</div>
          </div>
          <div className="bg-emerald-600/80 rounded-xl p-3.5">
            <div className="text-2xl font-extrabold tabular-nums">{metrics.validCertificates.toLocaleString()}</div>
            <div className="text-[10px] font-medium text-white/80 mt-0.5">Valid Certificates</div>
          </div>
          <div className="bg-amber-600/80 rounded-xl p-3.5">
            <div className="text-2xl font-extrabold tabular-nums">{metrics.expiringIn30Days}</div>
            <div className="text-[10px] font-medium text-white/80 mt-0.5">Expiring in 30 Days</div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">

        {/* System status strip */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">{metrics.systemStatus}</span>
          </div>
          <span className="text-[10px] text-slate-400">Last sync: {metrics.lastSynced}</span>
        </div>

        {/* Status Distribution */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Status Distribution</h2>
          <div className="space-y-2.5">
            {metrics.applicationsByStatus.map((s) => (
              <MiniBar key={s.status} label={s.status} pct={s.percentage} color={s.color} />
            ))}
          </div>
        </section>

        {/* Volume by State */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Top States by Volume</h2>
          <div className="space-y-2.5">
            {metrics.volumeByState.map((s) => {
              const max = Math.max(...metrics.volumeByState.map((v) => v.volume));
              return (
                <MiniBar key={s.state} label={s.state} pct={Math.round((s.volume / max) * 100)} color="#0D1B2A" />
              );
            })}
          </div>
        </section>

        {/* Live Activity */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Live Activity</h2>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <ul className="divide-y divide-slate-100">
            {metrics.liveActivity.map((act) => (
              <li key={act.id} className="py-2.5 flex items-start gap-2.5">
                <span className="text-base shrink-0">
                  {act.type === "certificate_generated" ? "✅" : act.type === "result_submitted" ? "📋" : "🔄"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">{act.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent Applications */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-slate-800">Recent Applications</h2>
            <Link href="/admin/dashboard" className="text-[11px] text-[#801424] font-semibold">View all</Link>
          </div>
          <div className="space-y-2">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                href={`/owner/applications/${app.id}`}
                className="block bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs hover:border-[#801424]/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 font-mono truncate">{app.id}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{app.instrumentName} · {app.ownerName}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-sm font-bold text-slate-800 mb-2.5">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Full Dashboard", href: "/admin/dashboard", emoji: "🖥️" },
              { label: "Certificate Portal", href: "/verify-certificate", emoji: "🏅" },
              { label: "LMO View", href: "/lmo/dashboard", emoji: "🗺️" },
              { label: "GATC Lab", href: "/gatc/dashboard", emoji: "🔬" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-[#801424]/30 hover:shadow-sm transition-all text-center"
              >
                <span className="text-2xl">{link.emoji}</span>
                <span className="text-[11px] font-semibold text-slate-700">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <AdminMobileNav active="overview" />
    </div>
  );
}
