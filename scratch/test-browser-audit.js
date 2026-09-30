async function auditPages() {
  const pages = [
    { url: 'http://localhost:3000/owner/applications', name: 'Owner Applications' },
    { url: 'http://localhost:3000/owner/re-verify', name: 'Owner Re-verify / Legacy Assistant' },
    { url: 'http://localhost:3000/owner/instruments/W-104', name: 'Owner Instrument Passport' },
    { url: 'http://localhost:3000/lmo/applications/APP-26036-0148/verify', name: 'LMO Verification & Decision' },
    { url: 'http://localhost:3000/owner/certificates', name: 'Certificate Repository' },
    { url: 'http://localhost:3000/verify-certificate?id=CERT-2025-00981', name: 'Public Certificate Verification' },
    { url: 'http://localhost:3000/lmo/qr-confirmations', name: 'QR Sticker Confirmation Queue' },
  ];

  console.log('==================================================');
  console.log('AUDITING DEMO PAGES VIA LIVE DEV SERVER HTTP');
  console.log('==================================================');

  for (const page of pages) {
    try {
      const res = await fetch(page.url);
      const text = await res.text();
      console.log(`\n[PAGE: ${page.name}]`);
      console.log(`URL: ${page.url}`);
      console.log(`HTTP Status: ${res.status} ${res.statusText}`);
      console.log(`Response length: ${text.length} bytes`);

      if (page.name === 'Public Certificate Verification') {
        const leaks = [];
        if (text.includes('aiAdvisory') || text.includes('AI Advisory') || text.includes('Heuristic Risk Score')) leaks.push('AI Advisory');
        if (text.includes('officerOverrideNotes') || text.includes('statutory justification')) leaks.push('Officer Notes');
        if (text.includes('stickerPhotoUrl') || text.includes('Sticker Photo Evidence')) leaks.push('Sticker Photo Private URL');
        if (leaks.length === 0) {
          console.log('✅ Privacy Check: Zero leaked internal officer / AI data found on public verification page');
        } else {
          console.log('❌ Privacy Leak detected:', leaks.join(', '));
        }
      }

      if (page.name === 'LMO Verification & Decision') {
        const hasInstrument = text.includes('INSTRUMENT SUMMARY') || text.includes('Instrument Summary') || text.includes('Platform Weighing');
        const hasObservations = text.includes('Dynamic MPE') || text.includes('Load Test') || text.includes('Observations');
        const hasFinalDecision = text.includes('Final verification decision') || text.includes('OFFICER AUTHORITY');
        console.log(`- Instrument Context: ${hasInstrument ? '✅ Present' : '❌ Missing'}`);
        console.log(`- MPE Observations: ${hasObservations ? '✅ Present' : '❌ Missing'}`);
        console.log(`- Final Statutory Decision: ${hasFinalDecision ? '✅ Present' : '❌ Missing'}`);
      }
    } catch (e) {
      console.error(`Error auditing ${page.name}:`, e.message);
    }
  }
}

auditPages();
