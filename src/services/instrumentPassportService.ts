import {
  Application,
  Certificate,
  Instrument,
  QRStickerConfirmation,
  QRStickerConfirmationStatus,
  UserProfile,
  VerificationObservation
} from "../types";
import { instrumentService } from "./instrumentService";
import { applicationService } from "./applicationService";
import { certificateService } from "./certificateService";
import { qrStickerService } from "./qrStickerService";
import { verificationService } from "./verificationService";
import { authService } from "./authService";
import { zonesMatch } from "../utils/jurisdictionUtils";

export type PassportTimelineEventType =
  | "INSTRUMENT_REGISTERED"
  | "APPLICATION_SUBMITTED"
  | "VERIFICATION_SCHEDULED"
  | "VERIFICATION_STARTED"
  | "RESULT_SUBMITTED"
  | "CERTIFICATE_GENERATED"
  | "QR_STICKER_SUBMITTED"
  | "QR_STICKER_CONFIRMED"
  | "QR_STICKER_CORRECTION_REQUIRED";

export interface PassportTimelineEvent {
  id: string;
  date: string;
  type: PassportTimelineEventType;
  title: string;
  description?: string;
  applicationId?: string;
  certificateId?: string;
  verificationId?: string;
  stickerConfirmationId?: string;
  status?: string;
}

export interface VerificationCycle {
  cycleId: string;
  cycleNumber: number;
  application: Application;
  verification?: VerificationObservation;
  certificate?: Certificate;
  stickerConfirmations: QRStickerConfirmation[];
  status: string;
  date: string;
}

export interface PassportSummary {
  totalApplications: number;
  totalVerifications: number;
  totalCertificates: number;
  currentCertificateId?: string;
  currentCertificateStatus?: string;
  latestApplicationId?: string;
  latestApplicationStatus?: string;
  latestVerificationDate?: string;
  latestCertificateDate?: string;
  currentQrStickerStatus?: QRStickerConfirmationStatus;
}

export interface InstrumentPassport {
  instrument: Instrument;
  owner?: UserProfile;
  summary: PassportSummary;
  timeline: PassportTimelineEvent[];
  cycles: VerificationCycle[];
  applications: Application[];
  certificates: Certificate[];
  stickerConfirmations: QRStickerConfirmation[];
}

export type PassportResolutionResult =
  | { success: true; passport: InstrumentPassport }
  | { success: false; error: "NOT_FOUND" | "UNAUTHORIZED" };

/**
 * Helper to normalize date strings for chronological sorting.
 */
function parseComparableDate(dateStr?: string): number {
  if (!dateStr || dateStr.toLowerCase() === "upcoming" || dateStr.toLowerCase() === "in progress") {
    return Number.MAX_SAFE_INTEGER;
  }
  // Try direct Date parsing
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;

  // Handle day-month formats like "08 Jun 2025" or "08 Jun"
  const parts = dateStr.split(" ");
  if (parts.length >= 2) {
    const year = parts.length === 3 ? parts[2] : "2025";
    const ts = Date.parse(`${parts[1]} ${parts[0]}, ${year}`);
    if (!isNaN(ts)) return ts;
  }
  return 0;
}

