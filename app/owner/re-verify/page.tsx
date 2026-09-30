"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { OwnerSidebar } from "@/app/components/OwnerSidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { LegacyReceiptAssistant } from "@/app/components/LegacyReceiptAssistant";
import { instrumentService } from "@/services/instrumentService";
import { authService } from "@/services/authService";
import { Instrument, UserProfile } from "@/types";
import { useTranslation } from "@/i18n";

export default function OwnerReverificationSelectPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceiptAssistant, setShowReceiptAssistant] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    const list = await instrumentService.getInstrumentsByOwner(user.id);
    setInstruments(list);
    setLoading(false);
  };

  const handleReceiptApply = (
    extracted: Record<string, string>,
    matchedInst?: Instrument | null
  ) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "pending_receipt_extraction",
        JSON.stringify({
          values: extracted,
          matchedInstrumentId: matchedInst?.id
        })
      );
    }
    if (matchedInst) {
      router.push(`/owner/re-verify/${matchedInst.id}?assisted=true`);
    } else {
      router.push("/owner/re-verify/W-104?assisted=true");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <OwnerSidebar
        activeItem="re-verification"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Re-verification"
          breadcrumbs={[
            { label: "Home", href: "/owner/dashboard" },
            { label: "Re-verification" }
          ]}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Select Instrument for Re-verification
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose a registered weighing or measuring instrument to initiate a statutory re-verification request.
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

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading instruments…</div>
            ) : (
              instruments.map((inst) => {
                const isExpiring = inst.currentStatus === "Expiring";
                return (
                  <div
                    key={inst.id}
                    className={`bg-white rounded-lg border p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isExpiring ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{inst.id}</span>
                        <StatusBadge status={inst.currentStatus} />
                        {isExpiring && (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            Expires in {inst.daysUntilExpiry} days
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{inst.name}</h3>
                      <p className="text-xs text-slate-500">
                        {inst.category} · {inst.capacity} · Manufacturer: {inst.manufacturer} {inst.model} · Expiry: {inst.certificateExpiryDate}
                      </p>
                    </div>

                    <Link
                      href={`/owner/re-verify/${inst.id}`}
                      className="px-4 py-2 bg-[#801424] hover:bg-[#6D0E1C] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer whitespace-nowrap"
                    >
                      <span>Apply for Re-verification</span>
                      <span>→</span>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
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
