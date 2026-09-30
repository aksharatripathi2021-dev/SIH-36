"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { GatcSidebar } from "@/app/components/GatcSidebar";
import { dashboardService } from "@/services/dashboardService";
import { GatcWorkspaceMetrics } from "@/types";

export default function GatcHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<GatcWorkspaceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getGatcMetrics().then((m) => {
      setMetrics(m);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <GatcSidebar
        activeItem="history"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Testing History"
          breadcrumbs={[
            { label: "GATC Delhi Lab", href: "/gatc/dashboard" },
            { label: "Testing History" }
          ]}
          avatarInitials="GL"
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Lab Testing Archive &amp; Logs
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Historical inspection log of all verification cycles completed by GATC Delhi Testing Center.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-6 text-center text-slate-400 text-xs">Loading history…</div>
              ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.detail}</div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">{item.date}</span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">No testing history available.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
