import { storageService } from '../src/services/storageService';
import { legacyReceiptService } from '../src/services/legacyReceiptService';
import { applicationService } from '../src/services/applicationService';
import { verificationService } from '../src/services/verificationService';
import { certificateService } from '../src/services/certificateService';
import { qrStickerService } from '../src/services/qrStickerService';
import { instrumentPassportService } from '../src/services/instrumentPassportService';
import { authService } from '../src/services/authService';

async function runDemoSimulation(iteration: number) {
  console.log(`\n=== RUNNING DEMO SEQUENCE ITERATION ${iteration} ===`);

  // Reset baseline
  storageService.resetDemoState();
  const trader = await authService.getUserById('user-owner-1');
  const lmo = await authService.getUserById('user-lmo-1');

  if (!trader || !lmo) throw new Error('Baseline users not found');

  // Scene 1 & 2: Receipt Extraction & Review
  const receipts = legacyReceiptService.getDemoReceipts();
  const receipt1 = receipts.find(r => r.id === 'DEMO-RECEIPT-001')!;
  const extraction = await legacyReceiptService.extractFromDemo(receipt1.id);

  // Edit capacity
  const updatedExtraction = legacyReceiptService.updateField(extraction, 'capacity', '320 kg');
  const capacityField = updatedExtraction.fields.find(f => f.key === 'capacity');
  if (capacityField?.finalValue !== '320 kg' || capacityField?.sourceState !== 'USER_VERIFIED') {
    throw new Error('Field update failed');
  }

  const serialField = updatedExtraction.fields.find(f => f.key === 'serialNumber');
  const match = await legacyReceiptService.matchInstrument(serialField?.finalValue, trader.id);
  if (!match.matchedInstrument || match.matchedInstrument.id !== 'W-104') {
    throw new Error(`Expected match W-104, got ${match.matchedInstrument?.id}`);
  }
  console.log(`- Scene 2 Matched instrument: ${match.matchedInstrument.id} (${match.matchedInstrument.name})`);

  // Scene 3: Existing Application Submission
  const app = await applicationService.getApplicationById('APP-26036-0148');
  if (!app) throw new Error('APP-26036-0148 not found');
  console.log(`- Scene 3 Application status: ${app.status}`);

  // Scene 4: Passport before verification
  const passportBefore = await instrumentPassportService.getInstrumentPassport('W-104', lmo);
  if (!passportBefore.success || !passportBefore.passport) throw new Error('Passport resolution failed');
  console.log(`- Scene 4 Passport cycles before: ${passportBefore.passport.cycles.length}`);

  // Scene 5 & 6: Verification with MPE (100 kg -> 100.02 kg)
  // Scene 8: Pass Decision submission
  const passObs = await verificationService.submitVerificationResult('APP-26036-0148', {
    instrumentId: 'W-104',
    verifierRole: 'LMO',
    verifierId: lmo.id,
    testStandard: 'OIML R76-1',
    referenceWeights: '20 kg / 50 kg / 100 kg',
    zeroError: '0.00 kg',
    repeatabilityError: '+0.02%',
    eccentricityError: '+0.01%',
    condition: 'Good',
    sealIntact: true,
    calibrationStickerPresent: true,
    overallResult: 'Pass',
    officerNotes: 'Standard periodic verification passed. Instrument operating within tolerances.'
  });

  const updatedApp = await applicationService.getApplicationById('APP-26036-0148');
  if (!updatedApp?.certificateId) {
    throw new Error('Verification submission failed to attach certificate to application');
  }
  const certId = updatedApp.certificateId;
  console.log(`- Scene 8/9 Certificate generated: ${certId} (Expected CERT-2025-00981)`);

  // Scene 9: Owner Certificate Repository check
  const allCerts = await certificateService.getAllCertificates();
  const ownerCerts = allCerts.filter(c => c.ownerId === trader.id);
  const foundCert = ownerCerts.find(c => c.certificateId === certId);
  if (!foundCert) throw new Error('Generated certificate not found in owner repository');

  // Scene 10: Public QR verification check
  const publicCert = await certificateService.verifyPublicCertificate(certId);
  if (!publicCert || publicCert.status !== 'VALID') throw new Error('Public certificate lookup failed or not VALID');

  // Scene 11: QR Sticker Submission & Confirmation
  const stickerSubmission = await qrStickerService.createStickerConfirmation({
    certificateId: certId,
    ownerId: trader.id,
    evidence: {
      id: "ev-demo-stk-1",
      filename: "demo-sticker-housing.jpg",
      type: "image",
      url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800"
    }
  });
  console.log(`- Scene 11 Sticker status after submission: ${stickerSubmission.status}`);

  const stickerConfirm = await qrStickerService.approveStickerConfirmation(
    stickerSubmission.id,
    lmo.id,
    "QR sticker verified in correct placement on display housing."
  );
  console.log(`- Scene 11 Sticker status after review: ${stickerConfirm.status}`);

  // Scene 12: Final Passport Timeline check
  const passportAfter = await instrumentPassportService.getInstrumentPassport('W-104', lmo);
  if (!passportAfter.success || !passportAfter.passport) throw new Error('Final passport resolution failed');
  const hasStickerEvent = passportAfter.passport.timeline.some(e => e.type === 'QR_STICKER_CONFIRMED');
  console.log(`- Scene 12 Final Passport has QR_STICKER_CONFIRMED: ${hasStickerEvent}`);
  if (!hasStickerEvent) throw new Error('Final passport missing QR sticker event');

  console.log(`Iteration ${iteration} completed successfully and deterministically!`);
  return { certId, status: publicCert.status };
}

