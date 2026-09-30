"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { LegacyReceiptAssistant } from "@/app/components/LegacyReceiptAssistant";
import { applicationService } from "@/services/applicationService";
import { authService } from "@/services/authService";
import { Application, Instrument, UserProfile } from "@/types";
import { storageService } from "@/services/storageService";
import { useTranslation } from "@/i18n";

export default function OwnerApplicationsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [loading, setLoading] = useState(true);
  const [showReceiptAssistant, setShowReceiptAssistant] = useState(false);

  useEffect(() => {
    loadApplications();
    const unsubscribe = storageService.subscribeToDemoUpdates(() => {
      loadApplications();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [statusFilter, searchQuery]);

  const loadApplications = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    const list = await applicationService.getApplications({
      ownerId: user.id,
      status: statusFilter !== "All statuses" ? statusFilter : undefined,
      search: searchQuery || undefined
    });
    setApplications(list);
    setLoading(false);
  };

  const handleReceiptApply = (
    extracted: Record<string, string>,
    matchedInst?: Instrument | null
  ) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "pending_receipt_extraction",
        JSON.stringify({
          values: extracted,
          matchedInstrumentId: matchedInst?.id
        })
      );
    }
    if (matchedInst) {
      router.push(`/owner/re-verify/${matchedInst.id}?assisted=true`);
    } else {
      router.push("/owner/re-verify/W-104?assisted=true");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <OwnerSidebar
        activeItem="applications"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.applications")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/owner/dashboard" },
            { label: t("nav.applications") }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Verification Applications
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Monitor status and progress across all your submitted verification cases.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowReceiptAssistant(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>⚡</span>
                <span>{t("receipt.assistantTitle")}</span>
              </button>

              <Link
                href="/owner/re-verify"
                className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <span>+</span>
                <span>New Re-verification</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            {/* Filter Bar */}
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
                  placeholder="Search application ID or instrument"
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
              </div>

              <span className="text-xs text-slate-400 ml-auto">
                Showing {applications.length} application{applications.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Application ID</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Last Updated</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
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
                        <td className="py-3 px-4 text-slate-500">{app.lastUpdated}</td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/owner/applications/${app.id}`}
                            className="text-[#801424] font-semibold hover:underline"
                          >
                            Track →
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        No applications found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Legacy Receipt Assistant */}
      <LegacyReceiptAssistant
        isOpen={showReceiptAssistant}
        onClose={() => setShowReceiptAssistant(false)}
        onApply={handleReceiptApply}
        currentUser={currentUser}
        mode="trader-entry"
      />
    </div>
  );
}
