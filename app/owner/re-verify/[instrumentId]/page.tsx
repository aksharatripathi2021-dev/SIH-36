"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { instrumentService } from "@/services/instrumentService";
import { applicationService } from "@/services/applicationService";
import { authService } from "@/services/authService";
import { Instrument, UserProfile } from "@/types";
import { useTranslation } from "@/i18n";
import { LegacyReceiptAssistant } from "@/app/components/LegacyReceiptAssistant";

export default function ReverificationPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const instrumentId = (params?.instrumentId as string) || "W-104";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [ownerInstruments, setOwnerInstruments] = useState<Instrument[]>([]);
  const [preferredDate, setPreferredDate] = useState("2025-06-12");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [certFileName, setCertFileName] = useState("");
  const [recordsFileName, setRecordsFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptAssistant, setShowReceiptAssistant] = useState(false);
  const [wasAssisted, setWasAssisted] = useState(false);

  useEffect(() => {
    loadInstrument();
  }, [instrumentId]);

  const loadInstrument = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    const userInsts = await instrumentService.getInstrumentsByOwner(user.id);
    setOwnerInstruments(userInsts);

    const inst = userInsts.find((i) => i.id === instrumentId) || (await instrumentService.getInstrumentById(instrumentId));
    if (inst) {
      setInstrument(inst);
    } else {
      const defaultInst = userInsts[0] || (await instrumentService.getInstrumentById("W-104"));
      setInstrument(defaultInst);
    }

    // Check for pending receipt extraction passed from navigation
    if (typeof window !== "undefined") {
      const pendingStr = sessionStorage.getItem("pending_receipt_extraction");
      if (pendingStr) {
        try {
          const parsed = JSON.parse(pendingStr);
          sessionStorage.removeItem("pending_receipt_extraction");
          if (parsed && parsed.values) {
            handleReceiptApply(parsed.values, inst || undefined);
          }
        } catch (e) {
          // ignore error
        }
      }
    }
  };

  const handleReceiptApply = (
    extracted: Record<string, string>,
    matchedInst?: Instrument | null
  ) => {
    setWasAssisted(true);
    if (matchedInst) {
      setInstrument(matchedInst);
    }
    if (extracted.previousCertificateNumber) {
      setCertFileName(extracted.previousCertificateNumber + ".pdf");
    }

    const notesAdd: string[] = [];
    if (extracted.instrumentName || extracted.model) {
      notesAdd.push(`Extracted Device: ${extracted.instrumentName || extracted.model}${extracted.serialNumber ? ` (S/N: ${extracted.serialNumber})` : ""}`);
    }
    if (extracted.capacity || extracted.accuracyClass) {
      notesAdd.push(`Specification: ${[extracted.capacity, extracted.accuracyClass].filter(Boolean).join(" · ")}`);
    }
    if (extracted.previousVerificationDate) {
      notesAdd.push(`Historical Verification Date: ${extracted.previousVerificationDate}`);
    }
    if (extracted.observedReading) {
      notesAdd.push(`Historical Observed Reading: ${extracted.observedReading}`);
    }
    if (extracted.remarks) {
      notesAdd.push(`Receipt Remarks: ${extracted.remarks}`);
    }

    if (notesAdd.length > 0) {
      const assistedBlock = `[Assisted Receipt Reference]\n${notesAdd.join("\n")}`;
      setAdditionalNotes((prev) =>
        prev ? `${prev}\n\n${assistedBlock}` : assistedBlock
      );
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      const draftApp = await applicationService.createReverificationApplication({
        instrumentId: instrument?.id || "W-104",
        preferredDate: preferredDate || "12 Jun 2025",
        additionalNotes,
        currentCertificateFile: certFileName || "CERT-2024-W104.pdf",
        supportingRecordsFile: recordsFileName || "maintenance_log.pdf",
        status: "Draft",
        legacyReceiptAssisted: wasAssisted
      });

      router.push(`/owner/applications/${draftApp.id}`);
    } catch (err) {
      console.error("Failed to save draft:", err);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const createdApp = await applicationService.createReverificationApplication({
        instrumentId: instrument?.id || "W-104",
        preferredDate: preferredDate || "12 Jun 2025",
        additionalNotes,
        currentCertificateFile: certFileName || "CERT-2024-W104.pdf",
        supportingRecordsFile: recordsFileName || "maintenance_log.pdf",
        status: "Submitted",
        legacyReceiptAssisted: wasAssisted
      });

      router.push(`/owner/applications/${createdApp.id}`);
    } catch (err) {
      console.error("Failed to submit re-verification:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Sidebar */}
      <OwnerSidebar
        activeItem="re-verification"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Re-verification"
          breadcrumbs={[
            { label: "Home", href: "/owner/dashboard" },
            { label: "Re-verification" }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Start re-verification
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                The certificate for {instrument?.name || "Platform weighing scale W-104"} expires in {instrument?.daysUntilExpiry ?? 18} days.
                Complete the steps below to keep this instrument verified.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReceiptAssistant(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>⚡</span>
              <span>{t("receipt.assistantTitle")}</span>
            </button>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3 sm:p-4 flex items-center gap-2.5 text-xs sm:text-sm text-amber-900">
            <span className="text-amber-600 text-base">⚠️</span>
            <span className="font-medium">
              Re-verification is required before the current certificate expires.
            </span>
          </div>

          {/* Instrument Summary Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {instrument?.name || "Platform weighing scale"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instrument ID: {instrument?.id || "W-104"}
                </p>
              </div>

              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
                ⏰ Expires in {instrument?.daysUntilExpiry ?? 18} days
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 block">Current verification status</span>
                <span className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>{instrument?.currentStatus || "Verified"}</span>
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Certificate expiry date</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {instrument?.certificateExpiryDate ? "30 Jun 2025" : "30 Jun 2025"}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Instrument ID</span>
                <span className="font-semibold text-slate-800 mt-1 block">
                  {instrument?.id || "W-104"}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-slate-900">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Instrument details</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Required documents</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Appointment or submission</span>
            </div>
          </div>

          {/* Assisted Form Banner */}
          {wasAssisted && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-sky-600 font-bold text-sm">⚡</span>
                <span>
                  Form populated using <strong>AI-Assisted Legacy Receipt</strong>. You can manually edit any field before submitting or saving as draft.
                </span>
              </div>
              <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-full shrink-0">
                Assisted Draft
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Instrument Details Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Instrument details</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm the instrument being submitted for re-verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Instrument name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={instrument?.name || "Platform weighing scale"}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-700 cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Select registered instrument
                  </label>
                  {ownerInstruments.length > 0 ? (
                    <select
                      value={instrument?.id || "W-104"}
                      onChange={(e) => {
                        const selected = ownerInstruments.find((i) => i.id === e.target.value);
                        if (selected) {
                          setInstrument(selected);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#801424]"
                    >
                      {ownerInstruments.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.id} — {inst.name} ({inst.category})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={instrument?.id || "W-104"}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-700 cursor-not-allowed select-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Serial number
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={instrument?.serialNumber || "ES215-88421"}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono select-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category &amp; Capacity
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${instrument?.category || "Electronic Scales"} · ${instrument?.capacity || "300 kg"}`}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-700 select-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Required Documents Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Required documents</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload the current certificate and supporting records for review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptAssistant(true)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>⚡</span>
                  <span>Auto-fill from Receipt</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Current Certificate */}
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>↑</span>
                    <span>Current certificate</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload the existing W-104 certificate.
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setCertFileName(e.target.files?.[0]?.name || "")}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                  />
                </div>

                {/* Upload Supporting Records */}
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>↑</span>
                    <span>Supporting records</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload calibration or maintenance records.
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setRecordsFileName(e.target.files?.[0]?.name || "")}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Appointment / Submission Info Card */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Appointment or submission information
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide a preferred date and any information needed for submission.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preferred appointment or submission date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full sm:w-72 px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#801424] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Additional information
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Add any appointment or submission notes"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#801424]"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/owner/dashboard"
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Back</span>
              </Link>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-md shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Save as draft</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#801424] hover:bg-[#6D0E1C] active:bg-[#580D18] disabled:opacity-70 text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>{isSubmitting ? "Submitting..." : "Submit re-verification"}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </form>
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
