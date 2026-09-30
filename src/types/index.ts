// ==========================================
// PS36 TypeScript Data Types & Interfaces
// ==========================================

export type UserRole = 'OWNER' | 'LMO' | 'GATC' | 'ADMIN' | 'PUBLIC';

export type SupportedLanguage = "en" | "hi" | "mr" | "pa" | "te";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  avatarInitials: string;
  designation?: string;
  zone?: string;
  organization?: string; // Establishment / Shop Name
  address?: string;
  state?: string;
  district?: string;
  city?: string;
  preferredLanguage?: string;
  status?: 'Active' | 'Pending Verification' | 'Suspended';
  identityDocumentRef?: string; // Identity document reference (jurisdiction-dependent)
  taxIdentifier?: string; // Business registration / tax identifier (GSTIN / Trade / Shop Act)
  supportingDocumentNote?: string; // Applicable supporting document note
}

export type InstrumentCondition = 'Good' | 'Fair' | 'Needs Maintenance' | 'Damaged';
export type VerificationOutcome = 'Pass' | 'Fail';
export type InstrumentStatus = 'Verified' | 'Pending' | 'Expiring' | 'Expired';

export type InstrumentCategory =
  | 'Electronic Scales'
  | 'Flow Meters'
  | 'Weighbridges'
  | 'Platform scale'
  | 'Counter scale'
  | 'Measuring tape'
  | 'Digital measuring balance'
  | 'Carat balance'
  | string;

export interface Instrument {
  id: string; // e.g. "W-104"
  name: string; // "Platform Weighing Scale W-104"
  category: InstrumentCategory;
  manufacturer: string; // "Essae"
  model: string; // "DS-215"
  serialNumber: string; // "ES215-88421"
  capacity: string; // "300 kg"
  yearOfManufacture: number; // 2023
  location: string; // "Bharat Mart, 18 Ajmal Khan Road, New Delhi"
  ownerId: string;
  ownerName: string; // "Bharat Mart Pvt Ltd"
  currentStatus: InstrumentStatus;
  certificateExpiryDate: string; // "2025-06-30"
  daysUntilExpiry: number; // 18
  activeApplicationId?: string;
  activeCertificateId?: string;
  // Product onboarding metadata (useful for future AI receipt flow)
  verificationIntervalMonths?: number;
  lastVerifiedDate?: string;
  establishmentName?: string;
}

export interface VerificationEvidence {
  id: string;
  filename: string;
  type: 'image' | 'document';
  url: string;
}

