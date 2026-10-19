/*
 * Headless UI check: load a page in Edge over CDP, evaluate a JS expression
 * (optionally async), print the JSON result.
 *
 * Usage:
 *   node ui-check.mjs <url> <expression-or-file.js> [--wait 4000] [--timeout 45000]
 *   node ui-check.mjs http://localhost/bhakti-sagar/ extract.js --async
 *
 * The expression runs in page context. With --async its return value may be a
 * Promise (awaited). Result must be JSON-serializable.
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let url = null;
let expr = null;
let waitMs = 4000;
let budgetMs = 45000;
let asyncMode = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--wait') { waitMs = parseInt(args[++i], 10); }
  else if (args[i] === '--timeout') { budgetMs = parseInt(args[++i], 10); }
  else if (args[i] === '--async') { asyncMode = true; }
  else if (!url) { url = args[i]; }
  else { expr = args[i]; }
}
if (!url || !expr) { console.error('usage: ui-check.mjs <url> <expr|file.js> [--wait ms] [--timeout ms] [--async]'); process.exit(2); }
if (existsSync(resolve(__dirname, expr))) { expr = readFileSync(resolve(__dirname, expr), 'utf8'); }
else if (existsSync(expr)) { expr = readFileSync(expr, 'utf8'); }

const port = 9400 + (process.pid % 90);
const profile = `${process.env.TEMP}\\edge-uicheck-${process.pid}`;
const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let msgId = 0;

async function http(method, url2) {
  const res = await fetch(url2, { method });
  return res.json();
}
function connectWs(wsUrl) {
  const ws = new WebSocket(wsUrl);
  return new Promise((ok, bad) => { ws.onopen = () => ok(ws); ws.onerror = bad; });
}
function cdp(ws, method, params = {}) {
  return new Promise((ok, bad) => {
    const id = ++msgId;
    const onMsg = ev => {
      const m = JSON.parse(ev.data);
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? bad(new Error(m.error.message)) : ok(m.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => { ws.removeEventListener('message', onMsg); bad(new Error('cdp timeout: ' + method)); }, budgetMs);
  });
}

async function main() {
  let ver = null;
  for (let i = 0; i < 40 && !ver; i++) {
    try { ver = await http('GET', `http://127.0.0.1:${port}/json/version`); } catch { await sleep(250); }
  }
  if (!ver) { throw new Error('Edge devtools did not start'); }

  const target = await http('PUT', `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`);
  const ws = await connectWs(target.webSocketDebuggerUrl);
  await cdp(ws, 'Runtime.enable');
  await cdp(ws, 'Page.enable').catch(() => {});
  await sleep(waitMs);

  const res = await cdp(ws, 'Runtime.evaluate', {
    expression: expr,
    awaitPromise: asyncMode,
    returnByValue: true,
  });
  ws.close();
  edge.kill();

  if (res.exceptionDetails) {
    console.error('PAGE EXCEPTION: ' + JSON.stringify(res.exceptionDetails.exception || res.exceptionDetails.text));
    process.exit(1);
  }
  console.log(JSON.stringify(res.result.value, null, 2));
}

main().catch(err => { try { edge.kill(); } catch {} console.error(err.message); process.exit(1); });
