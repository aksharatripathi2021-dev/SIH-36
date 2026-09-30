"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { applicationService } from "@/services/applicationService";
import { verificationService } from "@/services/verificationService";
import { certificateService } from "@/services/certificateService";
import { pdfService } from "@/services/pdfService";
import { Application, ApplicationStatus, VerificationObservation } from "@/types";
import { useTranslation } from "@/i18n";

export default function ApplicationTrackingPage() {
  const { t } = useTranslation();
  const params = useParams();
  const applicationId = (params?.id as string) || "APP-26036-0148";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [observation, setObservation] = useState<VerificationObservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplicationData();
  }, [applicationId]);

  const loadApplicationData = async () => {
    setLoading(true);
    const app = await applicationService.getApplicationById(applicationId);
    if (app) {
      setApplication(app);
      const obs = await verificationService.getVerificationObservation(app.id);
      setObservation(obs);
    } else {
      // Fallback to core demo case
      const defaultApp = await applicationService.getApplicationById("APP-26036-0148");
      setApplication(defaultApp);
      if (defaultApp) {
        const obs = await verificationService.getVerificationObservation(defaultApp.id);
        setObservation(obs);
      }
    }
    setLoading(false);
  };

  // Demo simulator helper to advance or toggle states for reviewer testing
  const handleCycleStatus = async (targetStatus?: ApplicationStatus) => {
    if (!application) return;
    let nextStatus: ApplicationStatus = "Submitted";
    if (targetStatus) {
      nextStatus = targetStatus;
    } else if (application.status === "Submitted") {
      nextStatus = "Result Submitted";
    } else if (application.status === "Result Submitted") {
      nextStatus = "Certificate Generated";
    } else {
      nextStatus = "Submitted";
    }
    const updated = await applicationService.transitionApplicationStatus(application.id, nextStatus);
    setApplication(updated);
  };

  const handleIssueCertificate = async () => {
    if (!application) return;
    // Advance using canonical verificationService Pass flow
    await verificationService.submitVerificationResult(application.id, {
      instrumentId: application.instrumentId,
      overallResult: "Pass"
    });
    const updated = await applicationService.getApplicationById(application.id);
    if (updated) {
      setApplication(updated);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Left Sidebar */}
      <OwnerSidebar
        activeItem="applications"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={application?.id || applicationId}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/owner/dashboard" },
            { label: t("nav.applications"), href: "/owner/applications" },
            { label: application?.id || applicationId }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Application {application?.id || applicationId}
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {application?.instrumentName || "Platform Weighing Scale W-104"}
                  </h2>
                  {application && <StatusBadge status={application.status} size="md" />}
                </div>
                <p className="text-xs text-slate-500 pt-1">
                  300 kg capacity · {application?.ownerName || "Bharat Mart Pvt Ltd"} · Submitted {application?.submittedDate || "08 Jun 2025"}
                </p>
                <p className="text-xs text-slate-600 font-medium pt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
                  <span>
                    LMO assigned: {application?.assignedOfficer?.name || "Priya Sharma"} · {application?.assignedOfficer?.designation || "Delhi South LMO"}
                  </span>
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                {application?.certificateId ? (
                  <Link
                    href={`/verify-certificate?id=${application.certificateId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#801424] hover:underline"
                  >
                    <span>View Issued Certificate ({application.certificateId})</span>
                    <span>↗</span>
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Certificate not yet issued</span>
                )}

                {application?.instrumentId && (
                  <Link
                    href={`/owner/instruments/${application.instrumentId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 hover:underline"
                  >
                    <span>📖 Digital Instrument Passport ({application.instrumentId})</span>
                    <span>↗</span>
                  </Link>
                )}

                {/* State simulation selector for reviewer testing */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Demo State:</span>
                  <select
                    value={application?.status || "Submitted"}
                    onChange={(e) => handleCycleStatus(e.target.value as ApplicationStatus)}
                    className="text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded cursor-pointer font-medium"
                  >
                    <option value="Submitted">1. Submitted</option>
                    <option value="Under Review">2. Under Review</option>
                    <option value="Scheduled">3. Scheduled</option>
                    <option value="Verification In Progress">4. Verification In Progress</option>
                    <option value="Result Submitted">5. Result Submitted</option>
                    <option value="Needs Correction">6. Needs Correction</option>
                    <option value="Certificate Generated">7. Certificate Generated</option>
                    <option value="Completed">8. Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Application Timeline Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Application timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track the progress of your verification application.
              </p>
            </div>

            {/* 8-Step Timeline Horizontal Tracker */}
            <div className="pt-4 pb-2 overflow-x-auto">
              <div className="min-w-[720px] flex items-center justify-between relative">
                {application?.timeline.map((step, idx) => {
                  const isCurrent = step.isCurrent;
                  const isCompleted = step.isCompleted;

                  let circleBg = "bg-white border-2 border-slate-300 text-slate-500";
                  if (isCurrent) {
                    circleBg = "bg-[#10B981] border-2 border-[#10B981] text-white shadow-xs";
                  } else if (isCompleted) {
                    circleBg = "bg-[#0D1B2A] border-2 border-[#0D1B2A] text-white";
                  }

                  return (
                    <div key={step.stepNumber} className="flex-1 flex flex-col items-center relative group">
                      {/* Connecting Line */}
                      {idx > 0 && (
                        <div
                          className={`absolute top-3.5 right-1/2 left-[-50%] h-0.5 -z-0 ${
                            isCompleted || isCurrent ? "bg-[#0D1B2A]" : "border-t border-dashed border-slate-300"
                          }`}
                        />
                      )}

                      {/* Step Circle */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${circleBg}`}
                      >
                        {isCompleted && !isCurrent ? "✓" : step.stepNumber}
                      </div>

                      {/* Step Label */}
                      <span
                        className={`text-[11px] font-semibold text-center mt-2 px-1 leading-tight ${
                          isCurrent ? "text-emerald-700 font-bold" : isCompleted ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Step Date */}
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {step.date || "Upcoming"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Result Submitted Callout Banner */}
          {application?.status === "Result Submitted" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </span>
                  <div>
                    <span className="font-bold text-sm text-emerald-950 block">
                      Field Verification Complete — Result: PASS
                    </span>
                    <span className="text-xs text-emerald-800">
                      Observed error: <strong>+0.02%</strong> (within prototype limit). Verification observations recorded by LMO Priya Sharma.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleIssueCertificate}
                  className="px-3.5 py-1.5 bg-[#801424] hover:bg-[#6D0E1C] active:bg-[#580D18] text-white rounded text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Advance to &quot;Certificate Generated&quot;</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* Certificate Generated Card */}
          {application?.status === "Certificate Generated" && (
            <div className="bg-gradient-to-r from-emerald-900 to-[#0D1B2A] text-white rounded-lg p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                      Digital Certificate Generated
                    </span>
                    <span className="text-xs text-emerald-200">Valid &amp; Verified</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    Digital Verification Certificate #{application?.certificateId || "CERT-2025-00981"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Issued to <strong>Bharat Mart Pvt Ltd</strong> for <strong>Platform Weighing Scale W-104</strong> · Valid until <strong>11 Jun 2026</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <Link
                    href={`/verify-certificate?id=${application?.certificateId || "CERT-2025-00981"}`}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Verify Certificate Details (Public QR)</span>
                    <span>↗</span>
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      const certId = application?.certificateId || "CERT-2025-00981";
                      const cert = await certificateService.getCertificateById(certId);
                      if (cert) {
                        await pdfService.downloadCertificate(cert);
                      }
                    }}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-md border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>{t("certificate.downloadPrintable")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Instrument Details */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Instrument details
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Manufacturer</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">Essae</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Model</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">DS-215</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Serial number</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">ES215-88421</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Year</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">2023</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Location</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {application?.location || "Karol Bagh, New Delhi"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Card: Verification Summary */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Verification summary
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Observed error</span>
                  <span className="font-semibold text-slate-800">
                    {application?.status === "Result Submitted" || application?.status === "Certificate Generated" || application?.status === "Completed"
                      ? "+0.02%"
                      : "Pending inspection"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Result</span>
                  {application?.status === "Result Submitted" || application?.status === "Certificate Generated" || application?.status === "Completed" ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[11px]">
                      Pass
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-[11px]">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Next action</span>
                  <span className="font-medium text-slate-700">
                    {application?.status === "Certificate Generated"
                      ? `Certificate Generated (${application?.certificateId || "CERT-2025-00981"})`
                      : application?.status === "Result Submitted"
                      ? "Certificate processing"
                      : "Legal Metrology Officer field inspection"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Attachments Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Document attachments
            </h4>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="text-slate-400">📄</span>
                  <span className="font-medium">Aadhaar business proof.pdf</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Downloading Aadhaar business proof.pdf")}
                  className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  title="Download attachment"
                >
                  📥
                </button>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="text-slate-400">📄</span>
                  <span className="font-medium">purchase invoice.pdf</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Downloading purchase invoice.pdf")}
                  className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  title="Download attachment"
                >
                  📥
                </button>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <span className="text-slate-400">📄</span>
                  <span className="font-medium">calibration history.pdf</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Downloading calibration history.pdf")}
                  className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  title="Download attachment"
                >
                  📥
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Links */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/owner/re-verify/W-104"
              className="text-xs font-semibold text-[#801424] hover:underline"
            >
              Apply for re-verification
            </Link>

            <Link
              href="/owner/dashboard"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
            >
              <span>←</span>
              <span>Back to applications</span>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
