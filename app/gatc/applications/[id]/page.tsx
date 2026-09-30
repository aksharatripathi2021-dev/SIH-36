"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { GatcSidebar } from "@/app/components/GatcSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { applicationService } from "@/services/applicationService";
import { verificationService } from "@/services/verificationService";
import { storageService } from "@/services/storageService";
import { Application, AuditEvent, VerificationObservation } from "@/types";
import { useTranslation } from "@/i18n";

export default function GatcApplicationReviewPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const applicationId = (params?.id as string) || "LM-2026-00124";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [observation, setObservation] = useState<VerificationObservation | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribeToDemoUpdates(() => {
      loadData();
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [applicationId]);

  const loadData = async () => {
    const app = await applicationService.getApplicationById(applicationId);
    if (app) {
      setApplication(app);
      const obs = await verificationService.getVerificationObservation(app.id);
      setObservation(obs);
      const events = storageService.getAuditEvents(app.id);
      setAuditEvents(events);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!application) return;
    setIsProcessing(true);
    try {
      const res = await verificationService.approveByGatc(
        application.id,
        reviewNotes || "GATC technical verification confirmed compliance with Legal Metrology standards."
      );
      setApplication(res.application);
      setActionSuccess("approved");
      const events = storageService.getAuditEvents(application.id);
      setAuditEvents(events);
    } catch (err) {
      console.error("GATC approval failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application) return;
    setIsProcessing(true);
    try {
      const updated = await verificationService.rejectByGatc(
        application.id,
        reviewNotes || "Discrepancy detected during laboratory review."
      );
      setApplication(updated);
      setActionSuccess("rejected");
      const events = storageService.getAuditEvents(application.id);
      setAuditEvents(events);
    } catch (err) {
      console.error("GATC rejection failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs text-slate-400">
        Loading technical review…
      </div>
    );
  }

  const isApproved =
    application?.status === "APPROVED" ||
    application?.status === "CERTIFICATE_ISSUED" ||
    application?.status === "Certificate Generated" ||
    application?.status === "Completed" ||
    actionSuccess === "approved";

  const isRejected = application?.status === "REJECTED" || actionSuccess === "rejected";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <GatcSidebar
        activeItem="assigned"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={`GATC Technical Review — ${application?.id || applicationId}`}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/gatc/dashboard" },
            { label: "Assigned Queue", href: "/gatc/assigned" },
            { label: application?.id || applicationId }
          ]}
          avatarInitials="DG"
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Application Review · {application?.id || applicationId}
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {application?.instrumentName || "Electronic Weighing Instrument"}
                  </h2>
                  {application && <StatusBadge status={application.status} size="md" />}
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  Owner: <strong>{application?.ownerName || "Aryan"}</strong> · Location:{" "}
                  {application?.location || "Supermarket, YCC Wanadongri, Nagpur"}
                </p>
                <p className="text-xs text-slate-600 font-medium pt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                  <span>
                    Field Inspector: {application?.assignedOfficer?.name || "Demo LMO Officer"} (
                    {application?.assignedOfficer?.designation || "Legal Metrology Officer"})
                  </span>
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Jurisdiction</span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  {application?.zone || "Maharashtra Nagpur Zone"}
                </span>
              </div>
            </div>
          </div>

          {/* Success Banner if Approved */}
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <h3 className="font-bold text-sm text-emerald-950">
                    Application Approved &amp; Certificate Issued
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Certificate <strong>{application?.certificateId || "CERT-LM-2026-00124"}</strong> has been
                    generated and signed. Public verification QR is live.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/verify-certificate?id=${application?.certificateId || "CERT-LM-2026-00124"}`}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Public QR Verification</span>
                  <span>↗</span>
                </Link>
                <Link
                  href={`/verify/${application?.certificateId || "CERT-LM-2026-00124"}`}
                  className="px-3.5 py-2 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 text-xs font-semibold rounded transition-colors"
                >
                  Direct /verify Link
                </Link>
              </div>
            </div>
          )}

          {/* Warning Banner if Rejected */}
          {isRejected && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-800 flex items-center gap-2">
              <span className="font-bold">⚠️ Application Rejected:</span>
              <span>The application was declined during GATC laboratory review. Correction notice has been sent to Trader.</span>
            </div>
          )}

          {/* LMO Field Inspection Observations Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  LMO Field Inspection &amp; Calibration Report
                </h3>
                <p className="text-xs text-slate-500">
                  Recorded on-site under Legal Metrology (General) Rules, 2011.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                LMO Result: {observation?.overallResult || "Pass"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                  {observation?.testStandard || "OIML R76-1"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reference Weights</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                  {observation?.referenceWeights || "20 kg / 50 kg / 100 kg"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Zero Error</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                  {observation?.zeroError || "0.00 kg"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Repeatability</span>
                <span className="font-mono font-semibold text-emerald-700 mt-0.5 block">
                  {observation?.repeatabilityError || "+0.02%"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Eccentricity</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                  {observation?.eccentricityError || "+0.01%"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Condition</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {observation?.condition || "Good"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Seals Intact</span>
                <span className="font-semibold text-emerald-700 mt-0.5 block">
                  {observation?.sealIntact !== false ? "Yes (Intact)" : "No"}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification Sticker</span>
                <span className="font-semibold text-emerald-700 mt-0.5 block">
                  {observation?.calibrationStickerPresent !== false ? "Affixed" : "Missing"}
                </span>
              </div>
            </div>

            {observation?.officerNotes && (
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded text-xs text-blue-900">
                <span className="font-bold block text-[11px] uppercase tracking-wide text-blue-700 mb-1">
                  Field Officer Remarks
                </span>
                <p>{observation.officerNotes}</p>
              </div>
            )}
          </div>

          {/* GATC Decision Controls */}
          {!isApproved && !isRejected && (
            <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">GATC Laboratory Decision</h3>
                <p className="text-xs text-slate-500">
                  Review the inspection measurements against standard tolerances and issue final statutory clearance.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Laboratory Review Notes / Assessment Remarks
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Technical findings conform with OIML R76-1 accuracy class. Measurements within permissible statutory limits."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>✓</span>
                  <span>{isProcessing ? "Issuing Certificate…" : "Approve & Issue Certificate"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-[#801424] font-semibold text-xs rounded-md border border-rose-200 transition-colors cursor-pointer"
                >
                  Reject Application
                </button>
              </div>
            </div>
          )}

          {/* Audit History Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Statutory Audit Trail
            </h3>

            {auditEvents.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {auditEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-slate-800">{evt.eventType}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {evt.role} · {evt.actor}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{evt.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{evt.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-2">No audit events recorded yet.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
