"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { LmoSidebar } from "@/app/components/LmoSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { dashboardService } from "@/services/dashboardService";
import { applicationService } from "@/services/applicationService";
import { Application, LmoDashboardMetrics } from "@/types";
import { useTranslation } from "@/i18n";

export default function LmoDashboardPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<LmoDashboardMetrics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [zoneFilter, setZoneFilter] = useState("All zones");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadLmoData();
  }, [statusFilter, zoneFilter, searchQuery]);

  const loadLmoData = async () => {
    const m = await dashboardService.getLmoMetrics("user-lmo-1");
    setMetrics(m);

    const apps = await applicationService.getApplications({
      officerId: "user-lmo-1",
      status: statusFilter !== "All statuses" ? statusFilter : undefined,
      zone: zoneFilter !== "All zones" ? zoneFilter : undefined,
      search: searchQuery || undefined
    });
    setApplications(apps);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Sidebar */}
      <LmoSidebar
        activeItem="dashboard"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.dashboard")}
          breadcrumbs={[{ label: t("nav.dashboard"), href: "/lmo/dashboard" }]}
          searchPlaceholder="Search application ID or owner"
          avatarInitials="PS"
          userName="Priya Sharma"
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Metadata Topline */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span>Last synced: 12 Jun 2025, 09:42 IST</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-700 shadow-2xs self-start sm:self-auto">
              <span className="text-slate-400">📍</span>
              <span>Delhi South Zone</span>
            </div>
          </div>

          {/* Welcome Heading */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good morning, Priya
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Here is your operational overview for today.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                PENDING REVIEW
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.pendingReviewCount : 12}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SCHEDULED TODAY
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.scheduledTodayCount : 5}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                VERIFICATION IN PROGRESS
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.verificationInProgressCount : 3}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 shadow-2xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                COMPLETED THIS MONTH
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
                {metrics ? metrics.completedThisMonthCount : 28}
              </p>
            </div>
          </div>

          {/* Middle Row: Urgent Queue & Today's Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Urgent Queue Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Urgent queue</h3>
                  <p className="text-xs text-slate-500">Requires your attention</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-[#801424] border border-rose-200">
                  High
                </span>
              </div>

              {/* Case Box: APP-26036-0148 */}
              <Link
                href="/lmo/applications/APP-26036-0148/verify"
                className="block p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-[#801424] transition-colors">
                      APP-26036-0148
                    </span>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Bharat Mart Pvt Ltd
                    </p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">
                      Platform Weighing Scale W-104
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {applications.find((a) => a.id === "APP-26036-0148")?.status || "Verification In Progress"} · Updated 12 Jun 2025
                    </p>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-1 transition-all text-sm font-bold">
                    &gt;
                  </span>
                </div>
              </Link>
            </div>

            {/* Today's Schedule Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s schedule</h3>
                <p className="text-xs text-slate-500">Three upcoming field visits</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <Link
                  href="/lmo/applications/APP-26036-0148/verify"
                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-900">10:00</span>
                  <span className="text-slate-700 font-medium">Bharat Mart</span>
                  <span className="text-[11px] text-slate-400 font-mono">APP-26036-0148</span>
                </Link>

                <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-900">13:30</span>
                  <span className="text-slate-700 font-medium">FreshKart Retail</span>
                  <span className="text-[11px] text-slate-400 font-mono">APP-26036-0142</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-slate-900">16:00</span>
                  <span className="text-slate-700 font-medium">Mahadev Traders</span>
                  <span className="text-[11px] text-slate-400 font-mono">APP-26036-0139</span>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row: Weekly Workload Chart & Queue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weekly Workload Bar Chart */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly workload</h3>
                <p className="text-xs text-slate-500">Applications handled this week</p>
              </div>

              {/* Styled CSS Bar Chart */}
              <div className="h-36 pt-4 flex items-end justify-between gap-2 px-2 border-b border-slate-100">
                {[
                  { day: "Mon", count: 4, height: "45%" },
                  { day: "Tue", count: 6, height: "65%" },
                  { day: "Wed", count: 5, height: "55%" },
                  { day: "Thu", count: 8, height: "85%" },
                  { day: "Fri", count: 7, height: "75%" },
                  { day: "Sat", count: 9, height: "95%" },
                  { day: "Sun", count: 6, height: "65%" },
                ].map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.count}
                    </span>
                    <div
                      style={{ height: item.height }}
                      className="w-full max-w-[28px] bg-[#994753] hover:bg-[#801424] rounded-t transition-all cursor-pointer"
                    />
                    <span className="text-[10px] font-medium text-slate-500">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Workload Summary */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Workload summary</h3>
                <p className="text-xs text-slate-500">Current queue distribution</p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-600">Pending review</span>
                  <span className="font-bold text-slate-900">12</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-600">Scheduled today</span>
                  <span className="font-bold text-slate-900">5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">In progress</span>
                  <span className="font-bold text-slate-900">3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Pending Applications Table */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pending applications</h3>
              <p className="text-xs text-slate-500">Review and process assigned applications</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 cursor-pointer"
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
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Application ↑↓</th>
                    <th className="py-2.5 px-4">Owner ↑↓</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {applications.slice(0, 3).map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <Link
                          href={`/lmo/applications/${app.id}/verify`}
                          className="text-[#801424] hover:underline"
                        >
                          {app.id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{app.ownerName}</td>
                      <td className="py-3 px-4 text-slate-600">{app.instrumentCategory}</td>
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
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/lmo/applications/${app.id}/verify`}
                          className="text-slate-400 group-hover:text-slate-800 font-bold text-sm"
                        >
                          &gt;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Showing 1-3 of 12 applications</span>
              <div className="flex items-center gap-2">
                <button type="button" className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600">
                  &lt;
                </button>
                <span>Page 1 of 4</span>
                <button type="button" className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-600">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
