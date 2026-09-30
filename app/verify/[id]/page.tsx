"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { InstitutionalHeader } from "@/app/components/InstitutionalHeader";
import { certificateService } from "@/services/certificateService";
import { qrService } from "@/services/qrService";
import { pdfService } from "@/services/pdfService";
import { Certificate } from "@/types";
import { useTranslation } from "@/i18n";

function CertificateQrDisplay({ certificate }: { certificate: Certificate }) {
  const [qrSrc, setQrSrc] = useState<string>(certificate.qrCodeDataUrl || "");

  useEffect(() => {
    if (!qrSrc && certificate.certificateId) {
      qrService.generateCertificateQrDataUrl(certificate.certificateId).then((url) => {
        if (url) setQrSrc(url);
      });
    }
  }, [certificate.certificateId, qrSrc]);

  if (qrSrc) {
    return (
      <img
        src={qrSrc}
        alt={`Verification QR for ${certificate.certificateId}`}
        className="w-36 h-36 object-contain bg-white rounded p-1"
      />
    );
  }

  return (
    <div className="w-36 h-36 flex items-center justify-center bg-white rounded border border-slate-200 text-xs text-slate-400">
      Generating QR…
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">{label}</span>
      <span className={`mt-0.5 block text-sm font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

export default function PublicVerifyByIdPage() {
  const { t } = useTranslation();
  const params = useParams();
  const idParam = (params?.id as string) || "CERT-LM-2026-00124";

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (idParam) {
      certificateService.verifyPublicCertificate(idParam).then((cert) => {
        setCertificate(cert ?? null);
        setLoading(false);
      });
    }
  }, [idParam]);

  const isCertValid = certificate?.status === "VALID";
  const statusColorClass = isCertValid
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : certificate?.status === "EXPIRED"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-rose-50 border-rose-200 text-[#801424]";

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col font-sans">
      <InstitutionalHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Official Metrological Registry
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0D1B2A] mt-1">
              e-Tarazu — Public Legal Metrology Verification
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory certificate authenticity verification under Legal Metrology Act, 2009.
            </p>
          </div>

          <Link
            href="/verify-certificate"
            className="text-xs font-semibold text-[#801424] hover:underline"
          >
            ← Search Another Certificate
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            Verifying certificate integrity against central registry…
          </div>
        ) : certificate ? (
          <div className="space-y-6">
            {/* Status card */}
            <div className={`p-6 rounded-xl border ${statusColorClass} shadow-xs`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Authentic Statutory Record
                    </span>
                    <span className="text-xs font-semibold">Status: {certificate.status}</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mt-1 text-[#0D1B2A]">
                    {certificate.certificateId}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Digitally signed by <strong>{certificate.issuingAuthority}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => pdfService.downloadCertificate(certificate)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Download Official PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => qrService.printQrSticker(certificate.certificateId, certificate)}
                    className="px-3.5 py-2 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🖨️</span>
                    <span>Print QR Sticker</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Certificate content grid */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: QR code */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
                <CertificateQrDisplay certificate={certificate} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-3">
                  Scan to Re-verify
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-700 mt-0.5">
                  {certificate.certificateId}
                </span>
              </div>

              {/* Middle and Right Columns: Details */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow label="Business / Trader Name" value={certificate.ownerName} />
                <DetailRow label="Instrument Description" value={certificate.instrumentName} />
                <DetailRow label="Instrument ID / Serial" value={certificate.instrumentId || "N/A"} />
                <DetailRow label="Application Reference" value={certificate.applicationId || "N/A"} />
                <DetailRow label="Verification Date" value={certificate.issuedDate} highlight />
                <DetailRow label="Valid Until" value={certificate.validUntil} highlight />
                <div className="sm:col-span-2">
                  <DetailRow label="Issuing Authority" value={certificate.issuingAuthority} />
                </div>
              </div>
            </div>

            {/* Public assurance footer */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] text-slate-500 flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">ℹ️</span>
              <div>
                <strong className="text-slate-700">Public Metrological Assurance:</strong> This electronic certificate is generated under the statutory authority of the Department of Consumer Affairs, Government of India. The instrument specified above has been verified and stamped in accordance with Section 24 of the Legal Metrology Act, 2009.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-rose-200 p-12 text-center shadow-xs space-y-3">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-lg font-bold text-slate-900">Certificate Not Found</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No verified certificate could be located matching identifier <strong>{idParam}</strong> in the central metrology registry.
            </p>
            <div className="pt-2">
              <Link
                href="/verify-certificate"
                className="px-4 py-2 bg-[#801424] text-white text-xs font-semibold rounded-md shadow-xs inline-block"
              >
                Go to Verification Search
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
