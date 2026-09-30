"use client";

import React, { useEffect, useState } from "react";
import { AppHeader } from "@/app/components/AppHeader";
import { LmoSidebar } from "@/app/components/LmoSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { qrStickerService } from "@/services/qrStickerService";
import { authService } from "@/services/authService";
import { QRStickerConfirmation, UserProfile } from "@/types";
import { useTranslation } from "@/i18n";
import { zonesMatch } from "@/utils/jurisdictionUtils";

export default function LmoQrConfirmationsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [confirmations, setConfirmations] = useState<QRStickerConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Review Modal State
  const [selectedItem, setSelectedItem] = useState<QRStickerConfirmation | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    let active = await authService.getCurrentUser();
    if (active.role !== "LMO") {
      const lmo = await authService.getUserByRole("LMO");
      if (lmo) active = lmo;
    }
    setCurrentUser(active);

    const all = await qrStickerService.getAllStickerConfirmations();
    // Strict LMO Jurisdiction: Officer can review sticker confirmations only within authorized zone
    const userZone = active.zone;
    const filtered = all.filter((c) => {
      if (!userZone) return true; // National/Admin fallback
      return zonesMatch(userZone, c.zone);
    });

    setConfirmations(filtered);
    setLoading(false);
  };

  const handleOpenReview = (item: QRStickerConfirmation) => {
    setSelectedItem(item);
    setReviewComment(item.reviewerComment || "");
    setReviewError(null);
  };

  const handleApprove = async () => {
    if (!selectedItem || !currentUser) return;
    setIsProcessing(true);
    setReviewError(null);

    try {
      const updated = await qrStickerService.approveStickerConfirmation(
        selectedItem.id,
        currentUser.id,
        reviewComment.trim() || undefined,
        currentUser.zone
      );

      setConfirmations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedItem(null);
    } catch (err: any) {
      setReviewError(err.message || "Failed to confirm QR placement.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!selectedItem || !currentUser) return;
    if (!reviewComment.trim()) {
      setReviewError(t("lmo.commentRequired"));
      return;
    }

    setIsProcessing(true);
    setReviewError(null);

    try {
      const updated = await qrStickerService.requestStickerCorrection(
        selectedItem.id,
        currentUser.id,
        reviewComment.trim(),
        currentUser.zone
      );

      setConfirmations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setSelectedItem(null);
    } catch (err: any) {
      setReviewError(err.message || "Failed to request correction.");
    } finally {
      setIsProcessing(false);
    }
  };

  const displayedConfirmations = confirmations.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <LmoSidebar
        activeItem="qr-confirmations"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("lmo.qrQueue")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/lmo/dashboard" },
            { label: t("lmo.qrQueue") }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t("lmo.qrQueue")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t("lmo.queueSubtitle")} Jurisdiction:{" "}
                <strong className="text-slate-800">South Delhi Zone</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-md px-3 py-1.5 text-slate-700 shadow-2xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ALL">All Statuses ({confirmations.length})</option>
                <option value="PENDING">
                  Pending Review ({confirmations.filter((c) => c.status === "PENDING").length})
                </option>
                <option value="CONFIRMED">
                  Confirmed ({confirmations.filter((c) => c.status === "CONFIRMED").length})
                </option>
                <option value="CORRECTION_REQUIRED">
                  Correction Required ({confirmations.filter((c) => c.status === "CORRECTION_REQUIRED").length})
                </option>
              </select>
            </div>
          </div>

          {/* Queue Table Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t("common.loading")}
              </div>
            ) : displayedConfirmations.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xl">
                  🔍
                </div>
                <h3 className="text-sm font-bold text-slate-800">No QR sticker confirmations found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When traders place physical QR stickers on their verified instruments and submit photographic proof, submissions appear in this work queue for verification.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Proof Photo</th>
                      <th className="py-3 px-4">Trader / Establishment</th>
                      <th className="py-3 px-4">Instrument</th>
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Submitted At</th>
                      <th className="py-3 px-4">{t("common.status")}</th>
                      <th className="py-3 px-4 text-right">{t("common.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedConfirmations.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(item)}
                            className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={item.evidence.url}
                              alt="Proof preview"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.establishmentName || "Trader"}</div>
                          <div className="text-[11px] text-slate-400">ID: {item.ownerId}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{item.instrumentName || "Instrument"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Inst: {item.instrumentId}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-sky-800 whitespace-nowrap">
                          {item.certificateId}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {item.submittedAt}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(item)}
                            className="px-3 py-1.5 bg-[#0D1B2A] hover:bg-[#1E2E42] text-white text-xs font-semibold rounded-md shadow-2xs transition-colors cursor-pointer"
                          >
                            {t("lmo.review")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Detail & Review Modal ─── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                  Verification Review • QR Confirmation #{selectedItem.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedItem.establishmentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Submission Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Certificate ID</span>
                <span className="font-mono font-bold text-sky-800 mt-0.5 block">{selectedItem.certificateId}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Application ID</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">{selectedItem.applicationId}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Instrument</span>
                <span className="font-bold text-slate-800 mt-0.5 block truncate">{selectedItem.instrumentName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={selectedItem.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Full Photographic Proof Display */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Submitted Photographic Evidence:
              </label>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center max-h-72">
                <img
                  src={selectedItem.evidence.url}
                  alt="Shop QR sticker proof"
                  className="max-h-72 object-contain"
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>File: {selectedItem.evidence.filename}</span>
                <span>Submitted: {selectedItem.submittedAt}</span>
              </div>
            </div>

            {/* Reviewer Comment Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("lmo.reviewComment")}{" "}
                <span className="text-slate-400 font-normal">
                  (Required for correction request)
                </span>
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  setReviewError(null);
                }}
                placeholder={t("lmo.enterComment")}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-800 placeholder:text-slate-400"
              />
              {reviewError && (
                <p className="text-xs text-rose-600 font-semibold mt-1">{reviewError}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors"
              >
                {t("common.close")}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRequestCorrection}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("lmo.requestCorrection")}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✓</span>
                  <span>{t("lmo.confirmPlacement")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