export const instrumentPassportService = {
  /**
   * Reconstruct the Digital Instrument Passport on-the-fly from existing canonical records.
   * Strictly enforces caller authorization:
   * - OWNER: only instruments matching currentUser.id
   * - LMO: instruments within officer's zone or assigned applications
   * - ADMIN: unrestricted
   * - PUBLIC: denied (public uses /verify-certificate?id=... only)
   */
  async getInstrumentPassport(
    instrumentId: string,
    currentUser: UserProfile
  ): Promise<PassportResolutionResult> {
    if (!currentUser || currentUser.role === "PUBLIC") {
      return { success: false, error: "UNAUTHORIZED" };
    }

    // 1. Retrieve canonical instrument
    const instrument = await instrumentService.getInstrumentById(instrumentId);
    if (!instrument) {
      return { success: false, error: "NOT_FOUND" };
    }

    // 2. Authorize scope
    if (currentUser.role === "OWNER") {
      if (instrument.ownerId !== currentUser.id) {
        return { success: false, error: "UNAUTHORIZED" };
      }
    } else if (currentUser.role === "LMO") {
      // Check zone matching or assignment
      const officerZone = currentUser.zone;
      const allApps = await applicationService.getApplications();
      const instrumentApps = allApps.filter((a) => a.instrumentId === instrument.id);

      const matchesOfficer =
        instrumentApps.some(
          (a) =>
            a.assignedOfficer?.id === currentUser.id ||
            (officerZone && zonesMatch(officerZone, a.zone))
        );

      // If officer has a restrictive zone and no applications match jurisdiction, deny
      if (officerZone && !matchesOfficer && instrumentApps.length > 0) {
        return { success: false, error: "UNAUTHORIZED" };
      }
    } else if (currentUser.role !== "ADMIN" && currentUser.role !== "GATC") {
      return { success: false, error: "UNAUTHORIZED" };
    }

    // 3. Resolve Owner Profile
    const owner = (await authService.getUserById(instrument.ownerId)) || undefined;

    // 4. Resolve Canonical Applications for this instrument
    const allApps = await applicationService.getApplications();
    const applications = allApps
      .filter((a) => a.instrumentId === instrument.id)
      .sort((a, b) => parseComparableDate(a.submittedDate) - parseComparableDate(b.submittedDate));

    // 5. Resolve Canonical Certificates for this instrument
    const allCerts = await certificateService.getAllCertificates();
    const certificates = allCerts
      .filter(
        (c) =>
          c.instrumentId === instrument.id ||
          applications.some((a) => a.id === c.applicationId || a.certificateId === c.certificateId)
      )
      .sort((a, b) => parseComparableDate(a.issuedDate) - parseComparableDate(b.issuedDate));

    // 6. Resolve Canonical Sticker Confirmations
    const allStickers = await qrStickerService.getAllStickerConfirmations();
    const stickerConfirmations = allStickers
      .filter(
        (s) =>
          s.instrumentId === instrument.id ||
          certificates.some((c) => c.certificateId === s.certificateId) ||
          applications.some((a) => a.id === s.applicationId)
      )
      .sort((a, b) => parseComparableDate(a.submittedAt) - parseComparableDate(b.submittedAt));

    // 7. Group into Verification Cycles
    const cycles: VerificationCycle[] = [];
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      const obs = await verificationService.getVerificationObservation(app.id);
      const cert = certificates.find(
        (c) => c.applicationId === app.id || c.certificateId === app.certificateId
      );
      const stickers = stickerConfirmations.filter(
        (s) => s.applicationId === app.id || (cert && s.certificateId === cert.certificateId)
      );

      cycles.push({
        cycleId: app.id,
        cycleNumber: i + 1,
        application: app,
        verification: obs || undefined,
        certificate: cert,
        stickerConfirmations: stickers,
        status: app.status,
        date: app.submittedDate
      });
    }

    // 8. Construct Chronological Timeline from actual canonical data only
    const timeline: PassportTimelineEvent[] = [];

    // Instrument Registration event (only if instrument exists)
    timeline.push({
      id: `EVT-REG-${instrument.id}`,
      date: instrument.lastVerifiedDate || (instrument.yearOfManufacture ? `01 Jan ${instrument.yearOfManufacture}` : "Initial Registration"),
      type: "INSTRUMENT_REGISTERED",
      title: "Instrument Registered",
      description: `${instrument.name} (${instrument.category}) registered with serial ${instrument.serialNumber}.`,
      status: instrument.currentStatus
    });

    // Cycle Events
    for (const cycle of cycles) {
      const app = cycle.application;

      // Application Submitted
      if (app.submittedDate) {
        timeline.push({
          id: `EVT-APP-${app.id}`,
          date: app.submittedDate,
          type: "APPLICATION_SUBMITTED",
          title: "Verification Application Submitted",
          description: `Application ${app.id} submitted (${app.priority} priority) for ${app.zone}.`,
          applicationId: app.id,
          status: app.status
        });
      }

      // Verification Scheduled
      const isScheduled =
        app.scheduledDateTime ||
        app.timeline?.find((t) => t.label === "Scheduled" && t.isCompleted);
      if (isScheduled) {
        const scheduledDate =
          app.scheduledDateTime ||
          app.timeline?.find((t) => t.label === "Scheduled")?.date ||
          app.lastUpdated;
        timeline.push({
          id: `EVT-SCHED-${app.id}`,
          date: scheduledDate,
          type: "VERIFICATION_SCHEDULED",
          title: "Verification Scheduled",
          description: app.assignedOfficer
            ? `Assigned to ${app.assignedOfficer.name} (${app.assignedOfficer.designation}).`
            : `Inspection scheduled for ${scheduledDate}.`,
          applicationId: app.id,
          status: "Scheduled"
        });
      }

      // Verification In Progress
      const isInProgress = app.timeline?.find(
        (t) => t.label === "Verification In Progress" && (t.isCompleted || t.isCurrent)
      );
      if (isInProgress) {
        timeline.push({
          id: `EVT-PROG-${app.id}`,
          date: isInProgress.date || app.lastUpdated,
          type: "VERIFICATION_STARTED",
          title: "Verification Started",
          description: "Physical verification and calibration inspection in progress.",
          applicationId: app.id,
          status: "Verification In Progress"
        });
      }

      // Result Submitted
      if (cycle.verification) {
        timeline.push({
          id: `EVT-RES-${app.id}`,
          date: cycle.verification.submittedAt || app.lastUpdated,
          type: "RESULT_SUBMITTED",
          title: `Result Submitted: ${cycle.verification.overallResult}`,
          description: `Standard: ${cycle.verification.testStandard}, Condition: ${cycle.verification.condition}, Observed Error: ${cycle.verification.observedErrorDisplay || cycle.verification.repeatabilityError}.`,
          applicationId: app.id,
          verificationId: `OBS-${app.id}`,
          status: cycle.verification.overallResult
        });
      }

      // Certificate Generated
      if (cycle.certificate) {
        timeline.push({
          id: `EVT-CERT-${cycle.certificate.certificateId}`,
          date: cycle.certificate.issuedDate,
          type: "CERTIFICATE_GENERATED",
          title: "Digital Verification Certificate Generated",
          description: `Certificate ${cycle.certificate.certificateId} issued. Valid until ${cycle.certificate.validUntil}.`,
          applicationId: app.id,
          certificateId: cycle.certificate.certificateId,
          status: cycle.certificate.status
        });
      }

      // Sticker confirmations
      for (const stk of cycle.stickerConfirmations) {
        timeline.push({
          id: `EVT-STK-SUB-${stk.id}`,
          date: stk.submittedAt,
          type: "QR_STICKER_SUBMITTED",
          title: "QR Sticker Evidence Submitted",
          description: `Shop photographic evidence submitted for certificate ${stk.certificateId}.`,
          applicationId: app.id,
          certificateId: stk.certificateId,
          stickerConfirmationId: stk.id,
          status: stk.status
        });

        if (stk.status === "CONFIRMED") {
          timeline.push({
            id: `EVT-STK-CONF-${stk.id}`,
            date: stk.reviewedAt || stk.submittedAt,
            type: "QR_STICKER_CONFIRMED",
            title: "QR Sticker Confirmed",
            description: `Placement verified by ${stk.reviewedBy || "LMO Officer"}.`,
            applicationId: app.id,
            certificateId: stk.certificateId,
            stickerConfirmationId: stk.id,
            status: "CONFIRMED"
          });
        } else if (stk.status === "CORRECTION_REQUIRED") {
          timeline.push({
            id: `EVT-STK-CORR-${stk.id}`,
            date: stk.reviewedAt || stk.submittedAt,
            type: "QR_STICKER_CORRECTION_REQUIRED",
            title: "QR Sticker Correction Required",
            description: stk.reviewerComment || "Please replace photo with clear visible placement on the instrument.",
            applicationId: app.id,
            certificateId: stk.certificateId,
            stickerConfirmationId: stk.id,
            status: "CORRECTION_REQUIRED"
          });
        }
      }
    }

    // Sort timeline chronologically
    timeline.sort((a, b) => parseComparableDate(a.date) - parseComparableDate(b.date));

    // 9. Compute Summary
    const activeCert =
      certificates.find((c) => c.status === "VALID") ||
      (certificates.length > 0 ? certificates[certificates.length - 1] : undefined);

    const latestApp = applications.length > 0 ? applications[applications.length - 1] : undefined;
    const latestCycle = cycles.length > 0 ? cycles[cycles.length - 1] : undefined;
    const latestSticker =
      stickerConfirmations.length > 0
        ? stickerConfirmations[stickerConfirmations.length - 1]
        : undefined;

    const summary: PassportSummary = {
      totalApplications: applications.length,
      totalVerifications: cycles.filter((c) => !!c.verification).length,
      totalCertificates: certificates.length,
      currentCertificateId: activeCert?.certificateId,
      currentCertificateStatus: activeCert?.status,
      latestApplicationId: latestApp?.id,
      latestApplicationStatus: latestApp?.status,
      latestVerificationDate:
        latestCycle?.verification?.submittedAt || latestApp?.scheduledDateTime,
      latestCertificateDate: activeCert?.issuedDate,
      currentQrStickerStatus: latestSticker?.status
    };

    return {
      success: true,
      passport: {
        instrument,
        owner,
        summary,
        timeline,
        cycles,
        applications,
        certificates,
        stickerConfirmations
      }
    };
  }
};
