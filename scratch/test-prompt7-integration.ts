import { legacyReceiptService, DEMO_RECEIPTS } from "../src/services/legacyReceiptService";
import { instrumentService } from "../src/services/instrumentService";
import { storageService } from "../src/services/storageService";

async function main() {
  console.log("==================================================");
  console.log("RUNNING TSX RUNTIME INTEGRATION TEST FOR PROMPT 7");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Demo receipt catalogue check
  const demos = legacyReceiptService.getDemoReceipts();
  assert(demos.length === 3, "getDemoReceipts returns exactly 3 deterministic demo receipts");
  assert(demos[0].id === "DEMO-RECEIPT-001", "DEMO-RECEIPT-001 exists");
  assert(demos[1].id === "DEMO-RECEIPT-002", "DEMO-RECEIPT-002 exists");
  assert(demos[2].id === "DEMO-RECEIPT-003", "DEMO-RECEIPT-003 exists");

  // 2. Deterministic extraction: Run 3 times on DEMO-RECEIPT-001, verify identical results
  const ext1 = await legacyReceiptService.extractFromDemo("DEMO-RECEIPT-001");
  const ext2 = await legacyReceiptService.extractFromDemo("DEMO-RECEIPT-001");
  const ext3 = await legacyReceiptService.extractFromDemo("DEMO-RECEIPT-001");

  assert(
    JSON.stringify(ext1.fields) === JSON.stringify(ext2.fields) &&
    JSON.stringify(ext2.fields) === JSON.stringify(ext3.fields),
    "Deterministic Extraction: Same demo receipt returns identical output every single invocation (no Math.random)"
  );

  // 3. Field details check for DEMO-RECEIPT-001
  const serialField = ext1.fields.find((f) => f.key === "serialNumber");
  assert(serialField?.suggestedValue === "ES215-88421", "DEMO-RECEIPT-001 extracted serial ES215-88421");
  assert(serialField?.confidence === "HIGH", "DEMO-RECEIPT-001 serial has HIGH confidence");
  assert(serialField?.sourceState === "AI_SUGGESTED", "DEMO-RECEIPT-001 initial state is AI_SUGGESTED");

  // 4. Low-confidence behavior check in DEMO-RECEIPT-002
  const extDemo2 = await legacyReceiptService.extractFromDemo("DEMO-RECEIPT-002");
  const accuracyField = extDemo2.fields.find((f) => f.key === "accuracyClass");
  assert(accuracyField?.confidence === "LOW", "DEMO-RECEIPT-002 missing accuracyClass has LOW confidence");
  assert(accuracyField?.sourceState === "NOT_FOUND", "DEMO-RECEIPT-002 missing field is NOT_FOUND");

  const prevCertField = extDemo2.fields.find((f) => f.key === "previousCertificateNumber");
  assert(prevCertField?.confidence === "LOW", "DEMO-RECEIPT-002 faint previousCertificateNumber has LOW confidence");
  assert(prevCertField?.sourceState === "AI_SUGGESTED", "DEMO-RECEIPT-002 low confidence field is AI_SUGGESTED (not auto-verified)");

  // 5. User Edit & Verification workflow
  const updated = legacyReceiptService.updateField(ext1, "capacity", "350 kg");
  const updatedCapField = updated.fields.find((f) => f.key === "capacity");
  assert(updatedCapField?.finalValue === "350 kg", "Editing field updates finalValue");
  assert(updatedCapField?.sourceState === "USER_VERIFIED", "Editing field transitions sourceState to USER_VERIFIED");

  const cleared = legacyReceiptService.clearField(ext1, "remarks");
  const clearedRemarks = cleared.fields.find((f) => f.key === "remarks");
  assert(clearedRemarks?.finalValue === "", "Clearing field sets finalValue to empty");
  assert(clearedRemarks?.sourceState === "NOT_FOUND", "Clearing field sets sourceState to NOT_FOUND");

  // 6. Instrument matching behavior
  // Match known serial
  const match1 = await legacyReceiptService.matchInstrument("ES215-88421");
  assert(match1.status === "MATCH_FOUND", "Serial ES215-88421 results in MATCH_FOUND");
  assert(match1.matchedInstrument?.id === "W-104", "Matched instrument is W-104");

  // Match unknown serial
  const match2 = await legacyReceiptService.matchInstrument("FM-NEW-771");
  assert(match2.status === "MATCH_NOT_FOUND", "Unknown serial FM-NEW-771 results in MATCH_NOT_FOUND");
  assert(match2.matchedInstruments.length === 0, "No instruments linked when MATCH_NOT_FOUND");

  // Insufficient info
  const match3 = await legacyReceiptService.matchInstrument("");
  assert(match3.status === "INSUFFICIENT_INFO", "Empty serial results in INSUFFICIENT_INFO");

  // 7. Owner isolation test
  // W-104 belongs to user-owner-1. If user-owner-2 searches for it, owner isolation filters it out.
  const matchOwnerIsolated = await legacyReceiptService.matchInstrument("ES215-88421", "user-owner-2");
  assert(
    matchOwnerIsolated.status === "MATCH_NOT_FOUND",
    "Owner Isolation: Trader user-owner-2 cannot match or access another trader's instrument W-104"
  );

  // 8. Arbitrary file upload fallback test
  const fakeFile = {
    name: "scanned_receipt_offline_2024.jpg",
    type: "image/jpeg",
    size: 204800
  } as File;
  const uploadExt = await legacyReceiptService.extractFromUpload(fakeFile);
  assert(uploadExt.sourceType === "image", "Uploaded file correctly identified as image");
  assert(uploadExt.extractionStatus === "REVIEW_REQUIRED", "Uploaded arbitrary file marked REVIEW_REQUIRED");
  assert(
    uploadExt.fields.some((f) => f.confidence === "LOW"),
    "Uploaded arbitrary file requires review on low-confidence fallback fields without claiming real OCR"
  );

  console.log("==================================================");
  console.log(`TSX RUNTIME TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Runtime test failed:", err);
  process.exit(1);
});
