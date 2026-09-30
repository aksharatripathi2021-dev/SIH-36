"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { certificateService } from "@/services/certificateService";
import { Certificate } from "@/types";
import { useTranslation } from "@/i18n";

export default function AdminCertificatesPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    const list = await certificateService.getAllCertificates();
    setCertificates(list);
    setLoading(false);
  };

  const filtered = certificates.filter(
    (c) =>
      c.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instrumentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.applicationId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <MinistrySidebar
        activeItem="certificates"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.certificatesIssued")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/admin/dashboard" },
            { label: t("nav.certificatesIssued") }
          ]}
          avatarInitials="MA"
          notificationCount={5}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                National Certificates Registry
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Authentic digitally signed legal metrology verification certificates.
              </p>
            </div>

            <Link
              href="/verify-certificate"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-300 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>Public Verification Portal ↗</span>
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
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
                  placeholder="Search by Certificate ID or Instrument"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
                />
              </div>

              <span className="text-xs text-slate-400 ml-auto">
                Showing {filtered.length} certificate{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Certificate ID</th>
                    <th className="py-2.5 px-4">Application ID</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Owner / Trader</th>
                    <th className="py-2.5 px-4">Date of Issue</th>
                    <th className="py-2.5 px-4">Valid Until</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Verify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 text-xs">
                        Loading certificates…
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((c) => (
                      <tr key={c.certificateId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          {c.certificateId}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{c.applicationId}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{c.instrumentName}</td>
                        <td className="py-3 px-4 text-slate-600">{c.ownerName}</td>
                        <td className="py-3 px-4 text-slate-500">{c.issuedDate}</td>
                        <td className="py-3 px-4 text-slate-500">{c.validUntil}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/verify-certificate?id=${c.certificateId}`}
                            className="px-2.5 py-1 text-xs font-semibold text-[#801424] hover:bg-[#801424]/8 rounded transition-colors inline-block"
                          >
                            Verify ↗
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No issued certificates found in the registry yet. Complete an LMO verification to issue a certificate.
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
