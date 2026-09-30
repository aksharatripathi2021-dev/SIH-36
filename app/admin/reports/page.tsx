"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { dashboardService } from "@/services/dashboardService";
import { MinistryDashboardMetrics } from "@/types";
import { useTranslation } from "@/i18n";

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<MinistryDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getMinistryMetrics().then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <MinistrySidebar
        activeItem="reports"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.reports")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/admin/dashboard" },
            { label: t("nav.reports") }
          ]}
          avatarInitials="MA"
          notificationCount={5}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Compliance &amp; Operational Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              National performance indicators, state-wise compliance rates, and inspection SLA metrics.
            </p>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">National Registry</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.registeredInstruments}</div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Active Commercial Devices</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Verification Backlog</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.activeApplications}</div>
                <span className="text-[11px] text-blue-600 font-semibold mt-1 block">In Progress</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Valid Certificates</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.validCertificates}</div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Compliance Rate 94.2%</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Expiring (30 Days)</span>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.expiringIn30Days}</div>
                <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Requires Renewal Notice</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">State Inspection SLA Performance</h3>
              <p className="text-xs text-slate-500">Average turnaround time from application to certificate issuance</p>
              <div className="space-y-3 pt-2 text-xs">
                {[
                  { state: "Delhi South Zone", days: "3.2 days", sla: "Within SLA", color: "text-emerald-700 bg-emerald-50" },
                  { state: "Delhi North Zone", days: "4.1 days", sla: "Within SLA", color: "text-emerald-700 bg-emerald-50" },
                  { state: "Delhi Central Zone", days: "5.8 days", sla: "Target Exceeded", color: "text-amber-700 bg-amber-50" },
                  { state: "Maharashtra State", days: "3.6 days", sla: "Within SLA", color: "text-emerald-700 bg-emerald-50" },
                  { state: "Karnataka State", days: "4.0 days", sla: "Within SLA", color: "text-emerald-700 bg-emerald-50" }
                ].map((item) => (
                  <div key={item.state} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{item.state}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-mono">{item.days}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.color}`}>{item.sla}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Statutory Metrology Standards</h3>
              <p className="text-xs text-slate-500">Standards reference distribution across active testing centers</p>
              <div className="space-y-3 pt-2 text-xs">
                {[
                  { code: "OIML R76-1", name: "Non-automatic weighing instruments", share: "72%" },
                  { code: "OIML R51", name: "Automatic catchweighing instruments", share: "14%" },
                  { code: "OIML R35", name: "Material measures of length (tapes)", share: "9%" },
                  { code: "OIML R111", name: "Weights of classes E1, E2, F1, F2, M1", share: "5%" }
                ].map((std) => (
                  <div key={std.code} className="flex items-center justify-between pb-2 border-b border-slate-100 last:border-0">
                    <div>
                      <span className="font-bold text-slate-900 block">{std.code}</span>
                      <span className="text-[11px] text-slate-500">{std.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 text-sm font-mono">{std.share}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
