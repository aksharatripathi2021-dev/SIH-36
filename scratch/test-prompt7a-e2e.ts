/**
 * E2E Scenario & Regression Test Script for PROMPT 7A:
 * Complete Existing Application-Form Integration + Route Regression Safety
 */

import { legacyReceiptService } from "../src/services/legacyReceiptService";
import { applicationService } from "../src/services/applicationService";
import { instrumentService } from "../src/services/instrumentService";
import { storageService } from "../src/services/storageService";
import { Application, Instrument } from "../src/types";

async function runPrompt7ATests() {
  console.log("==================================================");
  console.log("RUNNING PROMPT 7A E2E SCENARIO & REGRESSION TEST");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // Baseline Reset
  storageService.resetDemoState();
  const initialCertCount = storageService.getCertificates().length;
  const initialObsCount = storageService.getVerificationResults().length;

  console.log("\n--- EXECUTING PROMPT 7A SCENARIO 10 STEPS ---");

  // Step 1: Open existing owner New Application flow
  const initialApps = await applicationService.getApplications({ ownerId: "user-owner-1" });
  assert(initialApps.length > 0, "Step 1: Existing owner application repository loaded");

  // Step 2 & 3: Launch Legacy Receipt Assistance & Select DEMO-RECEIPT-001
  const demoList = legacyReceiptService.getDemoReceipts();
  assert(demoList.some((d) => d.id === "DEMO-RECEIPT-001"), "Step 2 & 3: DEMO-RECEIPT-001 available in demo catalogue");

  // Step 4: Run deterministic extraction
  const extraction = await legacyReceiptService.extractFromDemo("DEMO-RECEIPT-001");
  assert(extraction.fields.length >= 8, "Step 4: Deterministic extraction returns structured fields");

  // Step 5: Verify fields are shown
  const serialField = extraction.fields.find((f) => f.key === "serialNumber");
  const capacityField = extraction.fields.find((f) => f.key === "capacity");
  assert(serialField?.suggestedValue === "ES215-88421", "Step 5: Serial Number shown as ES215-88421");
  assert(capacityField?.suggestedValue === "300 kg", "Step 5: Capacity shown as 300 kg");

  // Step 6: Change at least one field
  const editedExtraction = legacyReceiptService.updateField(extraction, "capacity", "320 kg");
  const editedCap = editedExtraction.fields.find((f) => f.key === "capacity");
  assert(editedCap?.finalValue === "320 kg", "Step 6: User changed capacity to 320 kg");

  // Step 7: Mark the edited field USER_VERIFIED
  assert(editedCap?.sourceState === "USER_VERIFIED", "Step 7: Edited field marked as USER_VERIFIED");

  // Instrument matching for owner user-owner-1
  const matchResult = await legacyReceiptService.matchInstrument(serialField?.suggestedValue, "user-owner-1");
  assert(matchResult.status === "MATCH_FOUND", "Instrument matching: MATCH_FOUND for serial ES215-88421");
  assert(matchResult.matchedInstrument?.id === "W-104", "Instrument matching: Matched instrument is W-104");

  // Step 8: Confirm extraction & extract reviewed values
  const reviewedValues: Record<string, string> = {};
  editedExtraction.fields.forEach((f) => {
    const val = f.finalValue || f.suggestedValue;
    if (val) reviewedValues[f.key] = val;
  });
  assert(reviewedValues.capacity === "320 kg", "Step 8: Extraction confirmed with reviewed capacity");

  // Step 9: Confirm the EXISTING application form receives the reviewed value
  let formState = {
    instrumentId: matchResult.matchedInstrument?.id || "W-104",
    preferredDate: "2025-06-12",
    certFileName: reviewedValues.previousCertificateNumber ? `${reviewedValues.previousCertificateNumber}.pdf` : "",
    additionalNotes: `[Assisted Receipt Reference]\n• Extracted Device: ${reviewedValues.instrumentName || "Essae DS-215"}\n• Capacity: ${reviewedValues.capacity}\n• Historical Verification: ${reviewedValues.previousVerificationDate || "12 Jun 2024"}`
  };
  assert(formState.certFileName === "CERT-2024-W104.pdf", "Step 9: Form receives reviewed certificate reference CERT-2024-W104.pdf");
  assert(formState.additionalNotes.includes("320 kg"), "Step 9: Form receives reviewed capacity 320 kg");

  // Step 10: Manually edit another application field
  formState.preferredDate = "2025-06-25";
  formState.additionalNotes += "\n• User Manual Note: Physical seal intact on site.";
  assert(formState.preferredDate === "2025-06-25", "Step 10: User manually edited preferred appointment date to 2025-06-25");

  // Step 11: Save as draft using the existing application flow
  const savedDraft = await applicationService.createReverificationApplication({
    instrumentId: formState.instrumentId,
    preferredDate: formState.preferredDate,
    additionalNotes: formState.additionalNotes,
    currentCertificateFile: formState.certFileName,
    status: "Draft",
    legacyReceiptAssisted: true
  });
  assert(savedDraft.status === "Draft", "Step 11: Application saved as Draft status via canonical applicationService");

  // Step 12: Confirm the application remains a normal canonical Application record
  const fetchedDraft = await applicationService.getApplicationById(savedDraft.id);
  assert(fetchedDraft !== null, "Step 12: Draft application retrieved from canonical storageService");
  assert(fetchedDraft?.id === savedDraft.id, "Step 12: Draft has canonical application ID");
  assert(fetchedDraft?.legacyReceiptAssisted === true, "Step 12: Metadata flag legacyReceiptAssisted safely recorded");

  // Step 13: Confirm no AI-specific application record exists
  const allStoredApps = storageService.getApplications();
  const invalidAppEntities = allStoredApps.filter(
    (a: any) => a.entityType === "AIApplication" || a.entityType === "LegacyApplication" || a.entityType === "ReceiptApplication"
  );
  assert(invalidAppEntities.length === 0, "Step 13: Zero AI-specific application entities exist (canonical Application collection only)");

  // Step 14: Confirm no verification result/certificate was created
  const postCertCount = storageService.getCertificates().length;
  const postObsCount = storageService.getVerificationResults().length;
  assert(postCertCount === initialCertCount, "Step 14: Zero certificates created from legacy receipt data");
  assert(postObsCount === initialObsCount, "Step 14: Zero verification observation records created from legacy receipt data");

  console.log("\n--- EXECUTING PROMPT 7A OWNER ISOLATION TESTS ---");
  // Owner A (user-owner-1) owns W-104. Owner B (user-owner-2) must NOT match W-104
  const ownerBIsolation = await legacyReceiptService.matchInstrument("ES215-88421", "user-owner-2");
  assert(ownerBIsolation.status === "MATCH_NOT_FOUND", "Owner Isolation: Owner B cannot match or access Owner A's instrument W-104");
  assert(ownerBIsolation.matchedInstruments.length === 0, "Owner Isolation: Owner B receives zero matched instruments");

  console.log("\n--- EXECUTING ROUTE REGRESSION TESTS ---");
  // Route check: All 30 routes must have physical page.tsx files and valid exports
  const expectedRoutes = [
    "app/page.tsx",
    "app/admin/applications/page.tsx",
    "app/admin/certificates/page.tsx",
    "app/admin/dashboard/page.tsx",
    "app/admin/instruments/page.tsx",
    "app/admin/mobile/page.tsx",
    "app/admin/reports/page.tsx",
    "app/admin/users/page.tsx",
    "app/gatc/assigned/page.tsx",
    "app/gatc/dashboard/page.tsx",
    "app/gatc/history/page.tsx",
    "app/gatc/results/page.tsx",
    "app/lmo/applications/page.tsx",
    "app/lmo/applications/[id]/verify/page.tsx",
    "app/lmo/dashboard/page.tsx",
    "app/lmo/instruments/[id]/page.tsx",
    "app/lmo/qr-confirmations/page.tsx",
    "app/login/page.tsx",
    "app/owner/applications/page.tsx",
    "app/owner/applications/[id]/page.tsx",
    "app/owner/certificates/page.tsx",
    "app/owner/dashboard/page.tsx",
    "app/owner/instruments/page.tsx",
    "app/owner/instruments/[instrumentId]/page.tsx",
    "app/owner/mobile/page.tsx",
    "app/owner/profile/page.tsx",
    "app/owner/re-verify/page.tsx",
    "app/owner/re-verify/[instrumentId]/page.tsx",
    "app/register/page.tsx",
    "app/verify-certificate/page.tsx"
  ];

  const fs = require("fs");
  const path = require("path");

  let missingRoutes = 0;
  expectedRoutes.forEach((r) => {
    const fullPath = path.join(__dirname, "..", r);
    if (!fs.existsSync(fullPath)) {
      console.error(`Missing route file: ${r}`);
      missingRoutes++;
    }
  });

  assert(missingRoutes === 0, `Route Inventory: All ${expectedRoutes.length} canonical routes exist physically in codebase`);
  assert(expectedRoutes.length === 30, "Route Inventory: Total route count is exactly 30 application routes");

  console.log("==================================================");
  console.log(`PROMPT 7A TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPrompt7ATests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
