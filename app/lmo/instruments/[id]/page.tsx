"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { LmoSidebar } from "@/app/components/LmoSidebar";
import { DigitalInstrumentPassportView } from "@/app/components/DigitalInstrumentPassportView";
import { instrumentPassportService } from "@/services/instrumentPassportService";
import { authService } from "@/services/authService";
import { InstrumentPassport, UserProfile } from "@/types";
import { useTranslation } from "@/i18n";

export default function LmoInstrumentPassportPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const instrumentId = (params?.id as string) || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [passport, setPassport] = useState<InstrumentPassport | null>(null);
  const [errorState, setErrorState] = useState<"NOT_FOUND" | "UNAUTHORIZED" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPassport();
  }, [instrumentId]);

  const loadPassport = async () => {
    setLoading(true);
    setErrorState(null);
    const user = await authService.getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      setErrorState("UNAUTHORIZED");
      setLoading(false);
      return;
    }

    const res = await instrumentPassportService.getInstrumentPassport(instrumentId, user);
    if (res.success) {
      setPassport(res.passport);
    } else {
      setErrorState(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <LmoSidebar
        activeItem="pending"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={t("passport.title")}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/lmo/dashboard" },
            { label: t("nav.assignedApplications"), href: "/lmo/applications" },
            { label: instrumentId }
          ]}
          searchPlaceholder="Search assigned applications..."
          avatarInitials={currentUser?.avatarInitials || "PS"}
          userName={currentUser?.name || "Priya Sharma"}
          notificationCount={2}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="animate-spin text-2xl">⏳</div>
              <p className="text-xs text-slate-500 font-medium">
                Loading Digital Instrument Passport...
              </p>
            </div>
          ) : errorState === "NOT_FOUND" ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
              <div className="text-4xl">🔍</div>
              <h2 className="text-base font-bold text-slate-900">
                {t("passport.notFound")}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                The instrument ID &quot;{instrumentId}&quot; could not be found in the registry.
              </p>
              <div className="pt-2">
                <Link
                  href="/lmo/applications"
                  className="px-4 py-2 bg-[#0D1B2A] text-white text-xs font-semibold rounded-lg inline-block"
                >
                  Back to Assigned Applications
                </Link>
              </div>
            </div>
          ) : errorState === "UNAUTHORIZED" ? (
            <div className="bg-white rounded-xl border border-rose-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
              <div className="text-4xl">🛡️</div>
              <h2 className="text-base font-bold text-[#801424]">
                {t("passport.accessDenied")}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Access is restricted to instruments within your authorized verification jurisdiction and active assignments.
              </p>
              <div className="pt-2">
                <Link
                  href="/lmo/applications"
                  className="px-4 py-2 bg-[#0D1B2A] text-white text-xs font-semibold rounded-lg inline-block"
                >
                  Back to Assigned Applications
                </Link>
              </div>
            </div>
          ) : passport ? (
            <DigitalInstrumentPassportView passport={passport} basePath="/lmo" />
          ) : null}
        </main>
      </div>
    </div>
  );
}