export interface VerificationObservation {
  applicationId: string;
  instrumentId: string;
  verifierRole?: 'LMO' | 'GATC';
  verifierId?: string;
  testStandard: string; // "OIML R76-1"
  referenceWeights: string; // "20 kg / 50 kg / 100 kg"
  zeroError: string; // "0.00 kg"
  repeatabilityError: string; // "0.02%"
  eccentricityError: string; // "0.01%"
  observedErrorDisplay?: string; // "+0.02%"
  condition: InstrumentCondition; // "Good"
  sealIntact: boolean; // true
  calibrationStickerPresent: boolean; // true
  overallResult: VerificationOutcome; // "Pass" | "Fail"
  nextAction?: string; // "Certificate processing"
  officerNotes?: string;
  evidenceFiles: VerificationEvidence[];
  submittedAt?: string; // timestamp or date
  mpeEvaluations?: MpeEvaluation[];
  mpeRuleId?: string;
  mpeOverallStatus?: MpeEvaluationResult;
  aiAdvisory?: AiAdvisoryAssessment;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Scheduled'
  | 'Verification In Progress'
  | 'Result Submitted'
  | 'Needs Correction'
  | 'Certificate Generated'
  | 'Completed'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ADMIN_REVIEW'
  | 'ASSIGNED'
  | 'FIELD_VERIFICATION'
  | 'FIELD_VERIFIED'
  | 'GATC_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CERTIFICATE_ISSUED';

export type AuditEventType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_REVIEWED'
  | 'LMO_ASSIGNED'
  | 'INSPECTION_STARTED'
  | 'INSPECTION_SUBMITTED'
  | 'GATC_REVIEWED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'CERTIFICATE_ISSUED';

export interface AuditEvent {
  id: string;
  applicationId: string;
  timestamp: string;
  role: UserRole;
  actor: string;
  eventType: AuditEventType;
  details?: string;
}

export type PriorityLevel = 'High' | 'Normal' | 'Low';

export interface TimelineStep {
  stepNumber: number;
  label: ApplicationStatus;
  date?: string; // e.g. "08 Jun"
  isCompleted: boolean;
  isCurrent?: boolean;
}

export interface DocumentAttachment {
  id: string;
  title: string;
  fileSize?: string;
  fileType: string;
  downloadUrl: string;
}

export interface Application {
  id: string; // "APP-26036-0148"
  instrumentId: string; // "W-104"
  instrumentName: string; // "Platform Weighing Scale W-104"
  instrumentCategory: string; // "Platform scale"
  ownerId: string;
  ownerName: string; // "Bharat Mart Pvt Ltd"
  ownerContact: string; // "On file"
  status: ApplicationStatus;
  priority: PriorityLevel;
  zone: string; // "Delhi South Zone"
  location?: string;
  scheduledDateTime?: string; // "12 Jun 2025 at 10:00"
  assignedOfficer?: {
    id: string;
    name: string; // "Priya Sharma"
    designation: string; // "Delhi South LMO"
  };
  assignedLab?: {
    id: string;
    name: string; // "GATC Delhi Lab"
  };
  submittedDate: string; // "08 Jun 2025"
  lastUpdated: string; // "12 Jun 2025"
  timeline: TimelineStep[];
  attachments: DocumentAttachment[];
  certificateId?: string; // "CERT-2025-00981"
  legacyReceiptAssisted?: boolean;
}

export type CertificateStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export interface Certificate {
  certificateId: string; // "CERT-2025-00981"
  applicationId: string; // "APP-26036-0148"
  instrumentId?: string; // "W-104"
  ownerId?: string; // "user-owner-1"
  instrumentName: string; // "Platform Weighing Scale W-104"
  ownerName: string; // "Bharat Mart Pvt Ltd"
  issuedDate: string; // "12 Jun 2025"
  validUntil: string; // "11 Jun 2026"
  issuingAuthority: string; // "Delhi South Legal Metrology Office"
  result: VerificationOutcome; // "Pass"
  status: CertificateStatus;
  verificationUrl?: string; // e.g. "/verify-certificate?id=CERT-2025-00981"
  qrCodeDataUrl?: string;
  downloadUrl: string;
}

export type QRStickerConfirmationStatus = 'PENDING' | 'CONFIRMED' | 'CORRECTION_REQUIRED';

export interface QRStickerConfirmation {
  id: string; // e.g. "STK-2025-001"
  certificateId: string; // "CERT-2025-00981"
  instrumentId: string; // "W-104"
  applicationId: string; // "APP-26036-0148"
  ownerId: string; // "user-owner-1"
  evidence: VerificationEvidence; // Photographic proof of placed shop sticker
  submittedAt: string; // e.g. "12 Jun 2025, 14:30"
  status: QRStickerConfirmationStatus;
  reviewedBy?: string; // "user-lmo-1" or officer name
  reviewerRole?: 'LMO' | 'ADMIN';
  reviewedAt?: string;
  reviewerComment?: string;
  establishmentName?: string;
  instrumentName?: string;
  zone?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  date: string;
  read: boolean;
  link?: string;
}

export interface MinistryDashboardMetrics {
  registeredInstruments: number; // 2846
  activeApplications: number; // 1284
  validCertificates: number; // 892
  expiringIn30Days: number; // 74
  lastSynced: string;
  systemStatus: string;
  applicationsOverTime: { month: string; count: number }[];
  applicationsByStatus: { status: string; percentage: number; color: string }[];
  volumeByState: { state: string; volume: number }[];
  liveActivity: {
    id: string;
    description: string;
    timestamp: string;
    type: 'result_submitted' | 'certificate_generated' | 'reverification_requested';
  }[];
}

export interface LmoDashboardMetrics {
  pendingReviewCount: number; // 12
  scheduledTodayCount: number; // 5
  verificationInProgressCount: number; // 3
  completedThisMonthCount: number; // 28
  lastSynced: string;
  zone: string;
  todaySchedule: {
    time: string;
    clientName: string;
    applicationId: string;
  }[];
  weeklyWorkload: { day: string; count: number }[];
  workloadSummary: {
    pendingReview: number;
    scheduledToday: number;
    inProgress: number;
  };
}

export interface OwnerDashboardMetrics {
  totalInstruments: number; // 4
  verifiedCount: number; // 2
  pendingCount: number; // 1
  expiringCount: number; // 1
  alertInstrumentId?: string;
  alertMessage?: string;
}

export interface GatcWorkspaceMetrics {
  assignedForTesting: number; // 7
  inTesting: number; // 4
  resultsSubmitted: number; // 18
  passRatePercentage: number; // 96
  labCapacity: {
    percentage: number; // 62
    activeTests: number; // 4
    totalBays: number; // 7
  };
  recentActivity: {
    id: string;
    title: string;
    detail: string;
    date: string;
  }[];
}

// ==========================================
// Digital Instrument Passport Types
// ==========================================

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

// ==========================================
// AI-Assisted Legacy Receipt Extraction Types
// ==========================================

export type LegacyReceiptFieldKey =
  | "ownerName"
  | "establishmentName"
  | "mobile"
  | "address"
  | "instrumentType"
  | "instrumentName"
  | "model"
  | "serialNumber"
  | "capacity"
  | "accuracyClass"
  | "previousVerificationDate"
  | "previousCertificateNumber"
  | "observedReading"
  | "remarks";

export type ReceiptFieldConfidence = "HIGH" | "MEDIUM" | "LOW";
export type ReceiptFieldSourceState = "AI_SUGGESTED" | "USER_VERIFIED" | "NOT_FOUND";

export interface LegacyReceiptField {
  key: LegacyReceiptFieldKey;
  label: string;
  suggestedValue?: string;
  finalValue?: string;
  confidence: ReceiptFieldConfidence;
  sourceState: ReceiptFieldSourceState;
  editable: boolean;
}

export type InstrumentMatchStatus =
  | "MATCH_FOUND"
  | "MATCH_NOT_FOUND"
  | "MULTIPLE_MATCHES"
  | "INSUFFICIENT_INFO";

export interface LegacyReceiptExtraction {
  id: string;
  sourceFileName?: string;
  sourceType: "image" | "document" | "demo";
  extractedAt: string;
  extractionStatus: "READY" | "PARTIAL" | "REVIEW_REQUIRED";
  fields: LegacyReceiptField[];
  reviewerUserId?: string;
  confirmedAt?: string;
  matchedInstrumentId?: string;
  instrumentMatchStatus?: InstrumentMatchStatus;
  matchedInstruments?: Instrument[];
}

export interface InstrumentMatchResult {
  status: InstrumentMatchStatus;
  matchedInstruments: Instrument[];
  matchedId?: string;
  matchedInstrument?: Instrument;
  candidates?: Instrument[];
  message: string;
}

// ============================================================
// PROMPT 8: DYNAMIC MPE RULE ENGINE & VERIFICATION DECISION SUPPORT
// ============================================================

export type MpeEvaluationMethod = "ABSOLUTE_ERROR" | "RELATIVE_ERROR" | "THRESHOLD_COMPARISON";
export type MpeEvaluationResult = "WITHIN_MPE" | "EXCEEDS_MPE" | "INSUFFICIENT_DATA";

export interface MpeRule {
  ruleId: string;
  instrumentCategory: string;
  ruleName: string;
  unit: string;
  method: MpeEvaluationMethod;
  mpeValue: number;
  nominalRange?: {
    min?: number;
    max?: number;
  };
  explanation: string;
  disclaimer: string;
  prototypeRule: true;
}

export interface MpeEvaluation {
  ruleId: string;
  nominalValue: number;
  observedValue: number;
  unit: string;
  absoluteError?: number;
  relativeErrorPercent?: number;
  allowedMpe: number;
  result: MpeEvaluationResult;
  explanation: string;
  isPrototypeRule: true;
}

export interface MpeTestObservation {
  id: string;
  testPointLabel: string;
  nominalValue: number;
  observedValue: number;
  unit: string;
  evaluation?: MpeEvaluation;
}

// ============================================================
// PROMPT 9: AI-ASSISTED VERIFICATION ADVISORY & RISK ANALYSIS
// ============================================================

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RiskFactorType =
  | "DRIFT"
  | "NON_LINEARITY"
  | "IDENTICAL_READINGS"
  | "ERROR_TREND";

export interface RiskFactor {
  type: RiskFactorType;
  severity: "LOW" | "MEDIUM" | "HIGH";
  detected: boolean;
  title: string;
  explanation: string;
  evidence: string[];
}

export interface AiAdvisoryAssessment {
  instrumentId: string;
  generatedAt: string;
  riskLevel: RiskLevel;
  assessmentStatus: "ASSESSED" | "INSUFFICIENT_DATA";
  insufficientData: boolean;
  factors: RiskFactor[];
  observationsAnalyzed: number;
  historicalVerificationsAnalyzed: number;
  summary: string;
  isPrototypeHeuristic: true;
}
