"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { dashboardService } from "@/services/dashboardService";
import { applicationService } from "@/services/applicationService";
import { certificateService } from "@/services/certificateService";
import { pdfService } from "@/services/pdfService";
import { Application, OwnerDashboardMetrics } from "@/types";
import { useTranslation } from "@/i18n";

export default function OwnerDashboardPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<OwnerDashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [alertDismissed, setAlertDismissed] = useState(false);

  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [statusFilter, searchQuery]);

  const loadDashboardData = async () => {
    const user = await (await import("@/services/authService")).authService.getCurrentUser();
    setActiveUser(user);

    const m = await dashboardService.getOwnerMetrics(user.id);
    setMetrics(m);

    const apps = await applicationService.getApplications({
      ownerId: user.id,
      status: statusFilter !== "All statuses" ? statusFilter : undefined,
      search: searchQuery || undefined
    });
    setApplications(apps);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Sidebar */}
      <OwnerSidebar
        activeItem="dashboard"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.dashboard")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/owner/dashboard" }]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Welcome & Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t("dashboard.welcome")}, {activeUser?.name?.split(" ")[0] || "Trader"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {activeUser?.organization ? `${activeUser.organization} · ` : ""}Overview of your legal metrology compliance, active instruments, and pending inspections.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => alert("Add instrument form will open.")}
                className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span>
                <span>Add instrument</span>
              </button>

              <Link
                href="/owner/re-verify/W-104"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-300 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Apply for verification</span>
              </Link>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t("dashboard.totalInstruments")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.totalInstruments : 4}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t("dashboard.verifiedInstruments")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.verifiedCount : 2}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t("status.pending")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.pendingCount : 1}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t("dashboard.expiringSoon")}</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.expiringCount : 1}
              </p>
            </div>
          </div>

          {/* Warning Alert Banner (W-104 Expiry) */}
          {!alertDismissed && metrics?.alertMessage && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="text-amber-600 text-lg">⚠️</span>
                <span className="text-xs sm:text-sm font-medium text-amber-900">
                  {metrics.alertMessage}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/owner/re-verify/W-104"
                  className="px-3.5 py-1.5 bg-white hover:bg-amber-100/50 text-amber-900 text-xs font-semibold rounded border border-amber-300 shadow-2xs transition-colors"
                >
                  Start re-verification
                </Link>
                <button
                  type="button"
                  onClick={() => setAlertDismissed(true)}
                  className="text-xs text-amber-800 hover:text-amber-950 font-medium cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Verification Applications Section */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t("nav.applications")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("dashboard.recentApplications")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("All statuses");
                  setSearchQuery("");
                }}
                className="text-xs font-medium text-[#801424] hover:underline self-start sm:self-auto cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search applications"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
                />
              </div>

              <div className="w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
                >
                  <option value="All statuses">All statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Verification In Progress">Verification In Progress</option>
                  <option value="Result Submitted">Result Submitted</option>
                  <option value="Needs Correction">Needs Correction</option>
                  <option value="Certificate Generated">Certificate Generated</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">APPLICATION</th>
                    <th className="py-2.5 px-4">INSTRUMENT</th>
                    <th className="py-2.5 px-4">STATUS</th>
                    <th className="py-2.5 px-4">LAST UPDATED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <Link
                            href={`/owner/applications/${app.id}`}
                            className="text-[#801424] hover:underline flex items-center gap-1.5"
                          >
                            <span>{app.id}</span>
                            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform text-[10px]">
                              →
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{app.instrumentName}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-500">{app.lastUpdated}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                        No applications found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => alert("Add instrument form")}
                className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-slate-400 text-base">+</span>
                <span>Add instrument</span>
              </button>

              <Link
                href="/owner/applications/APP-26036-0148"
                className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-slate-400">📋</span>
                <span>Track application</span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  const cert = await certificateService.getCertificateById("CERT-2025-00981");
                  if (cert) {
                    await pdfService.downloadCertificate(cert);
                  } else {
                    window.location.href = "/owner/certificates";
                  }
                }}
                className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-slate-400">📥</span>
                <span>{t("certificate.downloadPrintable")}</span>
              </button>

              <Link
                href="/verify-certificate?id=CERT-2025-00981"
                className="p-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 text-left shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="text-slate-400">🛡️</span>
                <span>Verify a certificate</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
