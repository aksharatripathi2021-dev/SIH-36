/**
 * PROMPT 10A: STRICT LMO JURISDICTION NORMALIZATION TEST SUITE
 */

import { normalizeZoneLabel, zonesMatch } from "../src/utils/jurisdictionUtils";
import { qrStickerService } from "../src/services/qrStickerService";
import { storageService } from "../src/services/storageService";
import { instrumentPassportService } from "../src/services/instrumentPassportService";
import { UserProfile } from "../src/types";

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, extra?: any) {
  if (condition) {
    console.log(`✓ [PASS] ${description}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${description}`, extra !== undefined ? extra : "");
    failed++;
  }
}

async function runPrompt10ATests() {
  console.log("==================================================================");
  console.log("PROMPT 10A: STRICT LMO JURISDICTION NORMALIZATION TEST SUITE");
  console.log("==================================================================");

  // ------------------------------------------------------------------
  // 1. UNIT TESTS: normalizeZoneLabel
  // ------------------------------------------------------------------
  console.log("\n--- Part 1: Token Normalization Unit Tests ---");

  const tokensA = normalizeZoneLabel("Delhi South Zone");
  assert("normalizeZoneLabel('Delhi South Zone') -> ['delhi', 'south']", 
    JSON.stringify(tokensA) === JSON.stringify(["delhi", "south"]));

  const tokensB = normalizeZoneLabel("South Delhi Zone");
  assert("normalizeZoneLabel('South Delhi Zone') -> ['delhi', 'south']", 
    JSON.stringify(tokensB) === JSON.stringify(["delhi", "south"]));

  const tokensC = normalizeZoneLabel("Delhi-South-Zone");
  assert("normalizeZoneLabel('Delhi-South-Zone') -> ['delhi', 'south']", 
    JSON.stringify(tokensC) === JSON.stringify(["delhi", "south"]));

  const tokensD = normalizeZoneLabel("Delhi / South / Zone");
  assert("normalizeZoneLabel('Delhi / South / Zone') -> ['delhi', 'south']", 
    JSON.stringify(tokensD) === JSON.stringify(["delhi", "south"]));

  const tokensE = normalizeZoneLabel("Delhi   South   Zone");
  assert("normalizeZoneLabel('Delhi   South   Zone') -> ['delhi', 'south']", 
    JSON.stringify(tokensE) === JSON.stringify(["delhi", "south"]));

  const tokensEmpty = normalizeZoneLabel("");
  assert("normalizeZoneLabel('') returns empty array []", tokensEmpty.length === 0);

  const tokensNull = normalizeZoneLabel(null);
  assert("normalizeZoneLabel(null) returns empty array []", tokensNull.length === 0);

  const tokensUndefined = normalizeZoneLabel(undefined);
  assert("normalizeZoneLabel(undefined) returns empty array []", tokensUndefined.length === 0);

  // ------------------------------------------------------------------
  // 2. REQUIRED TEST MATRIX (A through I)
  // ------------------------------------------------------------------
  console.log("\n--- Part 2: Required Test Matrix (A through I) ---");

  // A. Exact same string
  const resA = zonesMatch("Delhi South Zone", "Delhi South Zone");
  assert("Matrix A: Exact same string ('Delhi South Zone' vs 'Delhi South Zone') -> MATCH", resA === true);

  // B. Word order difference
  const resB = zonesMatch("Delhi South Zone", "South Delhi Zone");
  assert("Matrix B: Word order difference ('Delhi South Zone' vs 'South Delhi Zone') -> MATCH", resB === true);

  // C. Punctuation difference
  const resC1 = zonesMatch("Delhi-South-Zone", "Delhi South Zone");
  assert("Matrix C1: Punctuation difference ('Delhi-South-Zone' vs 'Delhi South Zone') -> MATCH", resC1 === true);

  const resC2 = zonesMatch("Delhi / South / Zone", "Delhi South Zone");
  assert("Matrix C2: Slash separators ('Delhi / South / Zone' vs 'Delhi South Zone') -> MATCH", resC2 === true);

  // D. Extra whitespace
  const resD = zonesMatch("Delhi   South   Zone", "South Delhi Zone");
  assert("Matrix D: Extra whitespace ('Delhi   South   Zone' vs 'South Delhi Zone') -> MATCH", resD === true);

  // E. North vs South (Negative match)
  const resE = zonesMatch("Delhi South Zone", "Delhi North Zone");
  assert("Matrix E: North vs South ('Delhi South Zone' vs 'Delhi North Zone') -> NO MATCH (DENIED)", resE === false);

  // F. South vs Central (Negative match)
  const resF = zonesMatch("Delhi South Zone", "Delhi Central Zone");
  assert("Matrix F: South vs Central ('Delhi South Zone' vs 'Delhi Central Zone') -> NO MATCH (DENIED)", resF === false);

  // G. Delhi vs Mumbai (Negative match)
  const resG = zonesMatch("Delhi South Zone", "Mumbai South Zone");
  assert("Matrix G: Delhi vs Mumbai ('Delhi South Zone' vs 'Mumbai South Zone') -> NO MATCH (DENIED)", resG === false);

  // H. Empty value
  const resH1 = zonesMatch("", "Delhi South Zone");
  assert("Matrix H1: Empty string vs valid zone -> NO MATCH (DENIED)", resH1 === false);

  const resH2 = zonesMatch("Delhi South Zone", "");
  assert("Matrix H2: Valid zone vs empty string -> NO MATCH (DENIED)", resH2 === false);

  const resH3 = zonesMatch("", "");
  assert("Matrix H3: Empty string vs empty string -> NO MATCH (DENIED)", resH3 === false);

  // I. Null/undefined defensive handling
  const resI1 = zonesMatch(null, "Delhi South Zone");
  assert("Matrix I1: null vs valid zone -> NO MATCH (DENIED)", resI1 === false);

  const resI2 = zonesMatch("Delhi South Zone", undefined);
  assert("Matrix I2: valid zone vs undefined -> NO MATCH (DENIED)", resI2 === false);

  const resI3 = zonesMatch(undefined, null);
  assert("Matrix I3: undefined vs null -> NO MATCH (DENIED)", resI3 === false);

  // ------------------------------------------------------------------
  // 3. JURISDICTION SAFETY & SERVICE LEVEL AUDIT (Matrix J)
  // ------------------------------------------------------------------
  console.log("\n--- Part 3: Service-Level Jurisdiction Security (Matrix J) ---");
  storageService.resetDemoState();

  // Setup: add 2 pending sticker confirmations in different zones
  const southDelhiSticker = {
    id: "STK-TEST-SOUTH",
    certificateId: "CERT-TEST-SOUTH",
    instrumentId: "W-104",
    applicationId: "APP-TEST-SOUTH",
    ownerId: "user-owner-1",
    evidence: { id: "ev1", filename: "south.jpg", type: "image" as const, url: "http://example.com/south.jpg" },
    submittedAt: "Today",
    status: "PENDING" as const,
    zone: "South Delhi Zone"
  };

  const northDelhiSticker = {
    id: "STK-TEST-NORTH",
    certificateId: "CERT-TEST-NORTH",
    instrumentId: "W-999",
    applicationId: "APP-TEST-NORTH",
    ownerId: "user-owner-1",
    evidence: { id: "ev2", filename: "north.jpg", type: "image" as const, url: "http://example.com/north.jpg" },
    submittedAt: "Today",
    status: "PENDING" as const,
    zone: "Delhi North Zone"
  };

  const mumbaiSticker = {
    id: "STK-TEST-MUMBAI",
    certificateId: "CERT-TEST-MUMBAI",
    instrumentId: "W-888",
    applicationId: "APP-TEST-MUMBAI",
    ownerId: "user-owner-1",
    evidence: { id: "ev3", filename: "mumbai.jpg", type: "image" as const, url: "http://example.com/mumbai.jpg" },
    submittedAt: "Today",
    status: "PENDING" as const,
    zone: "Mumbai South Zone"
  };

  storageService.saveStickerConfirmations([southDelhiSticker, northDelhiSticker, mumbaiSticker]);

  // LMO South Delhi officer querying pending confirmations
  const southLmoOfficer: UserProfile = {
    id: "user-lmo-south",
    name: "Priya Sharma",
    role: "LMO",
    zone: "Delhi South Zone",
    email: "lmo.south@gov.in",
    mobile: "9810012345",
    avatarInitials: "PS"
  };

  const pendingForSouthLmo = await qrStickerService.getPendingStickerConfirmationsForLmo(
    southLmoOfficer.id,
    southLmoOfficer.zone
  );

  assert("LMO with 'Delhi South Zone' sees 'South Delhi Zone' sticker", 
    pendingForSouthLmo.some((s) => s.id === "STK-TEST-SOUTH"));

  assert("LMO with 'Delhi South Zone' is strictly BLOCKED from seeing 'Delhi North Zone' sticker", 
    !pendingForSouthLmo.some((s) => s.id === "STK-TEST-NORTH"));

  assert("LMO with 'Delhi South Zone' is strictly BLOCKED from seeing 'Mumbai South Zone' sticker", 
    !pendingForSouthLmo.some((s) => s.id === "STK-TEST-MUMBAI"));

  assert("LMO receives only authorized zone sticker (count === 1)", pendingForSouthLmo.length === 1);

  // Cross-jurisdiction review mutation attempts must throw Access denied errors
  let approveCrossZoneBlocked = false;
  try {
    await qrStickerService.approveStickerConfirmation(
      "STK-TEST-NORTH",
      southLmoOfficer.id,
      "Attempting cross-zone approval",
      southLmoOfficer.zone // "Delhi South Zone"
    );
  } catch (err: any) {
    if (err.message.includes("Access denied")) {
      approveCrossZoneBlocked = true;
    }
  }
  assert("Cross-zone approval attempt threw 'Access denied' error", approveCrossZoneBlocked === true);

  let correctCrossZoneBlocked = false;
  try {
    await qrStickerService.requestStickerCorrection(
      "STK-TEST-NORTH",
      southLmoOfficer.id,
      "Attempting cross-zone correction",
      southLmoOfficer.zone // "Delhi South Zone"
    );
  } catch (err: any) {
    if (err.message.includes("Access denied")) {
      correctCrossZoneBlocked = true;
    }
  }
  assert("Cross-zone correction request threw 'Access denied' error", correctCrossZoneBlocked === true);

  // In-jurisdiction approval works seamlessly
  const approvedItem = await qrStickerService.approveStickerConfirmation(
    "STK-TEST-SOUTH",
    southLmoOfficer.id,
    "Verified within authorized jurisdiction",
    southLmoOfficer.zone // "Delhi South Zone"
  );
  assert("In-jurisdiction approval succeeds ('Delhi South Zone' -> 'South Delhi Zone')", approvedItem.status === "CONFIRMED");

  // Test LMO Passport Jurisdiction access
  const northLmoOfficer: UserProfile = {
    id: "user-lmo-north",
    name: "North Officer",
    role: "LMO",
    zone: "Delhi North Zone",
    email: "lmo.north@gov.in",
    mobile: "9811122233",
    avatarInitials: "NO"
  };

  // W-104 has applications in Delhi South Zone
  const passportForNorth = await instrumentPassportService.getInstrumentPassport("W-104", northLmoOfficer);
  assert("LMO North Officer is BLOCKED from accessing South Zone instrument passport", passportForNorth.success === false);

  const passportForSouth = await instrumentPassportService.getInstrumentPassport("W-104", southLmoOfficer);
  assert("LMO South Officer successfully accesses South Zone instrument passport", passportForSouth.success === true);

  // Clean reset
  storageService.resetDemoState();

  console.log(`\n==================================================================`);
  console.log(`PROMPT 10A TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPrompt10ATests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
