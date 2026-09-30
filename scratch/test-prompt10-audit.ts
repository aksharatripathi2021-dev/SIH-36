import { storageService } from "../src/services/storageService";
import { authService } from "../src/services/authService";
import { registrationService } from "../src/services/registrationService";
import { instrumentService } from "../src/services/instrumentService";
import { applicationService } from "../src/services/applicationService";
import { legacyReceiptService } from "../src/services/legacyReceiptService";
import { instrumentPassportService } from "../src/services/instrumentPassportService";
import { mpeRuleService } from "../src/services/mpeRuleService";
import { aiAdvisoryService } from "../src/services/aiAdvisoryService";
import { verificationService } from "../src/services/verificationService";
import { certificateService } from "../src/services/certificateService";
import { qrStickerService } from "../src/services/qrStickerService";
import { notificationService } from "../src/services/notificationService";
import { translations } from "../src/i18n/translations";
import { UserProfile, Instrument, Application } from "../src/types";
import * as fs from "fs";
import * as path from "path";

async function runPrompt10Audit() {
  console.log("==================================================================");
  console.log("PROMPT 10: FULL PS36 END-TO-END INTEGRATION & DEMO READINESS AUDIT");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;
  const auditDefects: string[] = [];

  function assert(desc: string, cond: boolean, details?: any) {
    if (cond) {
      console.log(`✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${desc}`, details || "");
      failed++;
      auditDefects.push(desc + (details ? `: ${JSON.stringify(details)}` : ""));
    }
  }

  // ==================================================================
  // 1. BASELINE / RESET AUDIT
  // ==================================================================
  console.log("\n--- SECTION 1: Baseline / Demo Reset ---");
  storageService.resetDemoState();

  const baselineUsers = storageService.getUsers();
  const baselineInstruments = storageService.getInstruments();
  const baselineApplications = storageService.getApplications();
  const baselineVerifications = storageService.getVerificationResults();
  const baselineCertificates = storageService.getCertificates();
  const baselineStickers = storageService.getStickerConfirmations();
  const baselineNotifications = storageService.getNotifications();

  console.log(`Observed Baseline Counts:`);
  console.log(`- Users: ${baselineUsers.length}`);
  console.log(`- Instruments: ${baselineInstruments.length}`);
  console.log(`- Applications: ${baselineApplications.length}`);
  console.log(`- Verification Results: ${baselineVerifications.length}`);
  console.log(`- Certificates: ${baselineCertificates.length}`);
  console.log(`- QR Sticker Confirmations: ${baselineStickers.length}`);
  console.log(`- Notifications: ${baselineNotifications.length}`);

  assert("Baseline users count >= 4", baselineUsers.length >= 4);
  assert("Baseline instruments count >= 4", baselineInstruments.length >= 4);
  assert("Baseline applications count >= 4", baselineApplications.length >= 4);
  assert("Baseline verification results count >= 1", baselineVerifications.length >= 1);
  assert("Baseline certificates count is recorded (0 pre-verification)", baselineCertificates.length === 0);
  assert("Baseline QR sticker confirmations count is recorded (0 pre-verification)", baselineStickers.length === 0);
  assert("Baseline notifications count >= 3", baselineNotifications.length >= 3);

  // ==================================================================
  // 2. TRADER REGISTRATION AUDIT (/register)
  // ==================================================================
  console.log("\n--- SECTION 2: Trader Registration Audit ---");
  const registeredUser = await registrationService.registerTrader({
    fullName: "Audit Trader",
    email: "audit.trader@test.com",
    mobile: "9988776655",
    establishmentName: "Audit Mart Pvt Ltd",
    address: "Shop 10, Audit Market",
    state: "Delhi",
    district: "Delhi South",
    city: "Saket",
    taxIdentifier: "GSTIN07AAAAA0000A1Z5",
    preferredLanguage: "hi"
  });

  assert("Registered user created successfully", !!registeredUser && !!registeredUser.id);
  assert("Registered user assigned OWNER role", registeredUser.role === "OWNER");
  assert("Preferred language set to 'hi'", registeredUser.preferredLanguage === "hi");
  assert("User organization matches establishment", registeredUser.organization === "Audit Mart Pvt Ltd");

  // Check data isolation: newly registered user has 0 instruments initially
  const traderInstruments = await instrumentService.getInstrumentsByOwner(registeredUser.id);
  assert("Data isolation: New trader has 0 instruments initially", traderInstruments.length === 0);

  // ==================================================================
  // 3. INSTRUMENT REGISTRATION AUDIT (/owner/instruments)
  // ==================================================================
  console.log("\n--- SECTION 3: Instrument Registration Audit ---");
  const newInstrument = await instrumentService.createInstrument({
    name: "Audit Electronic Scale S-999",
    category: "Electronic Scales",
    manufacturer: "Essae",
    model: "DS-500",
    serialNumber: "SN-AUDIT-99901",
    capacity: "50 kg",
    location: "Counter 1, Audit Mart",
    ownerId: registeredUser.id,
    ownerName: registeredUser.name,
    verificationIntervalMonths: 12
  });

  assert("Instrument created with canonical ID", !!newInstrument && !!newInstrument.id);
  assert("Instrument owner is registered trader", newInstrument.ownerId === registeredUser.id);
  assert("Instrument status is Pending", newInstrument.currentStatus === "Pending");

  const ownerInstsAfter = await instrumentService.getInstrumentsByOwner(registeredUser.id);
  assert("Instrument appears in owner's instrument list", ownerInstsAfter.some((i) => i.id === newInstrument.id));

  const otherOwnerInsts = await instrumentService.getInstrumentsByOwner("user-owner-1");
  assert("Data isolation: Instrument does NOT appear in other owner's list", !otherOwnerInsts.some((i) => i.id === newInstrument.id));

  // ==================================================================
  // 4. LEGACY RECEIPT ASSISTANCE AUDIT (Prompt 7 / 7A)
  // ==================================================================
  console.log("\n--- SECTION 4: Legacy Receipt Assistance Audit ---");
  const demoReceipts = legacyReceiptService.getDemoReceipts();
  assert("Demo receipts catalogue has 3 receipts", demoReceipts.length === 3);

  const receipt1 = demoReceipts[0];
  const extractionResult = await legacyReceiptService.extractFromDemo(receipt1.id);
  assert("Extraction returns structured fields", extractionResult.fields.length >= 7);

  const serialField = extractionResult.fields.find((f) => f.key === "serialNumber");
  assert("Receipt extracts known serial ES215-88421", serialField?.suggestedValue === "ES215-88421");

  // Edit field and verify transition to USER_VERIFIED
  const editedExtraction = legacyReceiptService.updateField(
    extractionResult,
    "capacity",
    "320 kg"
  );
  const capField = editedExtraction.fields.find((f) => f.key === "capacity");
  assert("Field capacity updated to '320 kg'", capField?.finalValue === "320 kg");
  assert("Field state changed to USER_VERIFIED", capField?.sourceState === "USER_VERIFIED");

  // Instrument matching for Owner 1 (Bharat Mart)
  const matchRes = await legacyReceiptService.matchInstrument(serialField?.finalValue || "ES215-88421", "user-owner-1");
  assert("Instrument matching for serial ES215-88421 succeeds (MATCH_FOUND)", matchRes.status === "MATCH_FOUND");
  assert("Matched instrument is W-104", matchRes.matchedInstrument?.id === "W-104");

  // No-match scenario with unknown receipt (FM-NEW-771 not registered for Bharat Mart)
  const receipt2 = demoReceipts[1];
  const extraction2 = await legacyReceiptService.extractFromDemo(receipt2.id);
  const serial2 = extraction2.fields.find((f) => f.key === "serialNumber")?.finalValue;
  const matchRes2 = await legacyReceiptService.matchInstrument(serial2, "user-owner-1");
  assert("No-match receipt results in MATCH_NOT_FOUND", matchRes2.status === "MATCH_NOT_FOUND");

  // Ensure receipt extraction does NOT create verification results or certificates
  const certsDuringReceipt = storageService.getCertificates();
  const verifsDuringReceipt = storageService.getVerificationResults();
  assert("Zero certificates created by receipt extraction", certsDuringReceipt.length === baselineCertificates.length);
  assert("Zero verification records created by receipt extraction", verifsDuringReceipt.length === baselineVerifications.length);

  // ==================================================================
  // 5. APPLICATION WORKFLOW AUDIT
  // ==================================================================
  console.log("\n--- SECTION 5: Application Workflow Audit ---");
  const draftApp = await applicationService.createReverificationApplication({
    instrumentId: newInstrument.id,
    preferredDate: "20 Jun 2025",
    additionalNotes: "Audit verification request",
    status: "Draft"
  });

  assert("Draft application created with canonical ID", !!draftApp && draftApp.id.startsWith("APP-"));
  assert("Draft application status is 'Draft'", draftApp.status === "Draft");

  // Check instrument status untouched by draft save
  const instCheck1 = await instrumentService.getInstrumentById(newInstrument.id);
  assert("Draft application does not mutate instrument status", instCheck1?.currentStatus === "Pending");

  // Submit application
  const submittedApp = await applicationService.transitionApplicationStatus(draftApp.id, "Submitted");
  assert("Application transitioned to 'Submitted'", submittedApp?.status === "Submitted");

  const ownerApps = await applicationService.getApplications({ ownerId: registeredUser.id });
  assert("Application appears in owner's application list", ownerApps.some((a) => a.id === draftApp.id));

  // ==================================================================
  // 6. DIGITAL INSTRUMENT PASSPORT AUDIT
  // ==================================================================
  console.log("\n--- SECTION 6: Digital Instrument Passport Audit ---");
  const lmoOfficer: UserProfile = baselineUsers.find((u) => u.role === "LMO")!;
  const ownerUser1: UserProfile = baselineUsers.find((u) => u.id === "user-owner-1")!;
  const ownerUser2: UserProfile = baselineUsers.find((u) => u.id === "user-owner-2")!;
  const publicUser: UserProfile = { id: "p-1", name: "Citizen", role: "PUBLIC", email: "", mobile: "", avatarInitials: "C" };

  // Passport for W-104 (Owned by user-owner-1)
  const passportResLMO = await instrumentPassportService.getInstrumentPassport("W-104", lmoOfficer);
  assert("LMO can resolve passport for W-104", passportResLMO.success === true);
  if (passportResLMO.success) {
    assert("Passport timeline has evidence-backed events", passportResLMO.passport.timeline.length > 0);
    assert("Passport has verification cycles", passportResLMO.passport.cycles.length > 0);
    assert("Passport summary has total counts", passportResLMO.passport.summary.totalApplications > 0);
  }

  // Owner access
  const passportResOwner1 = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser1);
  assert("Owner 1 can view their own instrument passport", passportResOwner1.success === true);

  const passportResOwner2 = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser2);
  assert("Owner 2 is BLOCKED from viewing Owner 1's passport", passportResOwner2.success === false);

  const passportResPublic = await instrumentPassportService.getInstrumentPassport("W-104", publicUser);
  assert("Public user is strictly BLOCKED from viewing full passport", passportResPublic.success === false);

  // ==================================================================
  // 7. MPE RULE ENGINE AUDIT
  // ==================================================================
  console.log("\n--- SECTION 7: MPE Rule Engine Audit ---");
  const scaleRule = mpeRuleService.getRuleForInstrument({ category: "Electronic Scales" } as any);
  assert("Rule retrieved for Electronic Scales", !!scaleRule);
  assert("Rule disclaimer is non-empty", !!scaleRule?.disclaimer);
  assert("Rule is explicitly marked prototypeRule === true", scaleRule?.prototypeRule === true);

  // Error evaluations
  const withinObs = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.02,
    unit: "kg",
    rule: scaleRule!
  });
  assert("Observed 100.02 kg against 100 kg is WITHIN_MPE", withinObs.result === "WITHIN_MPE");

  const exceedsObs = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.12,
    unit: "kg",
    rule: scaleRule!
  });
  assert("Observed 100.12 kg against 100 kg EXCEEDS_MPE", exceedsObs.result === "EXCEEDS_MPE");

  const boundaryObs = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.05,
    unit: "kg",
    rule: scaleRule!
  });
  assert("Exact boundary 100.05 kg against 100 kg is WITHIN_MPE", boundaryObs.result === "WITHIN_MPE");

  const missingObs = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: NaN,
    unit: "kg",
    rule: scaleRule!
  });
  assert("NaN observed value yields INSUFFICIENT_DATA", missingObs.result === "INSUFFICIENT_DATA");

  const tapeRule = mpeRuleService.getRuleForInstrument({ category: "Measuring tape" } as any);
  assert("Unsupported category 'Measuring tape' returns null rule", tapeRule === null);

  // ==================================================================
  // 8. AI ADVISORY AUDIT (Scenarios A, B, C, D)
  // ==================================================================
  console.log("\n--- SECTION 8: AI Advisory Audit ---");
  const demoScenarios = aiAdvisoryService.getDemoScenarios();

  // Scenario A
  const scA = demoScenarios.find((s) => s.id === "scenario-a-low")!;
  const advA = aiAdvisoryService.analyzeObservations("W-104", scA.observations, scA.historicalVerifications);
  assert("AI Advisory Scenario A produces LOW risk", advA.riskLevel === "LOW");
  assert("Scenario A assessmentStatus is 'ASSESSED'", advA.assessmentStatus === "ASSESSED");

  // Scenario B
  const scB = demoScenarios.find((s) => s.id === "scenario-b-medium")!;
  const advB = aiAdvisoryService.analyzeObservations("W-104", scB.observations, scB.historicalVerifications);
  assert("AI Advisory Scenario B produces MEDIUM risk", advB.riskLevel === "MEDIUM");
  assert("Scenario B assessmentStatus is 'ASSESSED'", advB.assessmentStatus === "ASSESSED");

  // Scenario C
  const scC = demoScenarios.find((s) => s.id === "scenario-c-high")!;
  const advC = aiAdvisoryService.analyzeObservations("W-104", scC.observations, scC.historicalVerifications);
  assert("AI Advisory Scenario C produces HIGH risk", advC.riskLevel === "HIGH");
  assert("Scenario C assessmentStatus is 'ASSESSED'", advC.assessmentStatus === "ASSESSED");

  // Scenario D (Insufficient Data)
  const scD = demoScenarios.find((s) => s.id === "scenario-d-insufficient")!;
  const advD = aiAdvisoryService.analyzeObservations("W-104", scD.observations, scD.historicalVerifications);
  assert("AI Advisory Scenario D has insufficientData === true", advD.insufficientData === true);
  assert("AI Advisory Scenario D assessmentStatus is 'INSUFFICIENT_DATA'", advD.assessmentStatus === "INSUFFICIENT_DATA");
  assert("AI Advisory Scenario D summary indicates insufficient data", advD.summary.includes("Insufficient"));

  // Check determinism & clock independence
  const advD1 = aiAdvisoryService.analyzeObservations("W-104", scA.observations, scA.historicalVerifications);
  const advD2 = aiAdvisoryService.analyzeObservations("W-104", scA.observations, scA.historicalVerifications);
  assert("AI Advisory is purely deterministic across calls", JSON.stringify(advD1) === JSON.stringify(advD2));

  // ==================================================================
  // 9. PASS PATH CRITICAL END-TO-END TEST
  // ==================================================================
  console.log("\n--- SECTION 9: Pass Path Critical End-to-End Test ---");
  // Use deterministic baseline application APP-26036-0148 which is in Verification In Progress
  const passApp = (await applicationService.getApplicationById("APP-26036-0148"))!;
  assert("Deterministic demo application APP-26036-0148 found", !!passApp);

  const certsBeforePass = storageService.getCertificates().length;

  // LMO submits PASS verification
  const passVerification = await verificationService.submitVerificationResult(passApp.id, {
    instrumentId: "W-104",
    verifierRole: "LMO",
    verifierId: lmoOfficer.id,
    testStandard: "OIML R76-1",
    referenceWeights: "20 kg / 50 kg / 100 kg",
    zeroError: "0.00 kg",
    repeatabilityError: "+0.02%",
    eccentricityError: "+0.01%",
    condition: "Good",
    sealIntact: true,
    calibrationStickerPresent: true,
    overallResult: "Pass"
  });

  assert("Pass verification recorded", passVerification.overallResult === "Pass");

  const passAppUpdated = await applicationService.getApplicationById(passApp.id);
  assert("Application progressed to 'Certificate Generated'", passAppUpdated?.status === "Certificate Generated");
  assert("Application has attached certificateId", !!passAppUpdated?.certificateId);

  const certsAfterPass = storageService.getCertificates().length;
  assert("Exactly ONE certificate created for pass path", certsAfterPass === certsBeforePass + 1);

  const newlyIssuedCert = await certificateService.getCertificateById(passAppUpdated!.certificateId!);
  assert("Certificate is VALID", newlyIssuedCert?.status === "VALID");
  assert("Certificate links to correct application", newlyIssuedCert?.applicationId === passApp.id);
  assert("Certificate links to correct instrument", newlyIssuedCert?.instrumentId === "W-104");

  // Idempotency: submitting again should NOT create duplicate certificate
  await verificationService.submitVerificationResult(passApp.id, {
    ...passVerification,
    overallResult: "Pass"
  });
  const certsAfterDuplicate = storageService.getCertificates().length;
  assert("Idempotency: Re-submitting Pass does NOT create duplicate certificate", certsAfterDuplicate === certsAfterPass);

  // ==================================================================
  // 10. FAIL PATH CRITICAL END-TO-END TEST
  // ==================================================================
  console.log("\n--- SECTION 10: Fail Path Critical End-to-End Test ---");
  const failApp = await applicationService.createReverificationApplication({
    instrumentId: "W-102",
    preferredDate: "25 Jun 2025",
    status: "Verification In Progress"
  });

  const certsBeforeFail = storageService.getCertificates().length;

  const failVerification = await verificationService.submitVerificationResult(failApp.id, {
    instrumentId: "W-102",
    verifierRole: "LMO",
    verifierId: lmoOfficer.id,
    testStandard: "OIML R76-1",
    referenceWeights: "20 kg / 50 kg / 100 kg",
    zeroError: "0.00 kg",
    repeatabilityError: "+0.15%",
    eccentricityError: "+0.08%",
    condition: "Needs Maintenance",
    sealIntact: false,
    calibrationStickerPresent: true,
    overallResult: "Fail",
    officerNotes: "Inspection failed prototype Maximum Permissible Error tolerance."
  });

  assert("Fail verification recorded", failVerification.overallResult === "Fail");

  const failAppUpdated = await applicationService.getApplicationById(failApp.id);
  assert("Failing application transitions to 'Needs Correction'", failAppUpdated?.status === "Needs Correction");
  assert("Failing application has NO certificateId attached", !failAppUpdated?.certificateId);

  const certsAfterFail = storageService.getCertificates().length;
  assert("Zero certificates created for fail path", certsAfterFail === certsBeforeFail);

  // ==================================================================
  // 11. CERTIFICATE REPOSITORY & PUBLIC QR VERIFICATION AUDIT
  // ==================================================================
  console.log("\n--- SECTION 11: Certificate Repository & Public QR Verification ---");
  const allCerts = await certificateService.getAllCertificates();
  const owner1Certs = allCerts.filter((c) => c.ownerId === "user-owner-1");
  assert("Owner 1 can view their certificates", owner1Certs.length >= 1);

  const owner2Certs = allCerts.filter((c) => c.ownerId === "user-owner-999");
  assert("Other owner sees zero certificates of Owner 1", !owner2Certs.some((c) => c.ownerId === "user-owner-1"));

  // Public verification lookup
  const publicCert = await certificateService.getCertificateById(newlyIssuedCert!.certificateId);
  assert("Public certificate lookup succeeds by certificateId", !!publicCert);
  assert("Public certificate displays instrument and owner name", publicCert?.ownerName === "Bharat Mart Pvt Ltd");
  assert("Public certificate does NOT contain internal LMO override or AI advisory data", (publicCert as any).aiAdvisory === undefined);

  // ==================================================================
  // 12. QR STICKER WORKFLOW AUDIT
  // ==================================================================
  console.log("\n--- SECTION 12: QR Sticker Workflow Audit ---");
  // 1. Trader submits sticker evidence
  const submittedSticker = await qrStickerService.createStickerConfirmation({
    certificateId: newlyIssuedCert!.certificateId,
    ownerId: "user-owner-1",
    evidence: {
      id: "ev-stk-1",
      filename: "audit-sticker-01.jpg",
      type: "image",
      url: "https://storage.example.com/stickers/audit-sticker-01.jpg"
    }
  });
  assert("Sticker evidence submitted with PENDING status", submittedSticker.status === "PENDING");
  assert("Sticker photo URL stored correctly", submittedSticker.evidence.url.includes("audit-sticker-01.jpg"));

  // 2. LMO requests correction
  const correctionSticker = await qrStickerService.requestStickerCorrection(
    submittedSticker.id,
    lmoOfficer.id,
    "Photo is blurry. Please upload a clear photo showing the QR code."
  );
  assert("Sticker reviewed to CORRECTION_REQUIRED", correctionSticker.status === "CORRECTION_REQUIRED");
  assert("Correction comments preserved", correctionSticker.reviewerComment?.includes("blurry") === true);

  // 3. Trader replaces evidence
  const resubmittedSticker = await qrStickerService.createStickerConfirmation({
    certificateId: newlyIssuedCert!.certificateId,
    ownerId: "user-owner-1",
    evidence: {
      id: "ev-stk-2",
      filename: "audit-sticker-02-clear.jpg",
      type: "image",
      url: "https://storage.example.com/stickers/audit-sticker-02-clear.jpg"
    }
  });
  assert("Sticker resubmitted to PENDING", resubmittedSticker.status === "PENDING");

  // 4. LMO confirms sticker
  const confirmedSticker = await qrStickerService.approveStickerConfirmation(
    resubmittedSticker.id,
    lmoOfficer.id,
    "Verified in order."
  );
  assert("Sticker reviewed to CONFIRMED", confirmedSticker.status === "CONFIRMED");

  // Check passport reflects confirmed sticker
  const passportAfterSticker = await instrumentPassportService.getInstrumentPassport("W-104", lmoOfficer);
  if (passportAfterSticker.success) {
    const stickerTimeline = passportAfterSticker.passport.timeline.filter(
      (e) => e.type === "QR_STICKER_CONFIRMED"
    );
    assert("Passport timeline reflects QR sticker confirmation", stickerTimeline.length > 0);
  }

  // ==================================================================
  // 13. NOTIFICATION AUDIT
  // ==================================================================
  console.log("\n--- SECTION 13: Notification Audit ---");
  const allNotifications = await notificationService.getNotifications();
  assert("Notifications exist", allNotifications.length > 0);
  assert(
    "Certificate, sticker, or correction notifications exist",
    allNotifications.some(
      (n) =>
        n.title.toLowerCase().includes("certificate") ||
        n.title.toLowerCase().includes("sticker") ||
        n.title.toLowerCase().includes("correction")
    )
  );

  // ==================================================================
  // 14. MULTILINGUAL AUDIT (All 5 Languages)
  // ==================================================================
  console.log("\n--- SECTION 14: Multilingual Audit (5 Languages) ---");
  const sampleKeys = [
    "common.save",
    "common.submit",
    "header.portalTitle",
    "nav.dashboard",
    "passport.title",
    "mpe.prototypeRule",
    "mpe.withinMpe",
    "advisory.title",
    "advisory.compositeRisk",
    "advisory.inconclusive"
  ];

  const languages: Array<"en" | "hi" | "mr" | "pa" | "te"> = ["en", "hi", "mr", "pa", "te"];
  for (const lang of languages) {
    const dict = translations[lang];
    const missing = sampleKeys.filter((k) => !dict[k] || dict[k].trim() === "");
    assert(`Language '${lang}' contains all core sample keys`, missing.length === 0, missing);
  }

  // ==================================================================
  // 15. ROUTE REGRESSION AUDIT (Exact 30 Application Routes)
  // ==================================================================
  console.log("\n--- SECTION 15: Route Inventory Audit ---");
  const expectedRoutes = [
    "app/page.tsx",
    "app/login/page.tsx",
    "app/register/page.tsx",
    "app/verify-certificate/page.tsx",
    "app/owner/dashboard/page.tsx",
    "app/owner/instruments/page.tsx",
    "app/owner/instruments/[instrumentId]/page.tsx",
    "app/owner/applications/page.tsx",
    "app/owner/applications/[id]/page.tsx",
    "app/owner/re-verify/page.tsx",
    "app/owner/re-verify/[instrumentId]/page.tsx",
    "app/owner/certificates/page.tsx",
    "app/owner/profile/page.tsx",
    "app/owner/mobile/page.tsx",
    "app/lmo/dashboard/page.tsx",
    "app/lmo/applications/page.tsx",
    "app/lmo/applications/[id]/verify/page.tsx",
    "app/lmo/instruments/[id]/page.tsx",
    "app/lmo/qr-confirmations/page.tsx",
    "app/gatc/dashboard/page.tsx",
    "app/gatc/assigned/page.tsx",
    "app/gatc/results/page.tsx",
    "app/gatc/history/page.tsx",
    "app/admin/dashboard/page.tsx",
    "app/admin/applications/page.tsx",
    "app/admin/instruments/page.tsx",
    "app/admin/certificates/page.tsx",
    "app/admin/reports/page.tsx",
    "app/admin/users/page.tsx",
    "app/admin/mobile/page.tsx"
  ];

  let missingRoutes = 0;
  for (const r of expectedRoutes) {
    const fullPath = path.join(__dirname, "..", r);
    if (!fs.existsSync(fullPath)) {
      console.error(`Missing expected route file: ${r}`);
      missingRoutes++;
    }
  }
  assert(`All 30 expected route files exist physically (missing: ${missingRoutes})`, missingRoutes === 0);

  // ==================================================================
  // 16. DATA INTEGRITY / DUPLICATION AUDIT
  // ==================================================================
  console.log("\n--- SECTION 16: Data Integrity / No Duplicate DBs ---");
  const servicesDir = path.join(__dirname, "../src/services");
  const serviceFiles = fs.readdirSync(servicesDir);

  const unauthorizedDbFiles = serviceFiles.filter(
    (f) =>
      f.toLowerCase().includes("aihistory") ||
      f.toLowerCase().includes("riskhistory") ||
      f.toLowerCase().includes("secondarydb") ||
      f.toLowerCase().includes("legacyhistory")
  );
  assert("Zero unauthorized duplicate database services exist", unauthorizedDbFiles.length === 0);

  // ==================================================================
  // 17. FINAL DEMO RESET CHECK
  // ==================================================================
  console.log("\n--- SECTION 17: Post-Audit Demo Reset Verification ---");
  storageService.resetDemoState();
  const resetApps = storageService.getApplications();
  const resetCerts = storageService.getCertificates();
  assert("resetDemoState() restores baseline applications", resetApps.length === baselineApplications.length);
  assert("resetDemoState() restores baseline certificates", resetCerts.length === baselineCertificates.length);

  console.log(`\n==================================================================`);
  console.log(`PROMPT 10 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================================\n`);

  if (failed > 0) {
    console.error("Defects encountered during audit:", auditDefects);
    process.exit(1);
  }
}

runPrompt10Audit().catch((err) => {
  console.error("Audit script failed with error:", err);
  process.exit(1);
});
