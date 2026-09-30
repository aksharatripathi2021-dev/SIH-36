"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InstrumentPassport, VerificationCycle, PassportTimelineEvent } from "@/types";
import { StatusBadge } from "@/app/components/StatusBadge";
import { pdfService } from "@/services/pdfService";
import { useTranslation } from "@/i18n";

interface Props {
  passport: InstrumentPassport;
  basePath: "/owner" | "/lmo" | "/admin";
}

export function DigitalInstrumentPassportView({ passport, basePath }: Props) {
  const { t } = useTranslation();
  const { instrument, owner, summary, timeline, cycles } = passport;
  const [activeCycleTab, setActiveCycleTab] = useState<string>(
    cycles.length > 0 ? cycles[cycles.length - 1].cycleId : ""
  );

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb & Top Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href={`${basePath}/dashboard`} className="hover:text-slate-800">
              {t("nav.dashboard")}
            </Link>
            <span>›</span>
            <Link
              href={basePath === "/owner" ? "/owner/instruments" : `${basePath}/applications`}
              className="hover:text-slate-800"
            >
              {basePath === "/owner" ? t("nav.instruments") : t("nav.assignedApplications")}
            </Link>
            <span>›</span>
            <span className="font-semibold text-slate-800">{instrument.id}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("passport.title")}
            </h1>
            <span className="px-2 py-0.5 bg-sky-50 text-sky-800 text-[11px] font-bold font-mono border border-sky-200 rounded">
              {instrument.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("passport.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {basePath === "/owner" && (
            <Link
              href={`/owner/re-verify/${instrument.id}`}
              className="px-3.5 py-2 bg-[#801424] hover:bg-[#68101D] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Re-verify Instrument</span>
            </Link>
          )}
          <Link
            href={basePath === "/owner" ? "/owner/instruments" : `${basePath}/dashboard`}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            {t("passport.backToInstruments")}
          </Link>
        </div>
      </div>

      {/* ── 1. Instrument Identity Card ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0D1B2A] text-white flex items-center justify-center font-bold text-base shadow-xs">
              ⚖️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{instrument.name}</h2>
              <p className="text-xs text-slate-500">
                {instrument.category} • {instrument.manufacturer} {instrument.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <StatusBadge status={instrument.currentStatus} />
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Serial Number</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {instrument.serialNumber}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Capacity / Range</span>
            <span className="font-semibold text-slate-800 text-sm">{instrument.capacity}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Year of Manufacture</span>
            <span className="font-semibold text-slate-800 text-sm">
              {instrument.yearOfManufacture || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Applicable Interval</span>
            <span className="font-semibold text-slate-800 text-sm">
              {instrument.verificationIntervalMonths ? `${instrument.verificationIntervalMonths} months` : "12 months"}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[11px]">Owner / Establishment</span>
            <span className="font-semibold text-slate-800">
              {instrument.establishmentName || instrument.ownerName}
              {owner?.taxIdentifier && (
                <span className="text-slate-400 font-mono text-[10px] block">
                  Tax/Trade Ref: {owner.taxIdentifier}
                </span>
              )}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block text-[11px]">Registered Location</span>
            <span className="text-slate-700">{instrument.location}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Passport Summary Metrics Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t("passport.totalApplications")}
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary.totalApplications}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary.latestApplicationId ? `Latest: ${summary.latestApplicationId}` : "No applications"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t("passport.totalVerifications")}
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {summary.totalVerifications}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {summary.latestVerificationDate ? `Last: ${summary.latestVerificationDate}` : "None recorded"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t("passport.totalCertificates")}
          </div>
          <div className="text-2xl font-black text-sky-800 mt-1">
            {summary.totalCertificates}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {summary.currentCertificateId ? (
              <span className="text-emerald-700 font-medium">
                {summary.currentCertificateId}
              </span>
            ) : (
              "No active certificate"
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t("passport.qrSticker")}
          </div>
          <div className="mt-1.5">
            {summary.currentQrStickerStatus === "CONFIRMED" ? (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-bold inline-block">
                Confirmed ✓
              </span>
            ) : summary.currentQrStickerStatus === "CORRECTION_REQUIRED" ? (
              <span className="px-2 py-0.5 bg-rose-50 text-[#801424] border border-rose-200 rounded text-xs font-bold inline-block">
                Correction Req.
              </span>
            ) : summary.currentQrStickerStatus === "PENDING" ? (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-bold inline-block">
                Pending Review
              </span>
            ) : (
              <span className="text-xs text-slate-400 italic">Not submitted</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Shop sticker placement</div>
        </div>
      </div>

      {/* ── 3. Chronological Verification Timeline ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t("passport.verificationHistory")}
            </h2>
            <p className="text-xs text-slate-500">
              Reconstructed chronological lifecycle events for this instrument.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {timeline.length} {timeline.length === 1 ? "event" : "events"}
          </span>
        </div>

        {timeline.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {t("passport.noHistory")}
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timeline.map((evt) => (
              <div key={evt.id} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[8px] ${
                    evt.type === "CERTIFICATE_GENERATED"
                      ? "bg-emerald-600 text-white"
                      : evt.type === "QR_STICKER_CONFIRMED"
                      ? "bg-sky-600 text-white"
                      : evt.type === "QR_STICKER_CORRECTION_REQUIRED"
                      ? "bg-rose-600 text-white"
                      : evt.type === "RESULT_SUBMITTED"
                      ? "bg-indigo-600 text-white"
                      : evt.type === "INSTRUMENT_REGISTERED"
                      ? "bg-[#0D1B2A] text-white"
                      : "bg-slate-400 text-white"
                  }`}
                >
                  •
                </div>

                <div className="bg-slate-50/70 hover:bg-slate-50 rounded-lg p-3 border border-slate-100 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{evt.title}</span>
                      {evt.status && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-white border border-slate-200 rounded text-slate-700">
                          {evt.status}
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{evt.date}</span>
                  </div>

                  {evt.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  )}

                  {/* Context Links */}
                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                    {evt.applicationId && basePath === "/owner" && (
                      <Link
                        href={`/owner/applications/${evt.applicationId}`}
                        className="text-sky-800 hover:underline font-semibold"
                      >
                        View Application {evt.applicationId} →
                      </Link>
                    )}
                    {evt.certificateId && (
                      <Link
                        href={`/verify-certificate?id=${evt.certificateId}`}
                        target="_blank"
                        className="text-emerald-800 hover:underline font-semibold"
                      >
                        Public Verification Record ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Historical Verification Cycles (Grouping) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {t("passport.verificationCycles")}
            </h2>
            <p className="text-xs text-slate-500">
              Discrete verification application, inspection, certificate, and sticker lifecycles.
            </p>
          </div>

          {cycles.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {cycles.map((c) => (
                <button
                  key={c.cycleId}
                  type="button"
                  onClick={() => setActiveCycleTab(c.cycleId)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeCycleTab === c.cycleId
                      ? "bg-[#0D1B2A] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t("passport.cycle")} {c.cycleNumber} ({c.application.id})
                </button>
              ))}
            </div>
          )}
        </div>

        {cycles.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-3xl">📭</div>
            <p className="text-xs text-slate-500 font-medium">
              {t("passport.noApplications")}
            </p>
            {basePath === "/owner" && (
              <Link
                href={`/owner/re-verify/${instrument.id}`}
                className="inline-block px-4 py-1.5 bg-[#801424] text-white text-xs font-semibold rounded-md shadow-xs"
              >
                Submit First Verification Application →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {cycles
              .filter((c) => (activeCycleTab ? c.cycleId === activeCycleTab : true))
              .map((cycle) => (
                <div key={cycle.cycleId} className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">
                        {t("passport.cycle")} {cycle.cycleNumber}: Application {cycle.application.id}
                      </span>
                      <span className="text-slate-500 ml-2">Submitted {cycle.date}</span>
                    </div>
                    <StatusBadge status={cycle.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* A. Verification Result Card */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                        <span>🔬 {t("passport.verification")}</span>
                        {cycle.verification ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              cycle.verification.overallResult === "Pass"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-[#801424]"
                            }`}
                          >
                            {cycle.verification.overallResult}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">Pending</span>
                        )}
                      </div>

                      {cycle.verification ? (
                        <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t("passport.testStandard")}:</span>
                            <span className="font-medium">{cycle.verification.testStandard}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t("passport.zeroError")}:</span>
                            <span className="font-mono">{cycle.verification.zeroError}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t("passport.repeatability")}:</span>
                            <span className="font-mono">{cycle.verification.repeatabilityError}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t("passport.eccentricity")}:</span>
                            <span className="font-mono">{cycle.verification.eccentricityError}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">{t("passport.sealIntact")}:</span>
                            <span className="font-semibold text-emerald-700">
                              {cycle.verification.sealIntact ? "Yes ✓" : "No ✕"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-3 text-center">
                          {t("passport.noVerificationRecord")}
                        </p>
                      )}
                    </div>

                    {/* B. Certificate Card */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                        <span>📜 {t("passport.certificate")}</span>
                        {cycle.certificate && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                            {cycle.certificate.status}
                          </span>
                        )}
                      </div>

                      {cycle.certificate ? (
                        <div className="space-y-2 text-xs pt-1">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Certificate Number</span>
                            <span className="font-mono font-bold text-sky-800">
                              {cycle.certificate.certificateId}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400 block">Issued</span>
                              <span className="font-medium text-slate-800">
                                {cycle.certificate.issuedDate}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Valid Until</span>
                              <span className="font-semibold text-emerald-700">
                                {cycle.certificate.validUntil}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => pdfService.downloadCertificate(cycle.certificate!)}
                              className="px-2.5 py-1 bg-[#0D1B2A] hover:bg-[#1E2E42] text-white text-[11px] font-semibold rounded transition-colors cursor-pointer"
                            >
                              📥 Download
                            </button>
                            <Link
                              href={`/verify-certificate?id=${cycle.certificate.certificateId}`}
                              target="_blank"
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-semibold rounded transition-colors"
                            >
                              Verify ↗
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-3 text-center">
                          {t("passport.noCertificate")}
                        </p>
                      )}
                    </div>

                    {/* C. QR Sticker Placement Card */}
                    <div className="bg-slate-50/50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-200 pb-2">
                        <span>🏷️ {t("passport.qrSticker")}</span>
                        {cycle.stickerConfirmations.length > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cycle.stickerConfirmations[0].status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : cycle.stickerConfirmations[0].status === "CORRECTION_REQUIRED"
                                ? "bg-rose-50 text-[#801424] border border-rose-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {cycle.stickerConfirmations[0].status}
                          </span>
                        )}
                      </div>

                      {cycle.stickerConfirmations.length > 0 ? (
                        <div className="space-y-2 text-xs pt-1">
                          {cycle.stickerConfirmations.slice(0, 1).map((stk) => (
                            <div key={stk.id} className="space-y-1.5">
                              <div className="flex items-center gap-3">
                                {stk.evidence?.url && (
                                  <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                                    <img
                                      src={stk.evidence.url}
                                      alt="Sticker placement proof"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <span className="text-[11px] font-medium text-slate-800 block">
                                    {stk.id}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Submitted {stk.submittedAt}
                                  </span>
                                </div>
                              </div>

                              {stk.reviewerComment && (
                                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-[#801424]">
                                  <strong>Officer Note:</strong> {stk.reviewerComment}
                                </div>
                              )}
                              {stk.reviewedBy && (
                                <span className="text-[10px] text-slate-400 block">
                                  Reviewed by: {stk.reviewedBy}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-3 text-center">
                          {t("passport.noStickers")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
