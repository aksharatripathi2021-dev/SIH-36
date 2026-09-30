"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { GatcSidebar } from "@/app/components/GatcSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { storageService } from "@/services/storageService";
import { VerificationObservation } from "@/types";
import { useTranslation } from "@/i18n";

export default function GatcResultsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [results, setResults] = useState<VerificationObservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list = storageService.getVerificationResults();
    setResults(list);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <GatcSidebar
        activeItem="results"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.testResults")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/gatc/dashboard" },
            { label: t("nav.testResults") }
          ]}
          avatarInitials="GL"
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laboratory Calibration &amp; Test Results
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Certified experimental observations recorded according to national OIML legal metrology standards.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Application ID</th>
                    <th className="py-2.5 px-4">Standard</th>
                    <th className="py-2.5 px-4">Reference Weights</th>
                    <th className="py-2.5 px-4">Zero Error</th>
                    <th className="py-2.5 px-4">Repeatability</th>
                    <th className="py-2.5 px-4">Eccentricity</th>
                    <th className="py-2.5 px-4">Condition</th>
                    <th className="py-2.5 px-4">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                        Loading results…
                      </td>
                    </tr>
                  ) : results.length > 0 ? (
                    results.map((r) => (
                      <tr key={r.applicationId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{r.applicationId}</td>
                        <td className="py-3 px-4 font-mono text-slate-700">{r.testStandard}</td>
                        <td className="py-3 px-4 text-slate-600">{r.referenceWeights}</td>
                        <td className="py-3 px-4 font-mono text-slate-800">{r.zeroError}</td>
                        <td className="py-3 px-4 font-mono text-slate-800">{r.repeatabilityError}</td>
                        <td className="py-3 px-4 font-mono text-slate-800">{r.eccentricityError}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {r.condition}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.overallResult} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                        No test results recorded yet.
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
