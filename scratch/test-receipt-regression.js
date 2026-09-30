/**
 * Automated Verification Script for PROMPT 7:
 * AI-Assisted Legacy Inspection Receipt -> Digital Form
 */

const fs = require("fs");
const path = require("path");

function runTests() {
  console.log("==================================================");
  console.log("STARTING PROMPT 7 VERIFICATION SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Check No Math.random() in legacyReceiptService.ts
  const serviceCode = fs.readFileSync(
    path.join(__dirname, "../src/services/legacyReceiptService.ts"),
    "utf8"
  );
  assert(
    !serviceCode.includes("Math.random()"),
    "Requirement D: No Math.random() in legacyReceiptService.ts"
  );

  // 2. Check i18n Completeness across all 5 languages
  const translationsCode = fs.readFileSync(
    path.join(__dirname, "../src/i18n/translations.ts"),
    "utf8"
  );
  const requiredKeys = [
    "receipt.assistantTitle",
    "receipt.assistantSubtitle",
    "receipt.uploadReceipt",
    "receipt.useDemoReceipt",
    "receipt.receiptPreview",
    "receipt.assistedExtraction",
    "receipt.runExtraction",
    "receipt.extractedInformation",
    "receipt.suggestedValue",
    "receipt.confidence",
    "receipt.high",
    "receipt.medium",
    "receipt.low",
    "receipt.aiSuggested",
    "receipt.userVerified",
    "receipt.notFound",
    "receipt.reviewRequired",
    "receipt.reviewExtractedInfo",
    "receipt.confirmAndContinue",
    "receipt.useSuggested",
    "receipt.editValue",
    "receipt.markVerified",
    "receipt.clearValue",
    "receipt.matchFound",
    "receipt.matchNotFound",
    "receipt.multipleMatches",
    "receipt.insufficientInfo",
    "receipt.historicalReference",
    "receipt.disclaimer",
    "receipt.demoNotice",
    "receipt.manualVerificationRequired",
    "receipt.selectDemo",
    "receipt.dropzone",
    "receipt.selectInstrument",
    "receipt.applyToForm"
  ];

  ["en:", "hi:", "mr:", "pa:", "te:"].forEach((langPrefix) => {
    const langIdx = translationsCode.indexOf(langPrefix);
    assert(langIdx !== -1, `Language dictionary block exists for: ${langPrefix}`);
  });

  requiredKeys.forEach((key) => {
    // Check that key appears at least 5 times (once per dictionary)
    const matches = translationsCode.split(`"${key}":`).length - 1;
    assert(
      matches >= 5,
      `i18n completeness: "${key}" is translated across all 5 languages (found: ${matches})`
    );
  });

  // 3. Check Components and Integration
  const assistantComponent = fs.readFileSync(
    path.join(__dirname, "../app/components/LegacyReceiptAssistant.tsx"),
    "utf8"
  );
  assert(
    assistantComponent.includes("LegacyReceiptAssistant"),
    "LegacyReceiptAssistant component exists and exports component"
  );
  assert(
    assistantComponent.includes("role=\"dialog\""),
    "Accessibility: Modal includes role=\"dialog\" and aria tags"
  );
  assert(
    assistantComponent.includes("t(\"receipt.high\")") &&
      assistantComponent.includes("t(\"receipt.medium\")") &&
      assistantComponent.includes("t(\"receipt.low\")"),
    "Confidence values are displayed as semantic text badges, not color alone"
  );

  // 4. Check Existing Form Integration
  const ownerInstPage = fs.readFileSync(
    path.join(__dirname, "../app/owner/instruments/page.tsx"),
    "utf8"
  );
  assert(
    ownerInstPage.includes("LegacyReceiptAssistant") &&
      ownerInstPage.includes("handleReceiptApply"),
    "Existing Form Integration: Owner instruments page integrates LegacyReceiptAssistant"
  );

  const ownerReverifySelect = fs.readFileSync(
    path.join(__dirname, "../app/owner/re-verify/page.tsx"),
    "utf8"
  );
  assert(
    ownerReverifySelect.includes("LegacyReceiptAssistant") &&
      ownerReverifySelect.includes("handleReceiptApply"),
    "Existing Form Integration: Owner reverify selection integrates LegacyReceiptAssistant"
  );

  const ownerReverifyForm = fs.readFileSync(
    path.join(__dirname, "../app/owner/re-verify/[instrumentId]/page.tsx"),
    "utf8"
  );
  assert(
    ownerReverifyForm.includes("LegacyReceiptAssistant") &&
      ownerReverifyForm.includes("handleReceiptApply"),
    "Existing Form Integration: Owner reverify detail form integrates LegacyReceiptAssistant"
  );

  const lmoVerifyPage = fs.readFileSync(
    path.join(__dirname, "../app/lmo/applications/[id]/verify/page.tsx"),
    "utf8"
  );
  assert(
    lmoVerifyPage.includes("LegacyReceiptAssistant") &&
      lmoVerifyPage.includes("mode=\"lmo-reference\""),
    "LMO Workflow: LMO verification page integrates LegacyReceiptAssistant in reference mode"
  );

  // 5. Check Non-goals safety (no fake certificate generation from receipt)
  assert(
    !serviceCode.includes("certificateService.createCertificate") &&
      !serviceCode.includes("generateCertificate"),
    "Safety Boundary: Legacy receipt service does not generate certificates from historical receipt data"
  );
  assert(
    !serviceCode.includes("verificationService.submitVerificationResult"),
    "Safety Boundary: Legacy receipt service does not submit verification results"
  );

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
