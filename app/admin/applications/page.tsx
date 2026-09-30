"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { applicationService } from "@/services/applicationService";
import { Application } from "@/types";
import { useTranslation } from "@/i18n";

export default function AdminApplicationsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [zoneFilter, setZoneFilter] = useState("All zones");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, [statusFilter, zoneFilter, searchQuery]);

  const loadApplications = async () => {
    const list = await applicationService.getApplications({
      status: statusFilter !== "All statuses" ? statusFilter : undefined,
      zone: zoneFilter !== "All zones" ? zoneFilter : undefined,
      search: searchQuery || undefined
    });
    setApplications(list);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <MinistrySidebar
        activeItem="applications"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.allApplications")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/admin/dashboard" },
            { label: t("nav.allApplications") }
          ]}
          avatarInitials="MA"
          notificationCount={5}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                National Applications Registry
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Centralized oversight across all state jurisdictions and verification stages.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search application ID, instrument, or owner"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 cursor-pointer"
              >
                <option value="All statuses">All statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Verification In Progress">Verification In Progress</option>
                <option value="Result Submitted">Result Submitted</option>
                <option value="Needs Correction">Needs Correction</option>
                <option value="Certificate Generated">Certificate Generated</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 cursor-pointer"
              >
                <option value="All zones">All zones</option>
                <option value="Delhi South Zone">Delhi South Zone</option>
                <option value="Delhi North Zone">Delhi North Zone</option>
                <option value="Delhi Central Zone">Delhi Central Zone</option>
              </select>

              <span className="text-xs text-slate-400 ml-auto">
                Showing {applications.length} record{applications.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Application ID</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Owner / Trader</th>
                    <th className="py-2.5 px-4">Zone</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Submitted Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                        Loading applications…
                      </td>
                    </tr>
                  ) : applications.length > 0 ? (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          <Link
                            href={`/owner/applications/${app.id}`}
                            className="text-[#801424] hover:underline"
                          >
                            {app.id}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{app.instrumentName}</td>
                        <td className="py-3 px-4 text-slate-600">{app.ownerName}</td>
                        <td className="py-3 px-4 text-slate-600">{app.zone}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.priority === "High"
                                ? "bg-rose-50 text-[#801424] border border-rose-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {app.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{app.submittedDate}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/owner/applications/${app.id}`}
                            className="text-[#801424] font-semibold hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                        No applications found.
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
