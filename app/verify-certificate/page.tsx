"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { InstitutionalHeader } from "@/app/components/InstitutionalHeader";
import { certificateService } from "@/services/certificateService";
import { qrService } from "@/services/qrService";
import { pdfService } from "@/services/pdfService";
import { Certificate } from "@/types";
import { useTranslation } from "@/i18n";

// ─── QR Code Image / SVG Component ─────────────────────────────────────────
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

  // Fallback to crisp SVG structure if image is loading
  return (
    <div className="w-36 h-36 flex items-center justify-center bg-white rounded border border-slate-200 text-xs text-slate-400">
      Generating QR…
    </div>
  );
}

// ─── Detail Row ───────────────────────────────────────────────────────────────
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

// ─── Main content ─────────────────────────────────────────────────────────────
function CertificateVerifierContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const certIdParam = searchParams.get("id") || "";

  const [searchQuery, setSearchQuery] = useState(certIdParam || "CERT-2025-00981");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [searchResult, setSearchResult] = useState<"idle" | "found" | "not_found">(
    certIdParam ? "found" : "idle"
  );
  const [showAccordion, setShowAccordion] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (certIdParam) loadCertificate(certIdParam);
  }, [certIdParam]);

  const loadCertificate = async (id: string) => {
    setSearching(true);
    const cert = await certificateService.verifyPublicCertificate(id);
    setCertificate(cert ?? null);
    setSearchResult(cert ? "found" : "not_found");
    setSearching(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;
    setSearchQuery(q);
    loadCertificate(q);
  };

  // Status visual attributes
  const isCertValid = certificate?.status === "VALID";
  const statusColorClass = isCertValid
    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
    : certificate?.status === "EXPIRED"
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-rose-50 border-rose-200 text-[#801424]";

  const statusLabel = certificate?.status === "VALID"
    ? t("certificate.valid")
    : certificate?.status === "EXPIRED"
    ? t("certificate.expired")
    : certificate?.status === "REVOKED"
    ? t("certificate.revoked")
    : certificate?.status
    ? t("certificate.invalid")
    : "";

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">

      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 flex items-center gap-1.5">
        <Link href="/" className="hover:text-slate-800">{t("nav.dashboard")}</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">{t("certificate.publicTitle")}</span>
      </nav>

      {/* ── Certificate Result Card ── */}
      {searchResult === "found" && certificate && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header strip */}
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {t("certificate.publicTitle")}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {t("certificate.publicSubtitle")}
              </p>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className={`flex items-center gap-2 border rounded-lg px-4 py-2 ${statusColorClass}`}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isCertValid ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  )}
                </svg>
                <div className="text-left">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t("common.status")}</div>
                  <div className="text-sm font-extrabold">{statusLabel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Body: QR + fields grid */}
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Real Dynamic QR Code block */}
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
              <CertificateQrDisplay certificate={certificate} />
              <span className="text-[11px] font-medium text-slate-500">Scan to verify</span>
              <span className="text-[10px] text-slate-400 font-mono">{certificate.certificateId}</span>
            </div>

            {/* Details grid */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow label="Certificate ID" value={certificate.certificateId} />
              <DetailRow label="Application ID" value={certificate.applicationId} />
              <DetailRow label="Instrument" value={certificate.instrumentName} />
              <DetailRow label="Owner / Business" value={certificate.ownerName} />
              <DetailRow label={t("certificate.issuedOn")} value={certificate.issuedDate} />
              <DetailRow label={t("certificate.validUntil")} value={certificate.validUntil} />
              <DetailRow label={t("certificate.issuingAuthority")} value={certificate.issuingAuthority} />
              <DetailRow label="Verification Result" value={certificate.result === "Pass" ? t("certificate.pass") : certificate.result === "Fail" ? t("certificate.fail") : certificate.result} highlight />
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => pdfService.downloadCertificate(certificate)}
                className="px-4 py-2 bg-[#0D1B2A] hover:bg-[#1B2A3D] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>📥</span>
                <span>{t("certificate.downloadPrintable")}</span>
              </button>
              <button
                type="button"
                onClick={() => pdfService.printCertificate(certificate)}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs text-slate-700 shadow-xs transition-colors cursor-pointer"
                title={t("common.print")}
              >
                🖨️
              </button>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Certificate status may change if the instrument expires or is suspended.</span>
            </p>
          </div>
        </div>
      )}

      {/* ── NOT FOUND state ── */}
      {searchResult === "not_found" && (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">Certificate Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No matching verification record for ID <strong className="font-mono">{searchQuery}</strong> in the public registry. Please check the certificate ID and try again.
          </p>
        </div>
      )}

      {/* ── Verify / Search form ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label htmlFor="cert-search" className="block text-xs font-bold text-slate-700 mb-1.5">
                {t("certificate.verifyAnother")}
              </label>
              <input
                id="cert-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Enter Certificate ID (e.g. CERT-2025-00981)"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#801424]/30 focus:border-[#801424] focus:bg-white uppercase font-mono transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="sm:self-end px-6 py-2.5 bg-[#801424] hover:bg-[#6b1020] disabled:opacity-60 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {searching ? t("common.loading") : t("common.search")}
            </button>
          </div>

          {/* Quick-fill hints */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-[10px] text-slate-400">Try:</span>
            {["CERT-2025-00981"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => { setSearchQuery(id); loadCertificate(id); }}
                className="text-[10px] font-mono text-[#801424] hover:underline cursor-pointer"
              >
                {id}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* ── Accordion: Expired certificate example ── */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <button
          type="button"
          id="accordion-toggle"
          onClick={() => setShowAccordion(!showAccordion)}
          className="w-full px-5 py-3.5 text-left text-xs font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          aria-expanded={showAccordion}
        >
          <span>ℹ️ &nbsp;Example: Expired certificate lookup</span>
          <span className={`text-slate-400 transition-transform duration-200 ${showAccordion ? "rotate-180" : ""}`}>▼</span>
        </button>
        {showAccordion && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-2">
            <p>
              Sample Expired Record: <strong className="font-mono">CERT-2023-00412</strong> — expired 31 Dec 2024.
            </p>
            <p>
              Instruments with expired certificates are prohibited from commercial transactions until re-verified
              by an authorized Legal Metrology Officer.
            </p>
          </div>
        )}
      </div>

      {/* ── Legal notice ── */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        This portal provides real-time verification against the National Weights & Measures registry maintained by
        the Department of Consumer Affairs, Government of India.
        <br />For disputes or corrections, contact your nearest Legal Metrology office.
      </p>
    </main>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
export default function PublicCertificateVerificationPage() {
  return (
    <div className="min-h-screen bg-[#F5F6F8] flex flex-col">
      <InstitutionalHeader />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
            Loading certificate verifier…
          </div>
        }
      >
        <CertificateVerifierContent />
      </Suspense>
      <footer className="w-full py-4 px-6 border-t border-slate-200 bg-white text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Content owned by Department of Consumer Affairs, Government of India</span>
        <span>Designed, Developed and Hosted by NIC</span>
      </footer>
    </div>
  );
}
