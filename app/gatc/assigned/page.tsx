"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { GatcSidebar } from "@/app/components/GatcSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { applicationService } from "@/services/applicationService";
import { Application } from "@/types";
import { useTranslation } from "@/i18n";

export default function GatcAssignedPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssigned();
  }, []);

  const loadAssigned = async () => {
    const list = await applicationService.getApplications();
    const assigned = list.filter((a) => a.assignedLab?.id === "user-gatc-1");
    setApplications(assigned.length > 0 ? assigned : list.slice(0, 3));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <GatcSidebar
        activeItem="assigned"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.assignedApplications")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/gatc/dashboard" },
            { label: t("nav.assignedApplications") }
          ]}
          avatarInitials="GL"
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Assigned Lab Calibration Queue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Instruments assigned to GATC testing bays for verification and error calibration tests.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Application ID</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Owner / Trader</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Assigned Lab Bay</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        Loading assigned queue…
                      </td>
                    </tr>
                  ) : applications.length > 0 ? (
                    applications.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{app.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{app.instrumentName}</td>
                        <td className="py-3 px-4 text-slate-600">{app.ownerName}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.priority === "High"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {app.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">Bay {idx + 1}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/gatc/results"
                            className="px-2.5 py-1 text-xs font-semibold text-[#801424] hover:bg-[#801424]/8 rounded transition-colors inline-block"
                          >
                            Enter Results →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        No assigned applications in queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
