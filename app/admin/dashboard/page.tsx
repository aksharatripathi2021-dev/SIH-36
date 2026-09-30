"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { dashboardService } from "@/services/dashboardService";
import { MinistryDashboardMetrics } from "@/types";
import { useTranslation } from "@/i18n";

// ─── Inline SVG bar chart (no external lib) ─────────────────────────────────
function MiniBarChart({ data }: { data: { month: string; count: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-2 h-28 w-full px-1">
      {data.map((d) => {
        const pct = Math.round((d.count / maxVal) * 100);
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
              {d.count}
            </span>
            <div className="w-full rounded-t-sm bg-[#801424]/20 relative overflow-hidden" style={{ height: "84px" }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#801424] to-[#c0374e] rounded-t-sm transition-all duration-700"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 font-medium">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ slices }: { slices: { status: string; percentage: number; color: string }[] }) {
  let cumulativePct = 0;
  const cx = 50;
  const cy = 50;
  const r = 38;
  const circumference = 2 * Math.PI * r;

  const segments = slices.map((s) => {
    const offset = (1 - cumulativePct / 100) * circumference;
    const dash = (s.percentage / 100) * circumference;
    const seg = { ...s, offset, dash };
    cumulativePct += s.percentage;
    return seg;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E293B" strokeWidth="14" />
        {segments.map((seg) => (
          <circle
            key={seg.status}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={seg.offset}
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <ul className="flex-1 space-y-1.5">
        {slices.map((s) => (
          <li key={s.status} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              {s.status}
            </span>
            <span className="font-semibold text-slate-800 shrink-0">{s.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Horizontal bar for volume by state ──────────────────────────────────────
function StateVolumeBar({ data }: { data: { state: string; volume: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.volume));
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = Math.round((d.volume / maxVal) * 100);
        return (
          <li key={d.state} className="flex items-center gap-3 text-xs">
            <span className="w-24 text-slate-600 shrink-0">{d.state}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#0D1B2A] to-[#1E3A5F] rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right font-semibold text-slate-700 shrink-0">{d.volume}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Activity type icons/colours ─────────────────────────────────────────────
const activityStyles: Record<string, { bg: string; icon: string; text: string }> = {
  result_submitted:        { bg: "bg-blue-50", icon: "📋", text: "text-blue-700" },
  certificate_generated:   { bg: "bg-emerald-50", icon: "✅", text: "text-emerald-700" },
  reverification_requested: { bg: "bg-amber-50", icon: "🔄", text: "text-amber-700" },
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  delta?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 shadow-xs hover:shadow-sm transition-shadow`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {delta && (
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MinistryDashboardPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<MinistryDashboardMetrics | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getMinistryMetrics().then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading Ministry Dashboard…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex">
      <MinistrySidebar activeItem="dashboard" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.dashboard")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/admin/dashboard" }]}
          avatarInitials="MA"
          notificationCount={5}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">

          {/* System status bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-800">{metrics.systemStatus}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Last synced: <strong className="text-slate-700">{metrics.lastSynced}</strong></span>
              <span className="hidden sm:inline text-slate-200">|</span>
              <Link href="/verify-certificate" className="text-[#801424] font-semibold hover:underline">
                Public Certificate Portal ↗
              </Link>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Registered Instruments"
              value={metrics.registeredInstruments}
              delta="+12 this month"
              accent="bg-[#0D1B2A]/10 text-[#0D1B2A]"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              }
            />
            <KpiCard
              label="Active Applications"
              value={metrics.activeApplications}
              delta="In pipeline"
              accent="bg-blue-50 text-blue-700"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <KpiCard
              label="Valid Certificates"
              value={metrics.validCertificates}
              delta="In public registry"
              accent="bg-emerald-50 text-emerald-700"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
            />
            <KpiCard
              label="Expiring in 30 Days"
              value={metrics.expiringIn30Days}
              accent="bg-amber-50 text-amber-700"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </section>

          {/* Row 2: Trend + Donut */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Monthly trend bar chart */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Applications Over Time</h2>
                  <p className="text-xs text-slate-500">Monthly submitted applications — Jan–Jun 2025</p>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                  Jan–Jun 2025
                </span>
              </div>
              <MiniBarChart data={metrics.applicationsOverTime} />
            </div>

            {/* Status distribution donut */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800">Status Distribution</h2>
                <p className="text-xs text-slate-500">% share across active applications</p>
              </div>
              <DonutChart slices={metrics.applicationsByStatus} />
            </div>
          </section>

          {/* Row 3: State volume + Activity */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Volume by state */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-slate-800">Volume by State / Zone</h2>
                <p className="text-xs text-slate-500">Top 5 states by application count</p>
              </div>
              <StateVolumeBar data={metrics.volumeByState} />
            </div>

            {/* Live activity feed */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Live Activity Feed</h2>
                  <p className="text-xs text-slate-500">Real-time system events</p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <ul className="space-y-3">
                {metrics.liveActivity.map((act) => {
                  const style = activityStyles[act.type] ?? activityStyles["certificate_generated"];
                  return (
                    <li key={act.id} className={`flex items-start gap-3 p-3 rounded-lg ${style.bg}`}>
                      <span className="text-base shrink-0 mt-0.5">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${style.text} leading-snug`}>{act.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{act.timestamp}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  className="text-xs text-[#801424] font-semibold hover:underline cursor-pointer"
                >
                  View all activity →
                </button>
              </div>
            </div>
          </section>

          {/* Quick Access Links */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "All Applications", href: "/admin/applications", emoji: "📋" },
                { label: "Certificates Registry", href: "/verify-certificate", emoji: "🏅" },
                { label: "LMO View", href: "/lmo/dashboard", emoji: "🗺️" },
                { label: "GATC Lab", href: "/gatc/dashboard", emoji: "🔬" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-[#801424]/40 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl">{link.emoji}</span>
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#801424] transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
