import { QRStickerConfirmation, VerificationEvidence } from "../types";
import { storageService } from "./storageService";
import { certificateService } from "./certificateService";
import { applicationService } from "./applicationService";
import { notificationService } from "./notificationService";
import { zonesMatch } from "../utils/jurisdictionUtils";

export const qrStickerService = {
  /**
   * Submit or resubmit a QR sticker photographic confirmation.
   * Validates certificate existence, ownership, evidence, and maintains history.
   */
  async createStickerConfirmation(data: {
    certificateId: string;
    ownerId: string;
    evidence: VerificationEvidence;
  }): Promise<QRStickerConfirmation> {
    if (!data.evidence || !data.evidence.url) {
      throw new Error("Photographic evidence is required for QR sticker confirmation.");
    }

    // 1. Validate certificate
    const cert = await certificateService.getCertificateById(data.certificateId);
    if (!cert) {
      throw new Error(`Certificate "${data.certificateId}" not found.`);
    }

    // 2. Validate ownership (Trader A cannot submit for Trader B)
    if (cert.ownerId && cert.ownerId !== data.ownerId) {
      throw new Error("Access denied: You can only submit QR confirmation for your own certificates.");
    }

    // 3. Application and instrument consistency
    const app = await applicationService.getApplicationById(cert.applicationId);
    const instrumentId = cert.instrumentId || app?.instrumentId || "W-104";
    const instrumentName = cert.instrumentName || app?.instrumentName || "Platform Weighing Scale W-104";
    const establishmentName = cert.ownerName || app?.ownerName || "Establishment";
    const zone = app?.zone || "South Delhi Zone";

    // 4. Check existing confirmations
    const list = storageService.getStickerConfirmations();
    const existingActive = list.find(
      (c) => c.certificateId === cert.certificateId && c.status === "PENDING"
    );

    // If an existing confirmation is still PENDING, update its evidence rather than duplicating
    if (existingActive) {
      existingActive.evidence = data.evidence;
      existingActive.submittedAt = "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      storageService.saveStickerConfirmations(list);
      return { ...existingActive };
    }

    // Otherwise, create a new record (preserves previous CORRECTION_REQUIRED or CONFIRMED in history)
    const newId = storageService.getNextStickerConfirmationId();
    const nowTime = "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newConfirmation: QRStickerConfirmation = {
      id: newId,
      certificateId: cert.certificateId,
      instrumentId,
      applicationId: cert.applicationId,
      ownerId: data.ownerId,
      evidence: data.evidence,
      submittedAt: nowTime,
      status: "PENDING",
      establishmentName,
      instrumentName,
      zone
    };

    list.unshift(newConfirmation);
    storageService.saveStickerConfirmations(list);

    // Notify LMO queue
    await notificationService.addNotification({
      title: "QR Sticker Confirmation Submitted",
      message: `Photographic proof of QR sticker placement submitted for ${instrumentName} (${cert.certificateId}). Pending LMO review.`,
      type: "info",
      link: "/lmo/qr-confirmations"
    });

    return { ...newConfirmation };
  },

  /**
   * Get all sticker confirmations
   */
  async getAllStickerConfirmations(): Promise<QRStickerConfirmation[]> {
    return storageService.getStickerConfirmations();
  },

  /**
   * Get the most recent / active sticker confirmation for a certificate
   */
  async getStickerConfirmationByCertificateId(certificateId: string): Promise<QRStickerConfirmation | null> {
    const list = storageService.getStickerConfirmations();
    const matches = list.filter((c) => c.certificateId.trim().toUpperCase() === certificateId.trim().toUpperCase());
    if (matches.length === 0) return null;
    // The list has newest items first
    return { ...matches[0] };
  },

  /**
   * Get all sticker confirmation history for a certificate
   */
  async getStickerConfirmationHistory(certificateId: string): Promise<QRStickerConfirmation[]> {
    const list = storageService.getStickerConfirmations();
    return list.filter((c) => c.certificateId.trim().toUpperCase() === certificateId.trim().toUpperCase());
  },

  /**
   * Get sticker confirmations for a specific owner
   */
  async getStickerConfirmationsForOwner(ownerId: string): Promise<QRStickerConfirmation[]> {
    const list = storageService.getStickerConfirmations();
    return list.filter((c) => c.ownerId === ownerId);
  },

  /**
   * Get pending confirmations for LMO review, filtered by zone if applicable
   */
  async getPendingStickerConfirmationsForLmo(lmoId?: string, zone?: string): Promise<QRStickerConfirmation[]> {
    const list = storageService.getStickerConfirmations();
    return list.filter((c) => {
      if (c.status !== "PENDING") return false;
      if (zone) {
        if (!c.zone || !zonesMatch(zone, c.zone)) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * LMO confirms placement (PENDING -> CONFIRMED)
   */
  async approveStickerConfirmation(
    id: string,
    reviewerId: string,
    comment?: string,
    reviewerZone?: string
  ): Promise<QRStickerConfirmation> {
    const list = storageService.getStickerConfirmations();
    const item = list.find((c) => c.id === id);
    if (!item) {
      throw new Error(`QR sticker confirmation "${id}" not found.`);
    }

    // Strict Jurisdiction Check
    if (reviewerZone && item.zone && !zonesMatch(reviewerZone, item.zone)) {
      throw new Error(`Access denied: Sticker confirmation belongs to zone "${item.zone}", which is outside reviewer's authorized zone "${reviewerZone}".`);
    }

    item.status = "CONFIRMED";
    item.reviewedBy = reviewerId;
    item.reviewerRole = "LMO";
    item.reviewedAt = "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (comment) {
      item.reviewerComment = comment;
    }

    storageService.saveStickerConfirmations(list);

    // Notify Trader
    await notificationService.addNotification({
      title: "QR Sticker Placement Approved",
      message: `Your shop QR sticker placement for ${item.instrumentName || "instrument"} (${item.certificateId}) has been verified and confirmed.`,
      type: "success",
      link: "/owner/certificates"
    });

    return { ...item };
  },

  /**
   * LMO requests correction (PENDING -> CORRECTION_REQUIRED).
   * Reviewer comment is required.
   */
  async requestStickerCorrection(
    id: string,
    reviewerId: string,
    comment: string,
    reviewerZone?: string
  ): Promise<QRStickerConfirmation> {
    if (!comment || !comment.trim()) {
      throw new Error("A reviewer comment explaining the required correction is mandatory.");
    }

    const list = storageService.getStickerConfirmations();
    const item = list.find((c) => c.id === id);
    if (!item) {
      throw new Error(`QR sticker confirmation "${id}" not found.`);
    }

    // Strict Jurisdiction Check
    if (reviewerZone && item.zone && !zonesMatch(reviewerZone, item.zone)) {
      throw new Error(`Access denied: Sticker confirmation belongs to zone "${item.zone}", which is outside reviewer's authorized zone "${reviewerZone}".`);
    }

    item.status = "CORRECTION_REQUIRED";
    item.reviewedBy = reviewerId;
    item.reviewerRole = "LMO";
    item.reviewedAt = "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.reviewerComment = comment.trim();

    storageService.saveStickerConfirmations(list);

    // Notify Trader
    await notificationService.addNotification({
      title: "QR Sticker Correction Requested",
      message: `Correction requested for QR sticker (${item.certificateId}): "${comment.trim()}"`,
      type: "warning",
      link: "/owner/certificates"
    });

    return { ...item };
  }
};
