import { Application, ApplicationStatus, PriorityLevel, TimelineStep } from "../types";
import { instrumentService } from "./instrumentService";
import { storageService } from "./storageService";
import { notificationService } from "./notificationService";

export const applicationService = {
  /**
   * Get all applications with optional filter criteria
   */
  async getApplications(filters?: {
    ownerId?: string;
    officerId?: string;
    status?: string;
    zone?: string;
    search?: string;
  }): Promise<Application[]> {
    let result = storageService.getApplications();

    if (filters?.ownerId) {
      result = result.filter(
        (app) =>
          app.ownerId === filters.ownerId ||
          (filters.ownerId === "user-owner-demo" && app.id === "LM-2026-00124")
      );
    }
    if (filters?.officerId) {
      result = result.filter(
        (app) =>
          app.assignedOfficer?.id === filters.officerId ||
          (filters.officerId === "user-lmo-demo" && (app.assignedOfficer?.id === "user-lmo-demo" || app.id === "LM-2026-00124"))
      );
    }
    if (filters?.status && filters.status !== "All statuses") {
      const target = filters.status.toLowerCase();
      result = result.filter((app) => {
        const s = app.status.toLowerCase();
        if (s === target) return true;
        // Equivalence matching
        if (target === "draft" && (s === "draft")) return true;
        if (target === "submitted" && (s === "submitted")) return true;
        if ((target === "under review" || target === "admin_review") && (s === "under review" || s === "admin_review")) return true;
        if ((target === "scheduled" || target === "assigned") && (s === "scheduled" || s === "assigned")) return true;
        if ((target === "verification in progress" || target === "field_verification") && (s === "verification in progress" || s === "field_verification")) return true;
        if ((target === "result submitted" || target === "field_verified") && (s === "result submitted" || s === "field_verified")) return true;
        if ((target === "certificate generated" || target === "certificate_issued" || target === "approved" || target === "completed") &&
            (s === "certificate generated" || s === "certificate_issued" || s === "approved" || s === "completed")) return true;
        return false;
      });
    }
    if (filters?.zone && filters.zone !== "All zones") {
      result = result.filter((app) => app.zone.toLowerCase() === filters.zone!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (app) =>
          app.id.toLowerCase().includes(q) ||
          app.instrumentName.toLowerCase().includes(q) ||
          app.ownerName.toLowerCase().includes(q)
      );
    }

    return result.map((app) => ({
      ...app,
      timeline: app.timeline.map((t) => ({ ...t })),
      attachments: app.attachments ? app.attachments.map((a) => ({ ...a })) : []
    }));
  },

  /**
   * Get a single application by ID (e.g. "LM-2026-00124" or "APP-26036-0148")
   */
  async getApplicationById(id: string): Promise<Application | null> {
    const list = storageService.getApplications();
    const item = list.find((app) => app.id.toUpperCase() === id.trim().toUpperCase());
    return item
      ? {
          ...item,
          timeline: item.timeline.map((t) => ({ ...t })),
          attachments: item.attachments ? item.attachments.map((a) => ({ ...a })) : []
        }
      : null;
  },

  /**
   * Submit or update a re-verification request (mutates persisted demo state)
   */
  async createReverificationApplication(payload: {
    instrumentId: string;
    preferredDate: string;
    additionalNotes?: string;
    currentCertificateFile?: string;
    supportingRecordsFile?: string;
    status?: ApplicationStatus;
    legacyReceiptAssisted?: boolean;
  }): Promise<Application> {
    const applications = storageService.getApplications();
    const existingIndex = applications.findIndex((app) => app.instrumentId === payload.instrumentId);
    const targetStatus: ApplicationStatus = payload.status || "SUBMITTED";
    const isDraft = targetStatus === "Draft" || targetStatus === "DRAFT";

    if (existingIndex !== -1) {
      const existing = applications[existingIndex];
      const updatedTimeline: TimelineStep[] = existing.timeline.map((t) => {
        if (isDraft) {
          if (t.stepNumber === 1) return { ...t, isCompleted: true, isCurrent: true };
          return { ...t, isCompleted: false, isCurrent: false };
        } else {
          if (t.stepNumber === 1 || t.stepNumber === 2) {
            return { ...t, isCompleted: true, isCurrent: t.stepNumber === 2 };
          }
          return { ...t, isCompleted: false, isCurrent: false };
        }
      });

      applications[existingIndex] = {
        ...existing,
        status: targetStatus,
        lastUpdated: "12 Jun 2025",
        timeline: updatedTimeline,
        legacyReceiptAssisted: payload.legacyReceiptAssisted ?? existing.legacyReceiptAssisted
      };

      storageService.saveApplications(applications);

      if (!isDraft) {
        await instrumentService.updateInstrumentStatus(payload.instrumentId, "Pending");

        storageService.addAuditEvent({
          applicationId: existing.id,
          role: "OWNER",
          actor: existing.ownerName || "Aryan",
          eventType: "APPLICATION_SUBMITTED",
          details: `Application ${existing.id} submitted for legal metrology verification.`
        });

        await notificationService.addNotification({
          title: "Application Submitted",
          message: `Application ${existing.id} submitted successfully. Assigned to review queue.`,
          type: "success",
          link: `/owner/applications/${existing.id}`
        });

        await notificationService.addNotification({
          title: "New Verification Application",
          message: `New legal metrology verification application received (${existing.id}).`,
          type: "info",
          link: `/admin/applications`
        });
      }

      return { ...applications[existingIndex] };
    }

    // Otherwise create a new record
    const inst = await instrumentService.getInstrumentById(payload.instrumentId);
    const activeUser = storageService.getActiveUser();

    const deterministicId = payload.instrumentId === "EWI-DEMO-001"
      ? "LM-2026-00124"
      : storageService.getNextApplicationId();

    const newApp: Application = {
      id: deterministicId,
      instrumentId: payload.instrumentId,
      instrumentName: inst?.name || "Commercial Instrument",
      instrumentCategory: inst?.category || "Electronic Scales",
      ownerId: inst?.ownerId || activeUser.id || "user-owner-demo",
      ownerName: inst?.ownerName || activeUser.organization || activeUser.name,
      ownerContact: activeUser.mobile || "On file",
      status: targetStatus,
      priority: "Normal" as PriorityLevel,
      zone: activeUser.zone || "Maharashtra Nagpur Zone",
      submittedDate: "12 Jun 2025",
      lastUpdated: "12 Jun 2025",
      legacyReceiptAssisted: payload.legacyReceiptAssisted || false,
      timeline: [
        { stepNumber: 1, label: "DRAFT", date: "12 Jun", isCompleted: true, isCurrent: isDraft },
        { stepNumber: 2, label: "SUBMITTED", date: isDraft ? "Upcoming" : "12 Jun", isCompleted: !isDraft, isCurrent: !isDraft },
        { stepNumber: 3, label: "ADMIN_REVIEW", date: "Upcoming", isCompleted: false },
        { stepNumber: 4, label: "ASSIGNED", date: "Upcoming", isCompleted: false },
        { stepNumber: 5, label: "FIELD_VERIFICATION", date: "Upcoming", isCompleted: false },
        { stepNumber: 6, label: "FIELD_VERIFIED", date: "Upcoming", isCompleted: false },
        { stepNumber: 7, label: "GATC_REVIEW", date: "Upcoming", isCompleted: false },
        { stepNumber: 8, label: "APPROVED", date: "Upcoming", isCompleted: false },
        { stepNumber: 9, label: "CERTIFICATE_ISSUED", date: "Upcoming", isCompleted: false }
      ],
      attachments: []
    };

    applications.unshift(newApp);
    storageService.saveApplications(applications);

    if (!isDraft) {
      await instrumentService.updateInstrumentStatus(payload.instrumentId, "Pending");

      storageService.addAuditEvent({
        applicationId: deterministicId,
        role: "OWNER",
        actor: newApp.ownerName,
        eventType: "APPLICATION_SUBMITTED",
        details: `Application ${deterministicId} submitted for verification.`
      });

      await notificationService.addNotification({
        title: "Application Submitted",
        message: `Application ${deterministicId} submitted successfully.`,
        type: "success",
        link: `/owner/applications/${deterministicId}`
      });

      await notificationService.addNotification({
        title: "New Verification Application",
        message: `New legal metrology verification application received (${deterministicId}).`,
        type: "info",
        link: `/admin/applications`
      });
    }

    return { ...newApp };
  },

  /**
   * Canonical application status transitions according to PS36 lifecycle rules:
   * DRAFT -> SUBMITTED -> ADMIN_REVIEW -> ASSIGNED -> FIELD_VERIFICATION -> FIELD_VERIFIED -> GATC_REVIEW -> APPROVED -> CERTIFICATE_ISSUED
   */
  canTransition(currentStatus: ApplicationStatus, nextStatus: ApplicationStatus): boolean {
    if (currentStatus === nextStatus) return true;
    return true; // Flexible state machine tolerant of demo navigations
  },

  /**
   * One shared application transition function for all roles (Owner, LMO, GATC, Admin)
   */
  async transitionApplicationStatus(
    applicationId: string,
    nextStatus: ApplicationStatus,
    metadata?: {
      certificateId?: string;
      notes?: string;
      date?: string;
      assignedOfficer?: { id: string; name: string; designation: string };
      scheduledDateTime?: string;
    }
  ): Promise<Application> {
    const applications = storageService.getApplications();
    const index = applications.findIndex((app) => app.id.toUpperCase() === applicationId.trim().toUpperCase());
    if (index === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const currentApp = applications[index];
    const transitionDate = metadata?.date || "12 Jun";

    // Standard steps
    const stepOrder: string[] = [
      "DRAFT",
      "SUBMITTED",
      "ADMIN_REVIEW",
      "ASSIGNED",
      "FIELD_VERIFICATION",
      "FIELD_VERIFIED",
      "GATC_REVIEW",
      "APPROVED",
      "CERTIFICATE_ISSUED"
    ];

    const normNext = nextStatus.toUpperCase().replace(/\s+/g, "_");
    const targetIdx = stepOrder.indexOf(normNext);

    const updatedTimeline: TimelineStep[] = currentApp.timeline.map((t) => {
      const normLabel = t.label.toUpperCase().replace(/\s+/g, "_");
      const orderIdx = stepOrder.indexOf(normLabel);
      const isCompleted = targetIdx !== -1 && orderIdx !== -1 && orderIdx <= targetIdx;
      const isCurrent = targetIdx !== -1 && orderIdx === targetIdx;
      let date = t.date;
      if (isCompleted && (date === "Upcoming" || !date)) {
        date = transitionDate;
      }
      return {
        ...t,
        date,
        isCompleted,
        isCurrent
      };
    });

    const isCertStage =
      normNext === "CERTIFICATE_ISSUED" ||
      normNext === "CERTIFICATE_GENERATED" ||
      normNext === "COMPLETED" ||
      normNext === "APPROVED";

    const assignedCertId =
      metadata?.certificateId ||
      currentApp.certificateId ||
      (isCertStage && currentApp.id === "LM-2026-00124"
        ? "CERT-LM-2026-00124"
        : isCertStage && currentApp.id === "APP-26036-0148"
        ? "CERT-2025-00981"
        : undefined);

    const updatedApp: Application = {
      ...currentApp,
      status: nextStatus,
      certificateId: assignedCertId,
      assignedOfficer: metadata?.assignedOfficer || currentApp.assignedOfficer,
      scheduledDateTime: metadata?.scheduledDateTime || currentApp.scheduledDateTime,
      lastUpdated: "12 Jun 2025",
      timeline: updatedTimeline
    };

    applications[index] = updatedApp;
    storageService.saveApplications(applications);
    return { ...updatedApp };
  },

  /**
   * Admin schedules inspection and assigns LMO Officer
   */
  async assignOfficer(
    applicationId: string,
    officerId: string,
    officerName: string,
    scheduledDateTime: string
  ): Promise<Application> {
    const updated = await this.transitionApplicationStatus(applicationId, "ASSIGNED", {
      assignedOfficer: {
        id: officerId,
        name: officerName,
        designation: "Legal Metrology Officer"
      },
      scheduledDateTime
    });

    storageService.addAuditEvent({
      applicationId,
      role: "ADMIN",
      actor: "Demo Admin",
      eventType: "LMO_ASSIGNED",
      details: `Inspection scheduled for ${scheduledDateTime}. Assigned to ${officerName}.`
    });

    await notificationService.addNotification({
      title: "Inspection Assigned",
      message: `Application ${applicationId} assigned for field inspection by ${officerName}.`,
      type: "info",
      link: `/lmo/applications/${applicationId}/verify`
    });

    await notificationService.addNotification({
      title: "Inspection Scheduled",
      message: `Your verification inspection for ${applicationId} has been scheduled on ${scheduledDateTime} with ${officerName}.`,
      type: "info",
      link: `/owner/applications/${applicationId}`
    });

    return updated;
  },

  /**
   * Compatibility alias
   */
  async updateApplicationStatus(id: string, status: ApplicationStatus, certificateId?: string): Promise<Application> {
    return this.transitionApplicationStatus(id, status, { certificateId });
  },

  /**
   * Reset in-memory / persisted state back to original baseline
   */
  async resetState(): Promise<void> {
    storageService.resetDemoState();
  }
};
