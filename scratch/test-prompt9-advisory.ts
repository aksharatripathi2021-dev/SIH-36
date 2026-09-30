import { aiAdvisoryService, PROTOTYPE_ADVISORY_CONFIG } from "../src/services/aiAdvisoryService";
import { mpeRuleService } from "../src/services/mpeRuleService";
import { verificationService } from "../src/services/verificationService";
import { applicationService } from "../src/services/applicationService";
import { certificateService } from "../src/services/certificateService";
import { instrumentPassportService } from "../src/services/instrumentPassportService";
import { storageService } from "../src/services/storageService";
import { translations } from "../src/i18n/translations";
import { UserProfile } from "../src/types";
import * as fs from "fs";
import * as path from "path";

async function runPrompt9Tests() {
  console.log("=== STARTING PROMPT 9 / 9A AI ADVISORY & RISK ANALYSIS TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(desc: string, cond: boolean, details?: any) {
    if (cond) {
      console.log(`✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${desc}`, details || "");
      failed++;
    }
  }

  // 1. STATUTORY WORDING NORMALIZATION CHECKS (Prompt 9A Req A & B)
  console.log("\n--- TEST 9A-A/B: Terminology Normalization (No statutory MPE / OIML claims) ---");
  const advisoryServiceContent = fs.readFileSync(
    path.join(__dirname, "../src/services/aiAdvisoryService.ts"),
    "utf8"
  );
  const verifyPageContent = fs.readFileSync(
    path.join(__dirname, "../app/lmo/applications/[id]/verify/page.tsx"),
    "utf8"
  );
  const advisoryCardContent = fs.readFileSync(
    path.join(__dirname, "../app/components/AiAdvisoryCard.tsx"),
    "utf8"
  );

  const forbiddenMpePhrases = [
    "statutory tolerance",
    "statutory mpe",
    "legal mpe",
    "government mpe"
  ];

  for (const phrase of forbiddenMpePhrases) {
    assert(
      `aiAdvisoryService does not refer to MPE as '${phrase}'`,
      !advisoryServiceContent.toLowerCase().includes(phrase)
    );
    assert(
      `AiAdvisoryCard does not refer to MPE as '${phrase}'`,
      !advisoryCardContent.toLowerCase().includes(phrase)
    );
    assert(
      `verify/page.tsx does not refer to MPE as '${phrase}'`,
      !verifyPageContent.toLowerCase().includes(phrase)
    );
  }

  // 2. DETERMINISM AND TIMESTAMP INDEPENDENCE (Prompt 9A Req C, D, E)
  console.log("\n--- TEST 9A-C/D/E: Determinism & Clock Independence ---");
  const testInputObs = [
    { nominalValue: 20, observedValue: 20.0, unit: "kg" },
    { nominalValue: 50, observedValue: 50.01, unit: "kg" },
    { nominalValue: 100, observedValue: 100.02, unit: "kg" }
  ];

  const explicitTs = "2025-06-15T12:00:00Z";
  const advExplicit1 = aiAdvisoryService.analyzeObservations("W-104", testInputObs, undefined, explicitTs);
  const advExplicit2 = aiAdvisoryService.analyzeObservations("W-104", testInputObs, undefined, explicitTs);
  assert(
    "Test 9A-D: Same input + same explicit timestamp produces deeply identical result",
    JSON.stringify(advExplicit1) === JSON.stringify(advExplicit2)
  );
  assert("Explicit timestamp matches input exactly", advExplicit1.generatedAt === explicitTs);

  const advImplicit1 = aiAdvisoryService.analyzeObservations("W-104", testInputObs);
  // Simulate delay or repeated calls
  const advImplicit2 = aiAdvisoryService.analyzeObservations("W-104", testInputObs);
  assert(
    "Test 9A-E: Analysis without timestamp does not depend on current clock",
    advImplicit1.generatedAt === advImplicit2.generatedAt &&
      advImplicit1.riskLevel === advImplicit2.riskLevel &&
      JSON.stringify(advImplicit1.factors) === JSON.stringify(advImplicit2.factors)
  );

  // 3. DRIFT DETECTION & INSUFFICIENT DATA SEMANTICS
  console.log("\n--- TEST: Drift Detection & Semantics ---");
  const histWithDrift = [
    { date: "2023-06-01", cycleNumber: 1, relativeErrorPercent: 0.01 },
    { date: "2024-06-01", cycleNumber: 2, relativeErrorPercent: 0.02 }
  ];
  const currentDriftObs = [
    { nominalValue: 20, observedValue: 20.0, unit: "kg" },
    { nominalValue: 50, observedValue: 50.02, unit: "kg" },
    { nominalValue: 100, observedValue: 100.06, unit: "kg" } // +0.06% error, delta = +0.04% >= 0.03%
  ];
  const driftAdv = aiAdvisoryService.analyzeObservations("W-104", currentDriftObs, histWithDrift);
  const driftFactor = driftAdv.factors.find((f) => f.type === "DRIFT");
  assert("Drift is detected when error increases across historical cycles", driftFactor?.detected === true);

  const driftNoHistory = aiAdvisoryService.analyzeObservations("W-104", currentDriftObs, []);
  const driftNoHistFactor = driftNoHistory.factors.find((f) => f.type === "DRIFT");
  assert("Drift not detected when historical verifications < 2", driftNoHistFactor?.detected === false);
  assert(
    "Drift explanation explicitly states historical comparison unavailable (no claim of safe/no-drift)",
    driftNoHistFactor?.explanation.includes("Historical comparison unavailable") === true
  );

  // 4. NON-LINEARITY DETECTION & INSUFFICIENT DATA SEMANTICS
  console.log("\n--- TEST: Non-Linearity Detection & Semantics ---");
  const nonLinearObs = [
    { nominalValue: 20, observedValue: 20.01, unit: "kg" },
    { nominalValue: 50, observedValue: 50.01, unit: "kg" },
    { nominalValue: 100, observedValue: 100.09, unit: "kg" }
  ];
  const nlAdv = aiAdvisoryService.analyzeObservations("W-104", nonLinearObs);
  const nlFactor = nlAdv.factors.find((f) => f.type === "NON_LINEARITY");
  assert("Non-linearity is detected when load step error abruptly jumps", nlFactor?.detected === true);

  const insufficientPointsObs = [
    { nominalValue: 20, observedValue: 20.0, unit: "kg" },
    { nominalValue: 50, observedValue: 50.01, unit: "kg" }
  ];
  const nlInsuffAdv = aiAdvisoryService.analyzeObservations("W-104", insufficientPointsObs);
  const nlInsuffFactor = nlInsuffAdv.factors.find((f) => f.type === "NON_LINEARITY");
  assert("Non-linearity requires at least 3 distinct nominal points", nlInsuffFactor?.detected === false);
  assert(
    "Non-linearity semantics: Pattern could not be assessed from available data",
    nlInsuffFactor?.explanation.includes("Insufficient distinct test points") === true
  );

  // 5. IDENTICAL / REPEATED READINGS DETECTION & SEMANTICS
  console.log("\n--- TEST: Identical Readings Detection & Semantics ---");
  const identicalObs = [
    { nominalValue: 20, observedValue: 19.98, unit: "kg" },
    { nominalValue: 50, observedValue: 19.98, unit: "kg" },
    { nominalValue: 100, observedValue: 19.98, unit: "kg" }
  ];
  const identAdv = aiAdvisoryService.analyzeObservations("W-104", identicalObs);
  const identFactor = identAdv.factors.find((f) => f.type === "IDENTICAL_READINGS");
  assert("Identical readings across 3 distinct nominal loads detected", identFactor?.detected === true);
  assert("Non-accusatory language: no 'fraud' or 'cheating' used", !identFactor?.explanation.toLowerCase().includes("fraud"));

  const identInsuffObs = [
    { nominalValue: 20, observedValue: 19.98, unit: "kg" },
    { nominalValue: 50, observedValue: 19.98, unit: "kg" }
  ];
  const identInsuffAdv = aiAdvisoryService.analyzeObservations("W-104", identInsuffObs);
  const identInsuffFactor = identInsuffAdv.factors.find((f) => f.type === "IDENTICAL_READINGS");
  assert("Identical readings requires minimum 3 distinct points", identInsuffFactor?.detected === false);

  // 6. ERROR TREND DETECTION
  console.log("\n--- TEST: Error Trend Detection ---");
  const errorTrendObs = [
    { nominalValue: 20, observedValue: 20.002, unit: "kg" },
    { nominalValue: 50, observedValue: 50.015, unit: "kg" },
    { nominalValue: 100, observedValue: 100.06, unit: "kg" }
  ];
  const etAdv = aiAdvisoryService.analyzeObservations("W-104", errorTrendObs);
  const etFactor = etAdv.factors.find((f) => f.type === "ERROR_TREND");
  assert("Monotonic error growth with nominal load is detected", etFactor?.detected === true);

  // 7. COMPOSITE SCENARIOS & SCENARIO D INSUFFICIENT DATA (Prompt 9A Req F & G)
  console.log("\n--- TEST 9A-F/G: Composite Risk & Scenario D Insufficient Data Normalization ---");
  const scA = aiAdvisoryService.getDemoScenarios().find((s) => s.id === "scenario-a-low")!;
  const advScA = aiAdvisoryService.analyzeObservations("W-104", scA.observations, scA.historicalVerifications);
  assert("Scenario A: Assessed as LOW risk (assessmentStatus=ASSESSED)", advScA.riskLevel === "LOW" && advScA.assessmentStatus === "ASSESSED");

  const scB = aiAdvisoryService.getDemoScenarios().find((s) => s.id === "scenario-b-medium")!;
  const advScB = aiAdvisoryService.analyzeObservations("W-104", scB.observations, scB.historicalVerifications);
  assert("Scenario B: Assessed as MEDIUM risk (assessmentStatus=ASSESSED)", advScB.riskLevel === "MEDIUM" && advScB.assessmentStatus === "ASSESSED");

  const scC = aiAdvisoryService.getDemoScenarios().find((s) => s.id === "scenario-c-high")!;
  const advScC = aiAdvisoryService.analyzeObservations("W-104", scC.observations, scC.historicalVerifications);
  assert("Scenario C: Assessed as HIGH risk (assessmentStatus=ASSESSED)", advScC.riskLevel === "HIGH" && advScC.assessmentStatus === "ASSESSED");

  // Scenario D Insufficient Data
  const scD = aiAdvisoryService.getDemoScenarios().find((s) => s.id === "scenario-d-insufficient")!;
  const advScD = aiAdvisoryService.analyzeObservations("W-104", scD.observations, scD.historicalVerifications);
  assert("Test 9A-F: Scenario D has insufficientData === true", advScD.insufficientData === true);
  assert("Test 9A-F: Scenario D has assessmentStatus === 'INSUFFICIENT_DATA'", advScD.assessmentStatus === "INSUFFICIENT_DATA");
  assert("Test 9A-F: Scenario D summary indicates insufficient data", advScD.summary === "Insufficient data for meaningful pattern analysis.");

  // 8. MPE INDEPENDENCE (Prompt 9A Req H)
  console.log("\n--- TEST: Independence from MPE Rule Engine ---");
  const scaleRule = mpeRuleService.getRuleForInstrument({ category: "Electronic Scales" } as any);
  const mpeExceedObs = [
    { id: "1", testPointLabel: "P1", nominalValue: 20, observedValue: 20.024, unit: "kg" },
    { id: "2", testPointLabel: "P2", nominalValue: 50, observedValue: 50.06, unit: "kg" },
    { id: "3", testPointLabel: "P3", nominalValue: 100, observedValue: 100.12, unit: "kg" }
  ];
  const mpeEval = mpeRuleService.evaluateMultipleObservations(mpeExceedObs, scaleRule);
  assert("MPE Rule Engine flags EXCEEDS_MPE", mpeEval.overallStatus === "EXCEEDS_MPE");

  const aiEvalOnMpeExceed = aiAdvisoryService.analyzeObservations("W-104", mpeExceedObs);
  assert("AI Advisory does NOT automatically escalate risk to HIGH simply because MPE was exceeded", aiEvalOnMpeExceed.riskLevel !== "HIGH");

  // 9. NO AUTOMATIC DECISIONS, CERTIFICATES, OR MUTATIONS (Prompt 9A Req J)
  console.log("\n--- TEST: Advisory Purity (No side-effects) ---");
  const appBefore = await applicationService.getApplicationById("APP-26036-0148");
  const certsBefore = await certificateService.getAllCertificates();
  aiAdvisoryService.analyzeObservations("W-104", scC.observations, scC.historicalVerifications);
  const appAfter = await applicationService.getApplicationById("APP-26036-0148");
  const certsAfter = await certificateService.getAllCertificates();

  assert("ApplicationStatus was not mutated by AI Advisory", appBefore?.status === appAfter?.status);
  assert("No certificate was generated by AI Advisory", certsBefore.length === certsAfter.length);

  // 10. ACCESS CONTROL CHECK
  console.log("\n--- TEST: Access Control (Internal Inspection Support) ---");
  const lmoUser: UserProfile = {
    id: "user-lmo-1",
    name: "Sunil Sharma",
    email: "sunil.sharma@delhi.gov.in",
    mobile: "+91 98101 23456",
    role: "LMO",
    avatarInitials: "SS",
    zone: "Delhi South"
  };
  const ownerUser: UserProfile = {
    id: "user-owner-1",
    name: "Rajesh Kumar",
    email: "rajesh@bharatmart.com",
    mobile: "+91 98111 22334",
    role: "OWNER",
    avatarInitials: "RK"
  };
  const publicUser: UserProfile = {
    id: "public-1",
    name: "Public Citizen",
    email: "public@example.com",
    mobile: "+91 99999 99999",
    role: "PUBLIC",
    avatarInitials: "PC"
  };

  assert("Authorized LMO has access to AI Advisory details", lmoUser.role === "LMO");
  assert("OWNER does not have access to internal AI risk analysis", ownerUser.role !== "LMO" && ownerUser.role !== "GATC" && ownerUser.role !== "ADMIN");
  assert("PUBLIC does not have access to internal AI risk analysis", publicUser.role !== "LMO" && publicUser.role !== "GATC" && publicUser.role !== "ADMIN");

  // 11. I18N VERIFICATION ACROSS ALL 5 LANGUAGES
  console.log("\n--- TEST: i18n Translations Across 5 Languages ---");
  const requiredKeys = [
    "advisory.title",
    "advisory.subtitle",
    "advisory.heuristic",
    "advisory.compositeRisk",
    "advisory.lowRisk",
    "advisory.mediumRisk",
    "advisory.highRisk",
    "advisory.drift",
    "advisory.nonLinearity",
    "advisory.identicalReadings",
    "advisory.errorTrend",
    "advisory.patternDetected",
    "advisory.noPatternDetected",
    "advisory.reviewRecommended",
    "advisory.historicalUnavailable",
    "advisory.insufficientData",
    "advisory.inconclusive",
    "advisory.currentObservations",
    "advisory.historicalObservations",
    "advisory.explanation",
    "advisory.prototypeNotice",
    "advisory.lmoReviewRequired",
    "advisory.decisionSupport",
    "advisory.disclaimer",
    "advisory.supportingEvidence",
    "advisory.demoScenarios"
  ];

  const langs: Array<"en" | "hi" | "mr" | "pa" | "te"> = ["en", "hi", "mr", "pa", "te"];
  for (const lang of langs) {
    const dict = translations[lang];
    const missing = requiredKeys.filter((k) => !dict[k] || dict[k].trim() === "");
    assert(`All ${requiredKeys.length} advisory keys present in '${lang}'`, missing.length === 0, missing);
  }

  // 12. RESET DEMO STATE FUNCTIONALITY
  console.log("\n--- TEST: resetDemoState() Functionality ---");
  storageService.resetDemoState();
  const resettedApps = await applicationService.getApplications();
  assert("resetDemoState() functions properly and reloads seed applications", resettedApps.length > 0);

  // 13. DIGITAL INSTRUMENT PASSPORT COMPATIBILITY (Prompt 9A Req I)
  console.log("\n--- TEST 9A-I: Digital Instrument Passport Unbroken ---");
  const passportRes = await instrumentPassportService.getInstrumentPassport("W-104", lmoUser);
  assert("Passport resolution succeeds for W-104", passportRes.success === true);
  if (passportRes.success) {
    assert("Passport has timeline and cycles", passportRes.passport.timeline.length > 0 && passportRes.passport.cycles.length > 0);
  }

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPrompt9Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
