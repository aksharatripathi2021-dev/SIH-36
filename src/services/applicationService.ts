import { Application, ApplicationStatus, PriorityLevel, TimelineStep } from "../types";
import { instrumentService } from "./instrumentService";
import { storageService } from "./storageService";

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
      result = result.filter((app) => app.ownerId === filters.ownerId);
    }
    if (filters?.officerId) {
      result = result.filter((app) => app.assignedOfficer?.id === filters.officerId);
    }
    if (filters?.status && filters.status !== "All statuses") {
      result = result.filter((app) => app.status.toLowerCase() === filters.status!.toLowerCase());
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
   * Get a single application by ID (e.g. "APP-26036-0148")
   */
  async getApplicationById(id: string): Promise<Application | null> {
    const list = storageService.getApplications();
    const item = list.find((app) => app.id === id);
    return item
      ? {
          ...item,
          timeline: item.timeline.map((t) => ({ ...t })),
          attachments: item.attachments ? item.attachments.map((a) => ({ ...a })) : []
        }
      : null;
  },

  /**
   * Submit a re-verification request (mutates persisted demo state)
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
    const targetStatus: ApplicationStatus = payload.status || "Submitted";
    const isDraft = targetStatus === "Draft";

    if (existingIndex !== -1) {
      // Update existing demo case
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
      }

      return { ...applications[existingIndex] };
    }

    // Otherwise create a new record with deterministic ID sequence looking up actual instrument
    const inst = await instrumentService.getInstrumentById(payload.instrumentId);
    const activeUser = storageService.getActiveUser();

    const deterministicId = storageService.getNextApplicationId();
    const newApp: Application = {
      id: deterministicId,
      instrumentId: payload.instrumentId,
      instrumentName: inst?.name || "Commercial Instrument",
      instrumentCategory: inst?.category || "Electronic Scales",
      ownerId: inst?.ownerId || activeUser.id || "user-owner-1",
      ownerName: inst?.ownerName || activeUser.organization || activeUser.name,
      ownerContact: activeUser.mobile || "On file",
      status: targetStatus,
      priority: "Normal" as PriorityLevel,
      zone: activeUser.zone || "Delhi South Zone",
      submittedDate: "12 Jun 2025",
      lastUpdated: "12 Jun 2025",
      legacyReceiptAssisted: payload.legacyReceiptAssisted || false,
      timeline: [
        { stepNumber: 1, label: "Draft", date: "12 Jun", isCompleted: true, isCurrent: isDraft },
        { stepNumber: 2, label: "Submitted", date: isDraft ? "Upcoming" : "12 Jun", isCompleted: !isDraft, isCurrent: !isDraft },
        { stepNumber: 3, label: "Under Review", date: "Upcoming", isCompleted: false },
        { stepNumber: 4, label: "Scheduled", date: "Upcoming", isCompleted: false },
        { stepNumber: 5, label: "Verification In Progress", date: "Upcoming", isCompleted: false },
        { stepNumber: 6, label: "Result Submitted", date: "Upcoming", isCompleted: false },
        { stepNumber: 7, label: "Certificate Generated", date: "Upcoming", isCompleted: false },
        { stepNumber: 8, label: "Completed", date: "Upcoming", isCompleted: false }
      ],
      attachments: []
    };

    applications.unshift(newApp);
    storageService.saveApplications(applications);
    if (!isDraft) {
      await instrumentService.updateInstrumentStatus(payload.instrumentId, "Pending");
    }
    return { ...newApp };
  },

  /**
   * Canonical application status transitions map according to PS36 lifecycle rules
   */
  canTransition(currentStatus: ApplicationStatus, nextStatus: ApplicationStatus): boolean {
    if (currentStatus === nextStatus) return true;

    const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      Draft: ["Submitted"],
      Submitted: ["Under Review"],
      "Under Review": ["Scheduled"],
      Scheduled: ["Verification In Progress"],
      "Verification In Progress": ["Result Submitted"],
      "Result Submitted": ["Certificate Generated", "Needs Correction"],
      "Needs Correction": ["Scheduled"],
      "Certificate Generated": ["Completed"],
      Completed: []
    };

    const nextAllowed = allowedTransitions[currentStatus] || [];
    return nextAllowed.includes(nextStatus);
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
    }
  ): Promise<Application> {
    const applications = storageService.getApplications();
    const index = applications.findIndex((app) => app.id === applicationId);
    if (index === -1) {
      throw new Error(`Application ${applicationId} not found.`);
    }

    const currentApp = applications[index];

    // Validate transition
    if (!this.canTransition(currentApp.status, nextStatus)) {
      console.warn(
        `[applicationService] Warning: Requested transition from "${currentApp.status}" to "${nextStatus}" for ${applicationId} is not in the standard workflow map, applying update.`
      );
    }

    // Step index mapping for timeline
    const stepOrder: ApplicationStatus[] = [
      "Draft",
      "Submitted",
      "Under Review",
      "Scheduled",
      "Verification In Progress",
      "Result Submitted",
      "Certificate Generated",
      "Completed"
    ];

    const transitionDate = metadata?.date || "12 Jun";
    const targetStepIndex = stepOrder.indexOf(nextStatus);

    let updatedTimeline: TimelineStep[] = [];

    if (nextStatus === "Needs Correction") {
      // Branch off: Keep up to Result Submitted completed, append or highlight Needs Correction
      updatedTimeline = currentApp.timeline.map((t) => {
        if (t.label === "Result Submitted") {
          return { ...t, isCompleted: true, isCurrent: false };
        }
        return { ...t, isCurrent: false };
      });
      // Set step 6 or 7 to indicate Needs Correction
      const needsCorrectionStepIndex = updatedTimeline.findIndex((t) => t.label === "Certificate Generated" || t.stepNumber === 7);
      if (needsCorrectionStepIndex !== -1) {
        updatedTimeline[needsCorrectionStepIndex] = {
          stepNumber: 7,
          label: "Needs Correction",
          date: transitionDate,
          isCompleted: false,
          isCurrent: true
        };
      }
    } else {
      updatedTimeline = currentApp.timeline.map((t) => {
        const orderIdx = stepOrder.indexOf(t.label);
        const isCompleted = targetStepIndex !== -1 && orderIdx !== -1 && orderIdx <= targetStepIndex;
        const isCurrent = targetStepIndex !== -1 && orderIdx === targetStepIndex;
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
    }

    const isCertStage =
      nextStatus === "Certificate Generated" ||
      nextStatus === "Completed";

    const assignedCertId =
      metadata?.certificateId ||
      currentApp.certificateId ||
      (isCertStage && currentApp.id === "APP-26036-0148" ? "CERT-2025-00981" : undefined);

    const updatedApp: Application = {
      ...currentApp,
      status: nextStatus,
      certificateId: assignedCertId,
      lastUpdated: "12 Jun 2025",
      timeline: updatedTimeline
    };

    applications[index] = updatedApp;
    storageService.saveApplications(applications);
    return { ...updatedApp };
  },

  /**
   * Compatibility alias pointing to canonical transitionApplicationStatus
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