async function testDuplicateSafety() {
  console.log('\n=== TESTING DUPLICATE ACTION SAFETY & IDEMPOTENCY ===');
  storageService.resetDemoState();
  const trader = (await authService.getUserById('user-owner-1'))!;
  const lmo = (await authService.getUserById('user-lmo-1'))!;

  // Duplicate Pass submission
  console.log('- Test: Submitting Pass verification twice for APP-26036-0148...');
  const res1 = await verificationService.submitVerificationResult('APP-26036-0148', {
    instrumentId: 'W-104',
    verifierRole: 'LMO',
    verifierId: 'user-lmo-1',
    testStandard: 'OIML R76-1',
    referenceWeights: '20 kg / 50 kg / 100 kg',
    zeroError: '0.00 kg',
    repeatabilityError: '0.02%',
    eccentricityError: '0.01%',
    condition: 'Good',
    sealIntact: true,
    calibrationStickerPresent: true,
    overallResult: 'Pass'
  });

  const res2 = await verificationService.submitVerificationResult('APP-26036-0148', {
    instrumentId: 'W-104',
    verifierRole: 'LMO',
    verifierId: 'user-lmo-1',
    testStandard: 'OIML R76-1',
    referenceWeights: '20 kg / 50 kg / 100 kg',
    zeroError: '0.00 kg',
    repeatabilityError: '0.02%',
    eccentricityError: '0.01%',
    condition: 'Good',
    sealIntact: true,
    calibrationStickerPresent: true,
    overallResult: 'Pass'
  });

  const certs = storageService.getCertificates();
  const matchingCerts = certs.filter(c => c.applicationId === 'APP-26036-0148');
  console.log(`- Total certificates created for APP-26036-0148: ${matchingCerts.length} (Expected 1)`);
  if (matchingCerts.length !== 1) {
    throw new Error('Duplicate submission created duplicate certificates!');
  }
  console.log('✅ Duplicate Pass submission safety verified (idempotent).');

  // Reset baseline cleanly at end of test
  storageService.resetDemoState();
  console.log('✅ State cleanly reset.');
}

async function main() {
  const run1 = await runDemoSimulation(1);
  const run2 = await runDemoSimulation(2);

  if (run1.certId !== run2.certId || run1.status !== run2.status) {
    throw new Error('Simulation runs produced different outputs!');
  }
  console.log('\n✅ 2X DEMO RUN DETERMINISM VERIFIED: Both runs produced identical outputs.');

  await testDuplicateSafety();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
