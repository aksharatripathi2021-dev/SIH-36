"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { GatcSidebar } from "@/app/components/GatcSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { dashboardService } from "@/services/dashboardService";
import { applicationService } from "@/services/applicationService";
import { GatcWorkspaceMetrics, Application } from "@/types";
import { useTranslation } from "@/i18n";

// ─── Lab Capacity Meter ───────────────────────────────────────────────────────
function CapacityMeter({ pct, active, total }: { pct: number; active: number; total: number }) {
  const color = pct > 80 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-2xl font-extrabold text-slate-900">{pct}%</span>
        <span className="text-xs text-slate-500">
          {active} of {total} bays active
        </span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>0%</span>
        <span className={pct > 80 ? "text-rose-500 font-semibold" : "text-slate-400"}>
          {pct > 80 ? "High utilization" : pct > 60 ? "Moderate" : "Capacity available"}
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function GatcKpiCard({
  label, value, icon, accent, sub,
}: {
  label: string; value: number | string; icon: React.ReactNode; accent: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-2 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      </div>
      <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{value}</span>
      {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GatcDashboardPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<GatcWorkspaceMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getGatcMetrics(),
      applicationService.getApplications({}),
    ]).then(([m, apps]) => {
      setMetrics(m);
      // Show apps assigned to GATC lab
      setApplications(apps.filter((a) => a.assignedLab?.id === "user-gatc-1").slice(0, 6));
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading GATC Lab Workspace…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex">
      <GatcSidebar activeItem="dashboard" isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.dashboard")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/gatc/dashboard" }]}
          avatarInitials="GL"
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">

          {/* Lab header strip */}
          <div className="bg-gradient-to-r from-[#0D1B2A] to-[#164E63] rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-white">GATC Delhi Lab — Government Testing Centre</h2>
              <p className="text-xs text-cyan-200 mt-0.5">Authorized under Legal Metrology Act 2009 · Accreditation No. NABL-DL-7842</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-300 font-semibold">Lab Open</span>
            </div>
          </div>

          {/* 4 KPI cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GatcKpiCard
              label="Assigned for Testing"
              value={metrics.assignedForTesting}
              sub="Awaiting lab slot"
              accent="bg-blue-50 text-blue-700"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <GatcKpiCard
              label="In Testing"
              value={metrics.inTesting}
              sub="Active test runs"
              accent="bg-amber-50 text-amber-700"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
            <GatcKpiCard
              label="Results Submitted"
              value={metrics.resultsSubmitted}
              sub="This month"
              accent="bg-emerald-50 text-emerald-700"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <GatcKpiCard
              label="Pass Rate"
              value={`${metrics.passRatePercentage}%`}
              sub="30-day average"
              accent="bg-[#0D1B2A]/10 text-[#0D1B2A]"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </section>

          {/* Row 2: Lab Capacity + Activity Feed */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Lab capacity gauge */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-slate-800">Lab Capacity</h2>
                <p className="text-xs text-slate-500">Current bay utilization</p>
              </div>
              <CapacityMeter
                pct={metrics.labCapacity.percentage}
                active={metrics.labCapacity.activeTests}
                total={metrics.labCapacity.totalBays}
              />

              {/* Bay grid visual */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-3">Bay Status</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: metrics.labCapacity.totalBays }).map((_, i) => {
                    const isActive = i < metrics.labCapacity.activeTests;
                    return (
                      <div
                        key={i}
                        title={isActive ? `Bay ${i + 1}: In Use` : `Bay ${i + 1}: Free`}
                        className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all ${
                          isActive
                            ? "bg-cyan-600 border-cyan-500 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-300"
                        }`}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-600" />In Use</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" />Free</span>
                </div>
              </div>
            </div>

            {/* Recent test activity */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Recent Test Activity</h2>
                  <p className="text-xs text-slate-500">Latest lab events</p>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {metrics.recentActivity.map((act) => (
                  <li key={act.id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.detail}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{act.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Row 3: Assigned Applications Table */}
          <section>
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Assigned Applications</h2>
                  <p className="text-xs text-slate-500">Instruments pending or under GATC testing</p>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {applications.length} record{applications.length !== 1 ? "s" : ""}
                </span>
              </div>

              {applications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">App ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Instrument</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Owner</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Priority</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Submitted</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-mono font-semibold text-[#0D1B2A]">{app.id}</td>
                          <td className="px-4 py-3 text-slate-700">{app.instrumentName}</td>
                          <td className="px-4 py-3 text-slate-600">{app.ownerName}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={app.status} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                app.priority === "High"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : app.priority === "Normal"
                                  ? "bg-slate-50 text-slate-600 border border-slate-200"
                                  : "bg-green-50 text-green-700 border border-green-200"
                              }`}
                            >
                              {app.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{app.submittedDate}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/owner/applications/${app.id}`}
                              className="text-[#801424] font-semibold hover:underline"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* If no GATC-assigned apps in the filter, show the demo one */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">App ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Instrument</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Owner</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Priority</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Submitted</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-mono font-semibold text-[#0D1B2A]">APP-26036-0148</td>
                        <td className="px-4 py-3 text-slate-700">Platform Weighing Scale W-104</td>
                        <td className="px-4 py-3 text-slate-600">Bharat Mart Pvt Ltd</td>
                        <td className="px-4 py-3"><StatusBadge status="Result Submitted" /></td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">High</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">08 Jun 2025</td>
                        <td className="px-4 py-3">
                          <Link href="/owner/applications/APP-26036-0148" className="text-[#801424] font-semibold hover:underline">
                            View →
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-400">Showing GATC Delhi Lab assignments</span>
                <button
                  type="button"
                  className="text-xs text-[#801424] font-semibold hover:underline cursor-pointer"
                >
                  View all assigned →
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
