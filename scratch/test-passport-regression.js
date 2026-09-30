const path = require('path');
const distDir = path.join(__dirname, 'dist');
const { instrumentPassportService } = require(path.join(distDir, 'src/services/instrumentPassportService'));
const { storageService } = require(path.join(distDir, 'src/services/storageService'));
const { instrumentService } = require(path.join(distDir, 'src/services/instrumentService'));
const { applicationService } = require(path.join(distDir, 'src/services/applicationService'));
const { certificateService } = require(path.join(distDir, 'src/services/certificateService'));
const { qrStickerService } = require(path.join(distDir, 'src/services/qrStickerService'));
const { verificationService } = require(path.join(distDir, 'src/services/verificationService'));
const { translations } = require(path.join(distDir, 'src/i18n/translations'));

async function runRegressionSuite() {
  console.log("==================================================");
  console.log("RUNNING DIGITAL INSTRUMENT PASSPORT REGRESSION SUITE");
  console.log("==================================================\n");

  const results = [];

  function assert(condition, testName, details) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      results.push({ name: testName, status: "PASS", details });
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      results.push({ name: testName, status: "FAIL", details });
      throw new Error(`Test failed: ${testName} - ${details}`);
    }
  }

  // Ensure fresh baseline
  storageService.resetDemoState();
  const users = storageService.getUsers();
  const ownerUser = users.find((u) => u.id === "user-owner-1");
  const otherOwner = users.find((u) => u.id === "user-freshkart") || {
    id: "user-other-owner",
    name: "Other Trader",
    email: "other@trader.in",
    mobile: "9876543210",
    role: "OWNER",
    avatarInitials: "OT"
  };
  const lmoUser = users.find((u) => u.role === "LMO");
  const publicUser = { id: "anon", name: "Public Citizen", role: "PUBLIC", email: "", mobile: "", avatarInitials: "P" };

  // --- Test C: Owner Isolation ---
  console.log("\n[Test C: Owner Isolation]");
  const ownerAccess = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser);
  assert(ownerAccess.success === true, "Owner can access own instrument passport (W-104)");

  const unauthorizedOwnerAccess = await instrumentPassportService.getInstrumentPassport("W-104", otherOwner);
  assert(
    unauthorizedOwnerAccess.success === false && unauthorizedOwnerAccess.error === "UNAUTHORIZED",
    "Owner A cannot access Owner B's instrument passport",
    `Expected UNAUTHORIZED, got ${JSON.stringify(unauthorizedOwnerAccess)}`
  );

  // --- Test D: LMO Access ---
  console.log("\n[Test D: LMO Scope Access]");
  const lmoAccess = await instrumentPassportService.getInstrumentPassport("W-104", lmoUser);
  assert(lmoAccess.success === true, "LMO can access instrument passport within jurisdiction/assignment");

  // --- Test E: Canonical Aggregation ---
  console.log("\n[Test E: Canonical Aggregation]");
  // Make sure a certificate exists for W-104 cycle
  await certificateService.issueCertificate({
    applicationId: "APP-26036-0148",
    instrumentId: "W-104",
    ownerId: "user-owner-1",
    instrumentName: "Platform Weighing Scale W-104",
    ownerName: "Bharat Mart Pvt Ltd"
  });

  const pRes = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser);
  assert(pRes.success === true, "Passport resolved successfully");
  const passport = pRes.passport;

  assert(passport.instrument.id === "W-104", "Canonical instrument aggregated", passport.instrument.name);
  assert(passport.applications.length > 0, "Canonical applications aggregated", `Count: ${passport.applications.length}`);
  assert(passport.certificates.length > 0, "Canonical certificates aggregated", `Count: ${passport.certificates.length}`);
  assert(passport.summary.totalApplications >= 1, "Summary total applications accurate");
  assert(passport.summary.totalCertificates >= 1, "Summary total certificates accurate");

  // --- Test F: No Fabricated History on Empty Instrument ---
  console.log("\n[Test F: Empty Instrument Timeline Integrity]");
  const emptyInst = await instrumentService.createInstrument({
    name: "Brand New Test Scale",
    category: "Electronic Scales",
    manufacturer: "TestMaker",
    model: "TM-100",
    serialNumber: "TEST-SN-" + Date.now(),
    capacity: "50 kg",
    location: "Test Shop",
    ownerId: ownerUser.id,
    ownerName: ownerUser.organization || ownerUser.name
  });

  const emptyPassRes = await instrumentPassportService.getInstrumentPassport(emptyInst.id, ownerUser);
  assert(emptyPassRes.success === true, "Empty instrument passport resolved");
  const emptyPassport = emptyPassRes.passport;

  assert(emptyPassport.applications.length === 0, "No applications for fresh instrument");
  assert(emptyPassport.cycles.length === 0, "No verification cycles for fresh instrument");
  assert(emptyPassport.certificates.length === 0, "No certificates for fresh instrument");
  assert(emptyPassport.summary.totalApplications === 0, "Summary totalApplications is 0");
  assert(emptyPassport.summary.totalCertificates === 0, "Summary totalCertificates is 0");
  assert(
    emptyPassport.timeline.length === 1 && emptyPassport.timeline[0].type === "INSTRUMENT_REGISTERED",
    "Empty instrument only has INSTRUMENT_REGISTERED event (no fabricated events)",
    `Timeline length: ${emptyPassport.timeline.length}`
  );

  // --- Test G: Multiple-Cycle History ---
  console.log("\n[Test G: Multiple-Cycle History]");
  // W-101 has two applications in mock data: APP-26036-0132 and APP-26036-0142
  const w101Owner = { ...ownerUser, id: "user-owner-1" };
  const w101Res = await instrumentPassportService.getInstrumentPassport("W-101", w101Owner);
  assert(w101Res.success === true, "W-101 passport resolved");
  const w101Passport = w101Res.passport;

  assert(
    w101Passport.cycles.length >= 2,
    "Multiple applications are represented as separate verification cycles without merging",
    `Found ${w101Passport.cycles.length} cycles for W-101`
  );
  assert(
    w101Passport.cycles[0].cycleId !== w101Passport.cycles[1].cycleId,
    "Verification cycles have distinct IDs matching their respective applications"
  );
  assert(
    w101Passport.cycles[0].cycleNumber === 1 && w101Passport.cycles[1].cycleNumber === 2,
    "Cycles are numbered sequentially"
  );

  // --- Test H: Certificate Relationship ---
  console.log("\n[Test H: Certificate Relationship]");
  const certForW104 = passport.certificates.find((c) => c.instrumentId === "W-104" || c.applicationId === "APP-26036-0148");
  assert(!!certForW104, "Certificate correctly linked to instrument W-104");
  assert(
    passport.cycles.some((c) => c.certificate && c.certificate.certificateId === certForW104.certificateId),
    "Certificate correctly linked to the corresponding verification cycle"
  );

  // --- Test I: QR Sticker Confirmation Relationship ---
  console.log("\n[Test I: QR Sticker Confirmation Relationship]");
  const sticker = await qrStickerService.createStickerConfirmation({
    certificateId: certForW104.certificateId,
    ownerId: ownerUser.id,
    evidence: {
      id: "ev-test",
      filename: "test-shop-front.jpg",
      type: "image",
      url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    }
  });

  const updatedW104 = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser);
  assert(
    updatedW104.passport.stickerConfirmations.some((s) => s.id === sticker.id),
    "Submitted sticker confirmation is linked to passport"
  );
  assert(
    updatedW104.passport.timeline.some((evt) => evt.type === "QR_STICKER_SUBMITTED"),
    "Timeline reflects QR_STICKER_SUBMITTED event"
  );

  // Review confirmation by LMO
  await qrStickerService.approveStickerConfirmation(
    sticker.id,
    "Priya Sharma (LMO)",
    "Sticker clearly displayed next to weight indicator display."
  );

  const confirmedW104 = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser);
  assert(
    confirmedW104.passport.summary.currentQrStickerStatus === "CONFIRMED",
    "Passport summary reflects CONFIRMED sticker status"
  );
  assert(
    confirmedW104.passport.timeline.some((evt) => evt.type === "QR_STICKER_CONFIRMED"),
    "Timeline reflects QR_STICKER_CONFIRMED event"
  );

  // --- Test J: Reset Demo State ---
  console.log("\n[Test J: Reset Demo State]");
  storageService.resetDemoState();
  const resetW104 = await instrumentPassportService.getInstrumentPassport("W-104", ownerUser);
  assert(resetW104.success === true, "Passport reconstructs from restored baseline after resetDemoState()");
  assert(
    resetW104.passport.instrument.currentStatus === "Expiring",
    "Baseline status restored correctly"
  );

  // --- Test K: Internationalization ---
  console.log("\n[Test K: Internationalization Verification]");
  const requiredKeys = [
    "passport.title",
    "passport.subtitle",
    "passport.viewPassport",
    "passport.instrumentHistory",
    "passport.verificationHistory",
    "passport.verificationCycles",
    "passport.cycle",
    "passport.identity",
    "passport.specifications",
    "passport.summary",
    "passport.application",
    "passport.verification",
    "passport.certificate",
    "passport.qrSticker",
    "passport.registered",
    "passport.scheduled",
    "passport.verificationStarted",
    "passport.resultSubmitted",
    "passport.certificateGenerated",
    "passport.qrStickerSubmitted",
    "passport.qrStickerConfirmed",
    "passport.correctionRequired",
    "passport.noHistory",
    "passport.noCertificate",
    "passport.noVerificationRecord",
    "passport.noStickers",
    "passport.noApplications",
    "passport.currentCertificate",
    "passport.latestVerification",
    "passport.totalApplications",
    "passport.totalVerifications",
    "passport.totalCertificates",
    "passport.observedErrors",
    "passport.zeroError",
    "passport.repeatability",
    "passport.eccentricity",
    "passport.testStandard",
    "passport.sealIntact",
    "passport.backToInstruments",
    "passport.accessDenied",
    "passport.notFound"
  ];

  const langs = ["en", "hi", "mr", "pa", "te"];
  for (const lang of langs) {
    const dict = translations[lang];
    assert(!!dict, `Language dictionary exists for ${lang}`);
    for (const key of requiredKeys) {
      assert(
        typeof dict[key] === "string" && dict[key].trim().length > 0,
        `Key "${key}" translated in [${lang}]`,
        `Value: ${dict[key]}`
      );
    }
  }

  // --- Test L: Public Privacy ---
  console.log("\n[Test L: Public Privacy Access Control]");
  const publicAccess = await instrumentPassportService.getInstrumentPassport("W-104", publicUser);
  assert(
    publicAccess.success === false && publicAccess.error === "UNAUTHORIZED",
    "Public user is strictly blocked from accessing complete Digital Instrument Passport"
  );

  console.log("\n==================================================");
  console.log("ALL 12 REGRESSION SUITE CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

runRegressionSuite().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
