"use client";

import React from "react";
import { ApplicationStatus, PriorityLevel, InstrumentStatus } from "@/types";
import { useTranslation } from "@/i18n";

interface StatusBadgeProps {
  status: ApplicationStatus | PriorityLevel | InstrumentStatus | string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { t } = useTranslation();
  let style = "bg-slate-100 text-slate-700 border-slate-200";
  let label = status;

  switch (status) {
    case "Draft":
    case "DRAFT":
      style = "bg-slate-100 text-slate-700 border-slate-200";
      label = t("status.draft") || "Draft";
      break;
    case "Submitted":
    case "SUBMITTED":
      style = "bg-sky-50 text-sky-700 border-sky-200";
      label = t("status.submitted") || "Submitted";
      break;
    case "Under Review":
    case "ADMIN_REVIEW":
      style = "bg-amber-50 text-amber-700 border-amber-200";
      label = "Admin Review";
      break;
    case "Scheduled":
    case "ASSIGNED":
      style = "bg-indigo-50 text-indigo-700 border-indigo-200";
      label = "Assigned";
      break;
    case "Verification In Progress":
    case "FIELD_VERIFICATION":
      style = "bg-teal-50 text-teal-700 border-teal-200";
      label = "Field Verification";
      break;
    case "Result Submitted":
    case "FIELD_VERIFIED":
      style = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
      label = "Field Verified";
      break;
    case "GATC_REVIEW":
      style = "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
      label = "GATC Review";
      break;
    case "Approved":
    case "APPROVED":
      style = "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
      label = "Approved";
      break;
    case "Certificate Generated":
    case "CERTIFICATE_ISSUED":
      style = "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
      label = "Certificate Issued";
      break;
    case "Rejected":
    case "REJECTED":
      style = "bg-rose-50 text-[#801424] border-rose-300 font-semibold";
      label = "Rejected";
      break;
    case "Completed":
      style = "bg-green-50 text-green-700 border-green-200 font-medium";
      label = t("status.completed") || "Completed";
      break;
    case "Needs Correction":
      style = "bg-rose-50 text-[#801424] border-rose-300 font-semibold";
      label = t("status.needsCorrection") || "Needs Correction";
      break;
    case "Verified":
      style = "bg-green-50 text-green-700 border-green-200 font-medium";
      label = t("status.verified");
      break;
    case "VALID":
      style = "bg-green-50 text-green-700 border-green-200 font-medium";
      label = t("certificate.valid");
      break;
    case "Pass":
      style = "bg-green-50 text-green-700 border-green-200 font-medium";
      label = t("certificate.pass");
      break;
    case "Fail":
      style = "bg-rose-50 text-[#801424] border-rose-300 font-semibold";
      label = t("certificate.fail");
      break;
    case "INVALID":
      style = "bg-rose-50 text-[#801424] border-rose-300 font-semibold";
      label = t("certificate.invalid");
      break;
    case "REVOKED":
      style = "bg-rose-50 text-[#801424] border-rose-300 font-semibold";
      label = t("certificate.revoked");
      break;
    case "EXPIRED":
      style = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
      label = t("certificate.expired");
      break;
    case "Expiring":
      style = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
      label = t("status.expiring");
      break;
    case "Expired":
      style = "bg-rose-50 text-rose-800 border-rose-200";
      label = t("status.expired");
      break;
    case "Pending":
    case "PENDING":
      style = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
      label = t("status.pending");
      break;
    case "Confirmed":
    case "CONFIRMED":
      style = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
      label = t("status.confirmed");
      break;
    case "CORRECTION_REQUIRED":
    case "Correction Required":
      style = "bg-rose-50 text-[#801424] border-rose-300 font-semibold";
      label = t("status.correctionRequired");
      break;
    case "No submission":
    case "NO_SUBMISSION":
      style = "bg-slate-100 text-slate-600 border-slate-200";
      label = t("certificate.noSubmission");
      break;
    case "High":
      style = "bg-amber-50 text-amber-800 border-amber-300 font-semibold";
      break;
    default:
      style = "bg-slate-100 text-slate-700 border-slate-200";
      break;
  }

  const sizeClass = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-medium select-none whitespace-nowrap ${sizeClass} ${style}`}
    >
      {label}
    </span>
  );
}
