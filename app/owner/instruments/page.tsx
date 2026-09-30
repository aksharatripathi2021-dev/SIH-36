"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { instrumentService } from "@/services/instrumentService";
import { authService } from "@/services/authService";
import { Instrument, UserProfile } from "@/types";
import { useTranslation } from "@/i18n";
import { LegacyReceiptAssistant } from "@/app/components/LegacyReceiptAssistant";

export default function OwnerInstrumentsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [loading, setLoading] = useState(true);

  // Add Instrument Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptAssistant, setShowReceiptAssistant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "Electronic Scales",
    manufacturer: "",
    model: "",
    serialNumber: "",
    capacity: "",
    location: "",
    verificationInterval: "12",
    supportingDocument: ""
  });

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);
    const active = await authService.getCurrentUser();
    setCurrentUser(active);
    const list = await instrumentService.getInstrumentsByOwner(active.id);
    setInstruments(list);
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    setAddError(null);
  };

  const handleCreateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!form.name.trim() || !form.manufacturer.trim() || !form.serialNumber.trim() || !form.capacity.trim()) {
      setAddError("Please fill in all mandatory device specifications.");
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    try {
      const created = await instrumentService.createInstrument({
        name: form.name,
        category: form.category,
        manufacturer: form.manufacturer,
        model: form.model || "Standard",
        serialNumber: form.serialNumber,
        capacity: form.capacity,
        verificationIntervalMonths: form.verificationInterval === "other" ? undefined : (parseInt(form.verificationInterval, 10) || 12),
        location: form.location || currentUser.address || "Establishment Premises",
        ownerId: currentUser.id,
        ownerName: currentUser.organization || currentUser.name,
        establishmentName: currentUser.organization
      });

      // Refresh list
      const updatedList = await instrumentService.getInstrumentsByOwner(currentUser.id);
      setInstruments(updatedList);

      setAddSuccess(`Instrument ${created.id} registered successfully.`);
      setIsSubmitting(false);
      setShowAddModal(false);

      // Reset form
      setForm({
        name: "",
        category: "Electronic Scales",
        manufacturer: "",
        model: "",
        serialNumber: "",
        capacity: "",
        location: "",
        verificationInterval: "12",
        supportingDocument: ""
      });

      setTimeout(() => setAddSuccess(null), 4000);
    } catch (err: any) {
      setAddError(err.message || "Failed to register instrument.");
      setIsSubmitting(false);
    }
  };

  const handleReceiptApply = (
    extracted: Record<string, string>,
    matchedInst?: Instrument | null
  ) => {
    let matchedCategory = "Electronic Scales";
    const typeLower = (extracted.instrumentType || "").toLowerCase();
    if (typeLower.includes("weighbridge")) matchedCategory = "Weighbridges";
    else if (typeLower.includes("fuel") || typeLower.includes("dispenser")) matchedCategory = "Fuel Dispensers";
    else if (typeLower.includes("tank")) matchedCategory = "Storage Tanks";
    else if (typeLower.includes("flow") || typeLower.includes("meter")) matchedCategory = "Flow Meters";

    setForm((prev) => ({
      ...prev,
      name: extracted.instrumentName || (extracted.model ? `${extracted.model} scale` : prev.name || "Commercial Scale"),
      category: matchedCategory,
      manufacturer: extracted.model ? extracted.model.split(" ")[0] : (prev.manufacturer || "Certified Metrology"),
      model: extracted.model || prev.model || "Standard",
      serialNumber: extracted.serialNumber || prev.serialNumber || "",
      capacity: extracted.capacity || prev.capacity || "",
      location: extracted.address || prev.location || ""
    }));

    setShowAddModal(true);
  };

  const filteredInstruments = instruments.filter((inst) => {
    const matchesSearch =
      inst.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All statuses" ||
      inst.currentStatus.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <OwnerSidebar
        activeItem="instruments"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("nav.myInstruments")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/owner/dashboard" },
            { label: t("nav.myInstruments") }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Registered Instruments
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manage compliance for commercial devices registered under <strong className="text-slate-800">{currentUser?.organization || currentUser?.name || "Your Business"}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowReceiptAssistant(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>⚡</span>
                <span>{t("receipt.assistantTitle")}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>+</span>
                <span>Register instrument</span>
              </button>

              <Link
                href="/owner/re-verify"
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium border border-slate-300 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Re-verification</span>
              </Link>
            </div>
          </div>

          {/* Success Banner */}
          {addSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs sm:text-sm text-emerald-800 font-medium flex items-center gap-2">
              <span>✓</span>
              <span>{addSuccess}</span>
            </div>
          )}

          {/* Instruments Table Card */}
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
                  placeholder="Search instruments by name or ID"
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
                  <option value="Verified">Verified</option>
                  <option value="Expiring">Expiring</option>
                  <option value="Pending">Pending</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <span className="text-xs text-slate-400 ml-auto">
                Showing {filteredInstruments.length} instrument{filteredInstruments.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Instrument ID</th>
                    <th className="py-2.5 px-4">Name &amp; Category</th>
                    <th className="py-2.5 px-4">Model &amp; Serial</th>
                    <th className="py-2.5 px-4">Capacity</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                        Loading instruments…
                      </td>
                    </tr>
                  ) : filteredInstruments.length > 0 ? (
                    filteredInstruments.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                          <Link
                            href={`/owner/instruments/${inst.id}`}
                            className="text-sky-800 hover:underline"
                            title={t("passport.viewPassport")}
                          >
                            {inst.id}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/owner/instruments/${inst.id}`}
                            className="font-semibold text-slate-900 hover:text-sky-800 hover:underline block"
                          >
                            {inst.name}
                          </Link>
                          <div className="text-[11px] text-slate-500">{inst.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{inst.manufacturer} {inst.model}</div>
                          <div className="text-[11px] font-mono text-slate-400">{inst.serialNumber}</div>
                        </td>
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/owner/instruments/${inst.id}`}
                              className="px-2.5 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-50 rounded transition-colors inline-block"
                            >
                              {t("passport.viewPassport")}
                            </Link>
                            <Link
                              href={`/owner/re-verify/${inst.id}`}
                              className="px-2.5 py-1 text-xs font-semibold text-[#801424] hover:bg-[#801424]/8 rounded transition-colors inline-block"
                            >
                              Re-verify →
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
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

      {/* Register Instrument Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register New Commercial Instrument</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter device specifications and verification interval for registration.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Legacy Receipt Assistance Trigger */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">
                Have an old offline verification receipt or memorandum?
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowReceiptAssistant(true);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                ⚡ Auto-fill from Receipt
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                ⚠️ {addError}
              </div>
            )}

            <form onSubmit={handleCreateInstrument} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Instrument Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="Electronic Scales">Electronic Scales</option>
                    <option value="Flow Meters">Flow Meters</option>
                    <option value="Weighbridges">Weighbridges</option>
                    <option value="Platform scale">Platform scale</option>
                    <option value="Counter scale">Counter scale</option>
                    <option value="Digital measuring balance">Digital measuring balance</option>
                    <option value="Carat balance">Carat balance</option>
                    <option value="Measuring tape">Measuring tape</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Device Name / Tag *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Retail Digital Scale S-101"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={form.manufacturer}
                    onChange={handleFormChange}
                    placeholder="e.g. Essae / Mettler"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={form.model}
                    onChange={handleFormChange}
                    placeholder="e.g. DS-215"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number *</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleFormChange}
                    placeholder="e.g. SN-88492"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity *</label>
                  <input
                    type="text"
                    name="capacity"
                    value={form.capacity}
                    onChange={handleFormChange}
                    placeholder="e.g. 50 kg / 300 kg / 50 kL"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicable verification interval</label>
                  <select
                    name="verificationInterval"
                    value={form.verificationInterval}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white cursor-pointer"
                  >
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="other">Other / As applicable</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter/select the interval applicable to this instrument and jurisdiction. This prototype does not determine statutory intervals automatically.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Applicable supporting document <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="supportingDocument"
                    value={form.supportingDocument}
                    onChange={handleFormChange}
                    placeholder="e.g. Invoice / test doc ref"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Physical Installation Location</label>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleFormChange}
                    placeholder="e.g. Counter 3, Main Market Premises"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#801424] hover:bg-[#6D0E1C] disabled:opacity-60 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Registering…" : "Register Instrument ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legacy Receipt Assistant Modal */}
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
