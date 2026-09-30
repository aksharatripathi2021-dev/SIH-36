import { VerificationObservation, VerificationOutcome } from "../types";
import { applicationService } from "./applicationService";
import { certificateService } from "./certificateService";
import { notificationService } from "./notificationService";
import { storageService } from "./storageService";

export const verificationService = {
  /**
   * Get observation records for an application
   */
  async getVerificationObservation(applicationId: string): Promise<VerificationObservation | null> {
    const list = storageService.getVerificationResults();
    const item = list.find((v) => v.applicationId === applicationId);
    return item ? { ...item, evidenceFiles: item.evidenceFiles.map((f) => ({ ...f })) } : null;
  },

  /**
   * Save verification draft in demo storage
   */
  async saveDraftVerification(
    applicationId: string,
    observations: Partial<VerificationObservation>
  ): Promise<VerificationObservation> {
    const list = storageService.getVerificationResults();
    const index = list.findIndex((v) => v.applicationId === applicationId);

    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...observations
      };
      storageService.saveVerificationResults(list);
      return { ...list[index] };
    }

    const newRecord: VerificationObservation = {
      applicationId,
      instrumentId: observations.instrumentId || "W-104",
      verifierRole: observations.verifierRole || "LMO",
      verifierId: observations.verifierId || "user-lmo-1",
      testStandard: observations.testStandard || "OIML R76-1",
      referenceWeights: observations.referenceWeights || "20 kg / 50 kg / 100 kg",
      zeroError: observations.zeroError || "0.00 kg",
      repeatabilityError: observations.repeatabilityError || "0.02%",
      eccentricityError: observations.eccentricityError || "0.01%",
      condition: observations.condition || "Good",
      sealIntact: observations.sealIntact ?? true,
      calibrationStickerPresent: observations.calibrationStickerPresent ?? true,
      overallResult: observations.overallResult || "Pass",
      evidenceFiles: observations.evidenceFiles || [],
      submittedAt: "12 Jun 2025"
    };

    list.push(newRecord);
    storageService.saveVerificationResults(list);
    return { ...newRecord };
  },

  /**
   * Submit the final verification outcome (Pass / Fail workflow orchestration)
   */
  async submitVerificationResult(
    applicationId: string,
    observations: Partial<VerificationObservation>
  ): Promise<VerificationObservation> {
    const outcome: VerificationOutcome = observations.overallResult || "Pass";

    // 1. Save or update the observation result record
    const saved = await this.saveDraftVerification(applicationId, {
      ...observations,
      overallResult: outcome,
      nextAction: outcome === "Pass" ? "Certificate processing" : "Correction required",
      submittedAt: "12 Jun 2025"
    });

    // Lookup application details
    const app = await applicationService.getApplicationById(applicationId);
    const instrumentName = app?.instrumentName || "Platform Weighing Scale W-104";
    const ownerName = app?.ownerName || "Bharat Mart Pvt Ltd";

    // 2. Transition application to Result Submitted
    await applicationService.transitionApplicationStatus(applicationId, "Result Submitted");

    if (outcome === "Pass") {
      // 3. Create certificate exactly once through certificateService
      const cert = await certificateService.issueCertificate({
        applicationId,
        instrumentId: app?.instrumentId || observations.instrumentId || "W-104",
        ownerId: app?.ownerId || "user-owner-1",
        instrumentName,
        ownerName,
        issuingAuthority:
          observations.verifierRole === "GATC"
            ? "GATC Delhi Laboratory"
            : "Delhi South Legal Metrology Office"
      });

      // 4 & 5. Attach certificateId and transition application to Certificate Generated
      await applicationService.transitionApplicationStatus(applicationId, "Certificate Generated", {
        certificateId: cert.certificateId
      });

      // 6. Create enhanced certificate and QR notification for trader
      await notificationService.addNotification({
        title: "Certificate & QR Code Available",
        message: `Digital Verification Certificate ${cert.certificateId} has been generated for ${instrumentName}. Your verification QR code is ready — please view, print the QR sticker, and confirm placement at your shop.`,
        type: "success",
        link: "/owner/certificates"
      });
    } else {
      // Outcome is Fail:
      // 3. Transition to Needs Correction
      await applicationService.transitionApplicationStatus(applicationId, "Needs Correction");

      // 4. Create correction-required notification
      await notificationService.addNotification({
        title: "Correction Required",
        message: `Verification for ${instrumentName} failed standard tolerances. Please submit re-calibration correction.`,
        type: "warning",
        link: `/owner/applications/${applicationId}`
      });
      // Do NOT create certificate, do NOT attach certificateId
    }

    return saved;
  },

  /**
   * Flag application for correction directly (e.g. from officer review)
   */
  async markNeedsCorrection(applicationId: string, remarks?: string): Promise<void> {
    await this.submitVerificationResult(applicationId, {
      overallResult: "Fail",
      officerNotes: remarks || "Tolerances out of permissible range. Re-calibration required."
    });
  },

  /**
   * Reset in-memory / persisted state back to original baseline
   */
  async resetState(): Promise<void> {
    storageService.resetDemoState();
  }
};
