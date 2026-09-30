import { Certificate, CertificateStatus, VerificationOutcome } from "../types";
import { storageService } from "./storageService";
import { qrService } from "./qrService";

export const certificateService = {
  /**
   * Get all certificates in the registry
   */
  async getAllCertificates(): Promise<Certificate[]> {
    return storageService.getCertificates();
  },

  /**
   * Look up a certificate by ID (e.g. "CERT-2025-00981")
   */
  async getCertificateById(certificateId: string): Promise<Certificate | null> {
    const list = storageService.getCertificates();
    const cert = list.find(
      (c) => c.certificateId.trim().toUpperCase() === certificateId.trim().toUpperCase()
    );
    return cert ? { ...cert } : null;
  },

  /**
   * Look up a certificate by application ID
   */
  async getCertificateByApplicationId(applicationId: string): Promise<Certificate | null> {
    const list = storageService.getCertificates();
    const cert = list.find((c) => c.applicationId === applicationId);
    return cert ? { ...cert } : null;
  },

  /**
   * Public QR / ID Verification entrypoint
   */
  async verifyPublicCertificate(certificateId: string): Promise<Certificate | null> {
    const trimmed = certificateId.trim().toUpperCase();
    const list = storageService.getCertificates();
    const cert = list.find((c) => c.certificateId.toUpperCase() === trimmed);
    return cert ? { ...cert } : null;
  },

  /**
   * Issue a new digital certificate in demo storage (Idempotent)
   */
  async issueCertificate(data: {
    applicationId: string;
    instrumentId?: string;
    ownerId?: string;
    instrumentName: string;
    ownerName: string;
    issuingAuthority?: string;
  }): Promise<Certificate> {
    const existing = await this.getCertificateByApplicationId(data.applicationId);
    if (existing) {
      return existing;
    }

    const certificates = storageService.getCertificates();
    const certId =
      data.applicationId === "LM-2026-00124"
        ? "CERT-LM-2026-00124"
        : data.applicationId === "APP-26036-0148"
        ? "CERT-2025-00981"
        : storageService.getNextCertificateId();

    const verificationUrl = qrService.getVerificationUrl(certId);
    const qrCodeDataUrl = await qrService.generateCertificateQrDataUrl(certId);

    const newCert: Certificate = {
      certificateId: certId,
      applicationId: data.applicationId,
      instrumentId: data.instrumentId || (data.applicationId === "LM-2026-00124" ? "EWI-DEMO-001" : "W-104"),
      ownerId: data.ownerId || (data.applicationId === "LM-2026-00124" ? "user-owner-demo" : "user-owner-1"),
      instrumentName: data.instrumentName,
      ownerName: data.ownerName,
      issuedDate: "12 Jun 2025",
      validUntil: "11 Jun 2026",
      issuingAuthority: data.issuingAuthority || "Legal Metrology Division, Department of Consumer Affairs",
      result: "Pass",
      status: "VALID" as CertificateStatus,
      verificationUrl,
      qrCodeDataUrl,
      downloadUrl: "#"
    };

    certificates.push(newCert);
    storageService.saveCertificates(certificates);
    return { ...newCert };
  },

  /**
   * Reset state back to original baseline
   */
  async resetState(): Promise<void> {
    storageService.resetDemoState();
  }
};
