"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { MinistrySidebar } from "@/app/components/MinistrySidebar";
import { StatusBadge } from "@/app/components/StatusBadge";
import { applicationService } from "@/services/applicationService";
import { storageService } from "@/services/storageService";
import { Application, AuditEvent } from "@/types";
import { useTranslation } from "@/i18n";

export default function AdminApplicationReviewPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const applicationId = (params?.id as string) || "LM-2026-00124";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment form state
  const [scheduledDateTime, setScheduledDateTime] = useState("12 Jun 2025 at 10:00");
  const [selectedOfficerId, setSelectedOfficerId] = useState("user-lmo-demo");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const officers = [
    { id: "user-lmo-demo", name: "Demo LMO Officer", zone: "Maharashtra Nagpur Zone", office: "Nagpur Inspection Division" },
    { id: "user-lmo-1", name: "Priya Sharma", zone: "Delhi South Zone", office: "Delhi South LMO Office" }
  ];

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
      if (app.scheduledDateTime) {
        setScheduledDateTime(app.scheduledDateTime);
      }
      if (app.assignedOfficer?.id) {
        setSelectedOfficerId(app.assignedOfficer.id);
      }
      const events = storageService.getAuditEvents(app.id);
      setAuditEvents(events);
    }
    setLoading(false);
  };

  const handleAssignInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setIsAssigning(true);
    const officer = officers.find((o) => o.id === selectedOfficerId) || officers[0];

    try {
      const updated = await applicationService.assignOfficer(
        application.id,
        officer.id,
        officer.name,
        scheduledDateTime
      );
      setApplication(updated);
      setAssignSuccess(true);
      const events = storageService.getAuditEvents(application.id);
      setAuditEvents(events);
    } catch (err) {
      console.error("Assignment failed:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-xs text-slate-400">
        Loading application details…
      </div>
    );
  }

  const isAssignedOrBeyond =
    application?.status === "ASSIGNED" ||
    application?.status === "Scheduled" ||
    application?.status === "FIELD_VERIFICATION" ||
    application?.status === "Verification In Progress" ||
    application?.status === "FIELD_VERIFIED" ||
    application?.status === "Result Submitted" ||
    application?.status === "GATC_REVIEW" ||
    application?.status === "APPROVED" ||
    application?.status === "CERTIFICATE_ISSUED" ||
    application?.status === "Certificate Generated" ||
    application?.status === "Completed";

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <MinistrySidebar
        activeItem="applications"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={`Review Application ${application?.id || applicationId}`}
          breadcrumbs={[
            { label: t("nav.dashboard"), href: "/admin/dashboard" },
            { label: "Applications", href: "/admin/applications" },
            { label: application?.id || applicationId }
          ]}
          avatarInitials="DA"
          userName="Demo Admin"
          notificationCount={3}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">
                    {application?.id || applicationId}
                  </span>
                  {application && <StatusBadge status={application.status} size="md" />}
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded uppercase">
                    {application?.priority || "High"} Priority
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pt-1">
                  {application?.instrumentName || "Electronic Weighing Instrument"}
                </h2>
                <p className="text-xs text-slate-500">
                  {application?.ownerName || "Aryan"} · Submitted {application?.submittedDate || "12 Jun 2025"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/applications"
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md shadow-2xs transition-colors"
                >
                  ← Back to Registry
                </Link>
              </div>
            </div>

            {/* Notification / Success alert */}
            {assignSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span className="font-semibold">
                    Inspection successfully assigned and scheduled! Status is now <strong>ASSIGNED</strong>.
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-mono">Synchronized to LMO Tab</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Trader & Instrument Review Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Trader Details Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span>🏢</span>
                  <span>Trader & Premises Verification</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Name</span>
                    <span className="font-semibold text-slate-800">{application?.ownerName || "Aryan"} · Supermarket</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Trader Contact</span>
                    <span className="font-medium text-slate-800">{application?.ownerContact || "9820011223"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Premises Location</span>
                    <span className="font-medium text-slate-800">{application?.location || "Supermarket, YCC Wanadongri, Nagpur"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Jurisdiction Zone</span>
                    <span className="font-medium text-slate-800">{application?.zone || "Maharashtra Nagpur Zone"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Submission Date</span>
                    <span className="font-medium text-slate-800">{application?.submittedDate || "12 Jun 2025"}</span>
                  </div>
                </div>
              </div>

              {/* Instrument Details Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Instrument Specification</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Instrument Name</span>
                    <span className="font-semibold text-slate-800">{application?.instrumentName || "Electronic Weighing Instrument"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Serial Number</span>
                    <span className="font-mono font-bold text-slate-900">{application?.instrumentId || "EWI-DEMO-001"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-medium text-slate-800">{application?.instrumentCategory || "Electronic Scales"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity</span>
                    <span className="font-medium text-slate-800">300 kg</span>
                  </div>
                </div>

                {application?.attachments && application.attachments.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Attached Records</span>
                    <div className="space-y-1.5">
                      {application.attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                          <span className="font-medium text-slate-700">📄 {att.title}</span>
                          <span className="text-[10px] text-slate-400">{att.fileSize || "PDF"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Audit Trail Card */}
              {auditEvents.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                    <span>📋</span>
                    <span>Application Audit Trail</span>
                  </h3>
                  <div className="space-y-2 text-xs">
                    {auditEvents.map((evt) => (
                      <div key={evt.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{evt.eventType}</span>
                          <span className="text-slate-400 font-mono">{evt.timestamp}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{evt.details}</p>
                        <span className="text-[10px] text-slate-400">Actor: {evt.actor} ({evt.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Inspection Scheduling & LMO Assignment */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAssignedOrBeyond ? "Inspection Assignment" : "Schedule & Assign Inspection"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign a certified Legal Metrology Officer (LMO) for physical field verification.
                  </p>
                </div>

                <form onSubmit={handleAssignInspection} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Inspection Date &amp; Time
                    </label>
                    <input
                      type="text"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      placeholder="e.g. 12 Jun 2025 at 10:00"
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#801424]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Deterministic date for demo execution</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Select Legal Metrology Officer
                    </label>
                    <select
                      value={selectedOfficerId}
                      onChange={(e) => setSelectedOfficerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-slate-800 font-medium focus:bg-white cursor-pointer"
                    >
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.office})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAssigning}
                      className="w-full py-2.5 px-4 bg-[#801424] hover:bg-[#6D0E1C] active:bg-[#580D18] disabled:opacity-70 text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{isAssigning ? "Saving..." : isAssignedOrBeyond ? "Update Assignment" : "Assign Inspection & Schedule"}</span>
                      <span>→</span>
                    </button>
                  </div>
                </form>

                {application?.assignedOfficer && (
                  <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs text-blue-900 space-y-1">
                    <span className="font-bold text-[11px] block uppercase text-blue-700">Currently Assigned</span>
                    <p className="font-semibold">{application.assignedOfficer.name}</p>
                    <p className="text-[11px] text-blue-800">{application.assignedOfficer.designation}</p>
                    <p className="text-[11px] text-blue-700 font-mono">Scheduled: {application.scheduledDateTime || scheduledDateTime}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
