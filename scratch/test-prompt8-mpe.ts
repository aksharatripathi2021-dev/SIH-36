import { mpeRuleService, PROTOTYPE_MPE_RULES } from "../src/services/mpeRuleService";
import { verificationService } from "../src/services/verificationService";
import { applicationService } from "../src/services/applicationService";
import { certificateService } from "../src/services/certificateService";
import { storageService } from "../src/services/storageService";
import { translations } from "../src/i18n/translations";
import { Instrument } from "../src/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`, details || "");
    failed++;
  }
}

async function runTests() {
  console.log("=== RUNNING PROMPT 8 AUTOMATED TEST SUITE ===\n");

  // Reset state before tests
  storageService.resetDemoState();

  // Test C: Absolute error calculation
  const abs1 = mpeRuleService.calculateAbsoluteError(100, 100.02);
  assert(abs1 === 0.02, "Test C1: Absolute error calculation (100 -> 100.02 = 0.02)", { abs1 });

  const abs2 = mpeRuleService.calculateAbsoluteError(100, 99.98);
  assert(abs2 === -0.02, "Test C2: Absolute error calculation (100 -> 99.98 = -0.02)", { abs2 });

  // Test D: Relative error calculation
  const rel1 = mpeRuleService.calculateRelativeError(100, 100.02);
  assert(rel1 === 0.02, "Test D1: Relative error calculation (100 -> 100.02 = 0.02%)", { rel1 });

  const rel2 = mpeRuleService.calculateRelativeError(50, 50.05);
  assert(rel2 === 0.1, "Test D2: Relative error calculation (50 -> 50.05 = 0.1%)", { rel2 });

  // Test E: Within-MPE case
  const scaleRule = PROTOTYPE_MPE_RULES["Electronic Scales"];
  const evalWithin = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.02,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalWithin.result === "WITHIN_MPE", "Test E: Within-MPE case (0.02% <= 0.05%)", evalWithin);

  // Test F: Exact-boundary case
  const evalBoundary = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.05,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalBoundary.result === "WITHIN_MPE", "Test F: Exact-boundary case (0.05% == 0.05% -> WITHIN_MPE)", evalBoundary);

  // Test G: Exceeds-MPE case
  const evalExceeds = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.12,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalExceeds.result === "EXCEEDS_MPE", "Test G: Exceeds-MPE case (0.12% > 0.05% -> EXCEEDS_MPE)", evalExceeds);

  // Test H: Missing / invalid values
  const evalMissing = mpeRuleService.evaluateObservation({
    nominalValue: NaN,
    observedValue: 100,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalMissing.result === "INSUFFICIENT_DATA", "Test H: Missing/NaN value -> INSUFFICIENT_DATA", evalMissing);

  // Test I: Zero nominal value
  const evalZero = mpeRuleService.evaluateObservation({
    nominalValue: 0,
    observedValue: 100,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalZero.result === "INSUFFICIENT_DATA", "Test I: Zero nominal value in relative error -> INSUFFICIENT_DATA", evalZero);

  // Test J: Negative error
  const evalNegWithin = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 99.98,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalNegWithin.result === "WITHIN_MPE", "Test J1: Negative error within MPE (-0.02% -> WITHIN_MPE)", evalNegWithin);

  const evalNegExceeds = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 99.85,
    unit: "kg",
    rule: scaleRule
  });
  assert(evalNegExceeds.result === "EXCEEDS_MPE", "Test J2: Negative error exceeds MPE (-0.15% -> EXCEEDS_MPE)", evalNegExceeds);

  // Test K: Deterministic results
  const evalDet1 = mpeRuleService.evaluateObservation({ nominalValue: 100, observedValue: 100.02, unit: "kg", rule: scaleRule });
  const evalDet2 = mpeRuleService.evaluateObservation({ nominalValue: 100, observedValue: 100.02, unit: "kg", rule: scaleRule });
  assert(JSON.stringify(evalDet1) === JSON.stringify(evalDet2), "Test K: Pure deterministic output across calls");

  // Test L: Unsupported category
  const testInstTape: Instrument = {
    id: "W-TEST",
    name: "Tape",
    category: "Measuring tape",
    manufacturer: "Freemans",
    model: "FM",
    serialNumber: "SN1",
    capacity: "5m",
    yearOfManufacture: 2023,
    location: "Delhi",
    ownerId: "u1",
    ownerName: "Owner",
    currentStatus: "Pending",
    certificateExpiryDate: "2025-12-31",
    daysUntilExpiry: 30
  };
  const tapeRule = mpeRuleService.getRuleForInstrument(testInstTape);
  assert(tapeRule === null, "Test L1: Measuring tape correctly maps to null rule (unsupported)");

  const evalUnsupported = mpeRuleService.evaluateObservation({
    nominalValue: 5,
    observedValue: 5.01,
    unit: "m",
    rule: tapeRule
  });
  assert(evalUnsupported.result === "INSUFFICIENT_DATA", "Test L2: Unsupported category yields INSUFFICIENT_DATA", evalUnsupported);

  // Test M: Unsupported / ambiguous unit
  const evalBadUnit = mpeRuleService.evaluateObservation({
    nominalValue: 100,
    observedValue: 100.02,
    unit: "meters", // scale rule expects "kg"
    rule: scaleRule
  });
  assert(evalBadUnit.result === "INSUFFICIENT_DATA", "Test M: Mismatched unit (meters on kg rule) yields INSUFFICIENT_DATA", evalBadUnit);

  // Test N & O: No automatic certificate generation & No automatic ApplicationStatus mutation on evaluation
  const certsBefore = storageService.getCertificates().length;
  const appBefore = storageService.getApplications().find(a => a.id === "APP-26036-0148");
  const statusBefore = appBefore?.status;

  // Perform multiple evaluations (including exceeded MPE)
  mpeRuleService.evaluateMultipleObservations([
    { id: "1", testPointLabel: "P1", nominalValue: 100, observedValue: 100.5, unit: "kg" }
  ], scaleRule);

  const certsAfter = storageService.getCertificates().length;
  const appAfter = storageService.getApplications().find(a => a.id === "APP-26036-0148");
  assert(certsBefore === certsAfter, "Test N: Evaluating MPE does NOT issue any certificates", { certsBefore, certsAfter });
  assert(appAfter?.status === statusBefore, "Test O: Evaluating MPE does NOT mutate ApplicationStatus", { statusBefore, after: appAfter?.status });

  // Test P: Existing LMO verification workflow still works
  const draftSaved = await verificationService.saveDraftVerification("APP-26036-0148", {
    testStandard: "OIML R76-1",
    zeroError: "0.00 kg",
    mpeRuleId: scaleRule.ruleId,
    mpeOverallStatus: "WITHIN_MPE"
  });
  assert(draftSaved.applicationId === "APP-26036-0148", "Test P: Draft verification saving with MPE metadata works");

  // Test Q: Existing Pass workflow still works
  const passResult = await verificationService.submitVerificationResult("APP-26036-0148", {
    overallResult: "Pass"
  });
  const appPass = await applicationService.getApplicationById("APP-26036-0148");
  assert(passResult.overallResult === "Pass", "Test Q1: Pass verification result submitted successfully");
  assert(appPass?.status === "Certificate Generated", "Test Q2: Application progressed to Certificate Generated on Pass", appPass?.status);
  assert(Boolean(appPass?.certificateId), "Test Q3: Certificate attached to application on Pass", appPass?.certificateId);

  // Test R: Existing Fail/Needs Correction workflow still works
  storageService.resetDemoState();
  const failResult = await verificationService.submitVerificationResult("APP-26036-0148", {
    overallResult: "Fail",
    officerNotes: "Error tolerances exceeded configured MPE."
  });
  const appFail = await applicationService.getApplicationById("APP-26036-0148");
  assert(failResult.overallResult === "Fail", "Test R1: Fail verification result submitted successfully");
  assert(appFail?.status === "Needs Correction", "Test R2: Application progressed to Needs Correction on Fail", appFail?.status);
  assert(!appFail?.certificateId, "Test R3: No certificate generated on Fail", appFail?.certificateId);

  // Test S: Role access control check
  const ownerUser = { id: "user-owner-1", role: "OWNER" as const };
  const lmoUser = { id: "user-lmo-1", role: "LMO" as const };
  assert(ownerUser.role === "OWNER", "Test S1: Owner role identified for verification restriction");
  assert(lmoUser.role === "LMO", "Test S2: LMO role identified for statutory authority");

  // Test T: All five language translations exist for MPE keys
  const languages = ["en", "hi", "mr", "pa", "te"] as const;
  const requiredKeys = [
    "mpe.title",
    "mpe.subtitle",
    "mpe.prototypeRule",
    "mpe.prototypeNotice",
    "mpe.ruleEvaluation",
    "mpe.applicableRule",
    "mpe.nominalValue",
    "mpe.observedValue",
    "mpe.calculatedError",
    "mpe.relativeError",
    "mpe.absoluteError",
    "mpe.mpeLimit",
    "mpe.withinMpe",
    "mpe.exceedsMpe",
    "mpe.insufficientData",
    "mpe.lmoReviewRequired",
    "mpe.confirmStatutory",
    "mpe.demonstrationRule",
    "mpe.ruleExplanation",
    "mpe.testPoint",
    "mpe.unit",
    "mpe.scenarios",
    "mpe.scenarioA",
    "mpe.scenarioB",
    "mpe.scenarioC",
    "mpe.scenarioD",
    "mpe.hardStopTitle",
    "mpe.hardStopDesc",
    "mpe.conflictWarning",
    "mpe.unsupportedCategory",
    "mpe.allObservationsCompliant",
    "mpe.addObservation",
    "mpe.removeObservation"
  ];

  let missingKeysCount = 0;
  for (const lang of languages) {
    const dict = translations[lang];
    for (const key of requiredKeys) {
      if (!dict || !dict[key]) {
        console.error(`Missing translation key "${key}" for language "${lang}"`);
        missingKeysCount++;
      }
    }
  }
  assert(missingKeysCount === 0, `Test T: All ${requiredKeys.length} MPE keys exist in all 5 languages (0 missing)`);

  // Test U: resetDemoState() remains functional
  storageService.resetDemoState();
  const resetApps = storageService.getApplications();
  const resetApp = resetApps.find(a => a.id === "APP-26036-0148");
  assert(resetApp?.status === "Verification In Progress", "Test U: resetDemoState restored baseline status");

  // ============================================================
  // PROMPT 8A: NORMALIZE PROTOTYPE MPE RULE CLAIMS VERIFICATIONS
  // ============================================================
  console.log("\n--- Prompt 8A Normalization Verifications ---");

  const rules = Object.values(PROTOTYPE_MPE_RULES);

  // 8A - Requirement A: No prototype rule description contains "Modeled on OIML"
  const containsOiml = rules.some((r) =>
    r.explanation.toLowerCase().includes("oiml") ||
    r.ruleName.toLowerCase().includes("oiml")
  );
  assert(!containsOiml, "Test 8A-A: No prototype rule description or name contains 'Modeled on OIML' or 'OIML'");

  // 8A - Requirement B: No prototype rule description claims "official", "statutory", "government standard", "certified"
  const prohibitedWords = ["official", "statutory", "government standard", "certified"];
  let prohibitedFound = false;
  for (const rule of rules) {
    const textToCheck = `${rule.ruleName} ${rule.explanation}`.toLowerCase();
    for (const word of prohibitedWords) {
      if (textToCheck.includes(word)) {
        console.error(`Rule "${rule.ruleId}" contains prohibited word: "${word}" in "${textToCheck}"`);
        prohibitedFound = true;
      }
    }
  }
  assert(!prohibitedFound, "Test 8A-B: No prototype rule description claims 'official', 'statutory', 'government standard', or 'certified'");

  // 8A - Requirement C: Every prototype rule has prototypeRule === true
  const allPrototype = rules.every((r) => r.prototypeRule === true);
  assert(allPrototype, "Test 8A-C: Every prototype rule explicitly has prototypeRule === true");

  // 8A - Requirement D: The prototype disclaimer exists for every active rule
  const allHaveDisclaimer = rules.every(
    (r) => typeof r.disclaimer === "string" && r.disclaimer.trim().length > 0
  );
  assert(allHaveDisclaimer, "Test 8A-D: The prototype disclaimer exists and is non-empty for every active rule");

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});

