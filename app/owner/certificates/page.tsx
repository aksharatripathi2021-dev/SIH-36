"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { certificateService } from "@/services/certificateService";
import { qrStickerService } from "@/services/qrStickerService";
import { qrService } from "@/services/qrService";
import { pdfService } from "@/services/pdfService";
import { authService } from "@/services/authService";
import { Certificate, QRStickerConfirmation, UserProfile, VerificationEvidence } from "@/types";
import { useTranslation } from "@/i18n";

export default function OwnerCertificatesPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stickerMap, setStickerMap] = useState<Record<string, QRStickerConfirmation | null>>({});
  const [loading, setLoading] = useState(true);

  // Sticker Confirmation Modal State
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [photoFilename, setPhotoFilename] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Certificate Detail Modal State
  const [viewCert, setViewCert] = useState<Certificate | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const active = await authService.getCurrentUser();
    setCurrentUser(active);

    const allCerts = await certificateService.getAllCertificates();
    // Data isolation: Only certificates belonging to the current Trader
    const ownerCerts = allCerts.filter((c) => c.ownerId === active.id);
    setCertificates(ownerCerts);

    // Load sticker confirmations for each certificate
    const map: Record<string, QRStickerConfirmation | null> = {};
    for (const cert of ownerCerts) {
      const conf = await qrStickerService.getStickerConfirmationByCertificateId(cert.certificateId);
      map[cert.certificateId] = conf;
    }
    setStickerMap(map);
    setLoading(false);
  };

  const handleOpenStickerModal = (cert: Certificate) => {
    setSelectedCert(cert);
    const existing = stickerMap[cert.certificateId];
    if (existing?.status === "PENDING") {
      setPhotoDataUrl(existing.evidence.url);
      setPhotoFilename(existing.evidence.filename);
    } else {
      setPhotoDataUrl("");
      setPhotoFilename("");
    }
    setUploadError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      setPhotoDataUrl(res);
      setPhotoFilename(file.name);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSetSamplePhoto = () => {
    // Standard mock verification sticker photo data URL (SVG encoded)
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#e2e8f0"/><rect x="20" y="20" width="360" height="260" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><text x="50%" y="40" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">Physical Verification QR Display</text><rect x="140" y="60" width="120" height="120" fill="#0d1b2a" rx="4"/><rect x="150" y="70" width="100" height="100" fill="#ffffff"/><rect x="160" y="80" width="80" height="80" fill="#0d1b2a"/><text x="50%" y="210" font-family="monospace" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="middle">${selectedCert?.certificateId || "CERT"}</text><text x="50%" y="235" font-family="sans-serif" font-size="11" fill="#16a34a" text-anchor="middle">Affixed to Scale Display</text><text x="50%" y="255" font-family="sans-serif" font-size="10" fill="#64748b" text-anchor="middle">Shop Front Counter • Delhi South</text></svg>`;
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;
    setPhotoDataUrl(encoded);
    setPhotoFilename("shop_sticker_proof.svg");
    setUploadError(null);
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl("");
    setPhotoFilename("");
    setUploadError(null);
  };

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCert || !currentUser) return;

    if (!photoDataUrl) {
      setUploadError("Photographic evidence is required. Please upload or capture a photo.");
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    try {
      const evidence: VerificationEvidence = {
        id: `EVD-${Date.now().toString().slice(-4)}`,
        filename: photoFilename || "shop_qr_sticker.jpg",
        type: "image",
        url: photoDataUrl
      };

      const res = await qrStickerService.createStickerConfirmation({
        certificateId: selectedCert.certificateId,
        ownerId: currentUser.id,
        evidence
      });

      // Update local map
      setStickerMap((prev) => ({
        ...prev,
        [selectedCert.certificateId]: res
      }));

      setSelectedCert(null);
      setPhotoDataUrl("");
      setPhotoFilename("");
    } catch (err: any) {
      setUploadError(err.message || "Failed to submit sticker confirmation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <OwnerSidebar
        activeItem="certificates"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("certificate.repository")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/owner/dashboard" },
            { label: t("certificate.repository") }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t("certificate.myCertificates")}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Digital verification certificates recorded under the Legal Metrology framework for{" "}
                <strong className="text-slate-800">{currentUser?.organization || currentUser?.name || "Your Business"}</strong>.
              </p>
            </div>
          </div>

          {/* Certificates Table Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                {t("common.loading")}
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 text-xl">
                  📜
                </div>
                <h3 className="text-sm font-bold text-slate-800">{t("certificate.noCertificates")}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Certificates are issued automatically by the Legal Metrology Officer or GATC laboratory upon successful verification of an instrument.
                </p>
                <Link
                  href="/owner/applications"
                  className="inline-block mt-2 px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs font-semibold rounded-md transition-colors"
                >
                  View Active Applications
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Certificate ID</th>
                      <th className="py-3 px-4">Instrument</th>
                      <th className="py-3 px-4">{t("certificate.issuedOn")}</th>
                      <th className="py-3 px-4">{t("certificate.validUntil")}</th>
                      <th className="py-3 px-4">{t("common.status")}</th>
                      <th className="py-3 px-4">{t("certificate.stickerStatus")}</th>
                      <th className="py-3 px-4 text-right">{t("common.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certificates.map((cert) => {
                      const sticker = stickerMap[cert.certificateId];
                      const stickerStatus = sticker ? sticker.status : "No submission";

                      return (
                        <tr key={cert.certificateId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-800 whitespace-nowrap">
                            {cert.certificateId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{cert.instrumentName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">App: {cert.applicationId}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {cert.issuedDate}
                          </td>
                          <td className="py-3.5 px-4 text-emerald-700 font-medium whitespace-nowrap">
                            {cert.validUntil}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={cert.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              <StatusBadge status={stickerStatus} size="sm" />
                              {sticker?.status === "CORRECTION_REQUIRED" && sticker.reviewerComment && (
                                <span className="text-[10px] text-rose-600 font-medium max-w-xs truncate" title={sticker.reviewerComment}>
                                  Note: {sticker.reviewerComment}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View Certificate */}
                              <button
                                type="button"
                                onClick={() => setViewCert(cert)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors"
                                title={t("certificate.viewCertificate")}
                              >
                                {t("common.view")}
                              </button>

                              {/* Download Certificate */}
                              <button
                                type="button"
                                onClick={() => pdfService.downloadCertificate(cert)}
                                className="p-1.5 bg-[#0D1B2A] hover:bg-[#1E2E42] text-white rounded transition-colors"
                                title={t("certificate.downloadPrintable")}
                              >
                                📥
                              </button>

                              {/* Print Certificate */}
                              <button
                                type="button"
                                onClick={() => pdfService.printCertificate(cert)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                                title={t("certificate.printCertificate")}
                              >
                                🖨️
                              </button>

                              {/* Print QR Sticker */}
                              <button
                                type="button"
                                onClick={() => qrService.printQrSticker(cert.certificateId, cert)}
                                className="px-2 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 font-medium text-xs rounded transition-colors"
                                title={t("certificate.printQr")}
                              >
                                🏷️ {t("certificate.printQr")}
                              </button>

                              {/* Download QR Image */}
                              <button
                                type="button"
                                onClick={() => qrService.downloadQrImage(cert.certificateId)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded transition-colors"
                                title={t("certificate.downloadQr")}
                              >
                                📱
                              </button>

                              {/* Confirm QR Displayed / Resubmit */}
                              <button
                                type="button"
                                onClick={() => handleOpenStickerModal(cert)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded shadow-2xs transition-colors ${
                                  stickerStatus === "CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                    : stickerStatus === "CORRECTION_REQUIRED"
                                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                                    : stickerStatus === "PENDING"
                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                    : "bg-[#801424] hover:bg-[#6D0E1C] text-white"
                                }`}
                              >
                                {stickerStatus === "CORRECTION_REQUIRED"
                                  ? "Resubmit Photo"
                                  : stickerStatus === "CONFIRMED"
                                  ? "Update Photo"
                                  : stickerStatus === "PENDING"
                                  ? "Review Pending"
                                  : t("certificate.confirmQrDisplayed")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Modal 1: QR Sticker Photographic Confirmation ─── */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {t("certificate.confirmQrDisplayed")}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedCert.certificateId} • {selectedCert.instrumentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* If correction required, show reviewer comment */}
            {stickerMap[selectedCert.certificateId]?.status === "CORRECTION_REQUIRED" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                <span className="font-bold text-rose-800 flex items-center gap-1">
                  <span>⚠️</span> Correction Requested by Legal Metrology Officer:
                </span>
                <p className="text-rose-700 font-medium">
                  &quot;{stickerMap[selectedCert.certificateId]?.reviewerComment}&quot;
                </p>
                <p className="text-[10px] text-rose-500">
                  Please upload a clear photograph showing the physical QR sticker correctly affixed to the instrument display.
                </p>
              </div>
            )}

            {/* Statutory QR Instructions */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-lg p-3 text-xs text-sky-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span>📋</span>
                <span>{t("certificate.qrInstructions")}</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                {t("certificate.qrPlacementNote")}
              </p>
            </div>

            {/* Photo Upload & Preview Form */}
            <form onSubmit={handleSubmitConfirmation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("certificate.uploadPhoto")} <span className="text-rose-500">*</span>
                </label>

                {!photoDataUrl ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3 hover:border-slate-400 transition-colors">
                    <div className="text-3xl text-slate-400">📷</div>
                    <div className="text-xs text-slate-600">
                      Upload photographic proof showing the verification QR sticker affixed to the verified instrument.
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 bg-[#0D1B2A] hover:bg-[#1E2E42] text-white text-xs font-semibold rounded cursor-pointer transition-colors">
                        Browse Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSetSamplePhoto}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
                      >
                        Use Sample Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative border border-slate-200 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center max-h-56">
                      <img
                        src={photoDataUrl}
                        alt="Shop QR placement preview"
                        className="max-h-56 object-contain"
                      />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <label className="px-2 py-1 bg-black/70 hover:bg-black text-white text-[11px] font-medium rounded cursor-pointer backdrop-blur-xs">
                          {t("certificate.replacePhoto")}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2 py-1 bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-medium rounded"
                        >
                          {t("certificate.removePhoto")}
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="truncate">{photoFilename || "Photo loaded"}</span>
                      <span className="text-emerald-600 font-semibold shrink-0">✓ Image ready</span>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5">{uploadError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!photoDataUrl || isSubmitting}
                  className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] disabled:bg-slate-300 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Submitting…</span>
                  ) : (
                    <span>{t("certificate.submitConfirmation")}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Certificate Detail Modal ─── */}
      {viewCert && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                  {t("certificate.prototypeNotice")}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {t("certificate.digitalTitle")} #{viewCert.certificateId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewCert(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Certificate Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Instrument</span>
                <div className="font-bold text-slate-900">{viewCert.instrumentName}</div>
                <div className="text-[11px] text-slate-400 font-mono">ID: {viewCert.instrumentId || "W-104"}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Trader / Establishment</span>
                <div className="font-bold text-slate-900">{viewCert.ownerName}</div>
                <div className="text-[11px] text-slate-400 font-mono">App ID: {viewCert.applicationId}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Verification Date</span>
                <div className="font-bold text-slate-900">{viewCert.issuedDate}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Valid Until</span>
                <div className="font-bold text-emerald-700">{viewCert.validUntil}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 sm:col-span-2">
                <span className="text-slate-500 font-medium">Issuing Authority</span>
                <div className="font-bold text-slate-900">{viewCert.issuingAuthority || "Legal Metrology Office"}</div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
              <Link
                href={`/verify-certificate?id=${viewCert.certificateId}`}
                target="_blank"
                className="text-xs text-sky-800 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Open Public Verification Page</span>
                <span>↗</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => pdfService.downloadCertificate(viewCert)}
                  className="px-3.5 py-1.5 bg-[#0D1B2A] hover:bg-[#1E2E42] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📥</span>
                  <span>{t("certificate.downloadPrintable")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => pdfService.printCertificate(viewCert)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🖨️</span>
                  <span>{t("common.print")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
