import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const pagesToCheck = [
  { url: 'http://localhost:3000/login', name: 'Login Page' },
  { url: 'http://localhost:3000/owner/applications', name: 'Trader Applications' },
  { url: 'http://localhost:3000/owner/re-verify', name: 'Trader Re-verify' },
  { url: 'http://localhost:3000/owner/instruments/W-104', name: 'Trader Passport W-104' },
  { url: 'http://localhost:3000/lmo/dashboard', name: 'LMO Dashboard' },
  { url: 'http://localhost:3000/lmo/instruments/W-104', name: 'LMO Passport W-104' },
  { url: 'http://localhost:3000/lmo/applications/APP-26036-0148/verify', name: 'LMO Verify Page' },
  { url: 'http://localhost:3000/gatc/dashboard', name: 'GATC Dashboard' },
  { url: 'http://localhost:3000/gatc/assigned', name: 'GATC Assigned' },
  { url: 'http://localhost:3000/gatc/results', name: 'GATC Results' },
  { url: 'http://localhost:3000/admin/dashboard', name: 'Admin Dashboard' },
  { url: 'http://localhost:3000/verify-certificate?id=CERT-2025-00981', name: 'Public QR Verification' },
];

async function runBrowserCheck() {
  console.log('==================================================');
  console.log('LAUNCHING HEADLESS CHROME FOR VISUAL & CONSOLE AUDIT');
  console.log('==================================================');

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  // Wait for CDP to initialize
  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];

    const wsUrl = pageTarget.webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();

    const consoleLogs = [];
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }

      if (data.method === 'Runtime.consoleAPICalled') {
        const type = data.params.type;
        const text = data.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error') {
          consoleErrors.push(text);
        } else {
          consoleLogs.push(`[${type}] ${text}`);
        }
      }

      if (data.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(data.params.exceptionDetails.text + ': ' + (data.params.exceptionDetails.exception?.description || ''));
      }
    };

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await sendCommand('Runtime.enable');
    await sendCommand('Page.enable');

    for (const page of pagesToCheck) {
      consoleLogs.length = 0;
      consoleErrors.length = 0;

      const navStart = Date.now();
      await sendCommand('Page.navigate', { url: page.url });

      // Wait for page load and hydration
      await new Promise(r => setTimeout(r, 1200));

      const titleRes = await sendCommand('Runtime.evaluate', {
        expression: 'document.title'
      });
      const title = titleRes.result?.result?.value || '';

      const bodyTextRes = await sendCommand('Runtime.evaluate', {
        expression: 'document.body.innerText.slice(0, 100).replace(/\\n/g, " ")'
      });
      const snippet = bodyTextRes.result?.result?.value || '';

      console.log(`\n[VISUAL CHECK: ${page.name}]`);
      console.log(`URL: ${page.url}`);
      console.log(`Page Title: "${title}"`);
      console.log(`Rendered Content Snippet: "${snippet}..."`);
      console.log(`Load Duration: ${Date.now() - navStart}ms`);

      if (consoleErrors.length === 0) {
        console.log(`Console: ✅ Zero errors detected.`);
      } else {
        console.log(`Console: ⚠️ ${consoleErrors.length} error(s) logged:`);
        consoleErrors.forEach(e => console.log('   - ' + e));
      }
    }

    ws.close();
  } catch (err) {
    console.error('Browser check failed:', err);
  } finally {
    chromeProc.kill();
    console.log('\nHeadless Chrome audit complete.');
  }
}

runBrowserCheck();
