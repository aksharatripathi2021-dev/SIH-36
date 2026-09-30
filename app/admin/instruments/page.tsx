"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { instrumentService } from "@/services/instrumentService";
import { Instrument } from "@/types";
import { useTranslation } from "@/i18n";

export default function AdminInstrumentsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstruments();
  }, []);

  const loadInstruments = async () => {
    const list = await instrumentService.getInstruments();
    setInstruments(list);
    setLoading(false);
  };

  const filtered = instruments.filter((inst) => {
    const matchesSearch =
      inst.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All statuses" ||
      inst.currentStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <MinistrySidebar
        activeItem="instruments"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.instruments")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/admin/dashboard" },
            { label: t("nav.instruments") }
          ]}
          avatarInitials="MA"
          notificationCount={5}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              National Instruments Inventory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Comprehensive registry of verified, pending, and expiring commercial weighing and measuring instruments.
            </p>
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
                  placeholder="Search by ID, name, or owner"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 cursor-pointer"
              >
                <option value="All statuses">All statuses</option>
                <option value="Verified">Verified</option>
                <option value="Expiring">Expiring</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
              </select>

              <span className="text-xs text-slate-400 ml-auto">
                Showing {filtered.length} instrument{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Instrument ID</th>
                    <th className="py-2.5 px-4">Name &amp; Category</th>
                    <th className="py-2.5 px-4">Owner / Enterprise</th>
                    <th className="py-2.5 px-4">Capacity</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        Loading instruments…
                      </td>
                    </tr>
                  ) : filtered.length > 0 ? (
                    filtered.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">{inst.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{inst.name}</div>
                          <div className="text-[11px] text-slate-500">{inst.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{inst.ownerName}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{inst.capacity}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {inst.certificateExpiryDate}
                          {inst.daysUntilExpiry > 0 && inst.daysUntilExpiry <= 30 && (
                            <span className="text-[10px] text-rose-600 font-semibold block">
                              ({inst.daysUntilExpiry} days left)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={inst.currentStatus} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                        No instruments found matching criteria.
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
