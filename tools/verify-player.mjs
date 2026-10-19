/*
 * Verifies that each YouTube video actually PLAYS in an embedded player.
 *
 * Opens the local harness tools/player-check.html (YT IFrame API) in headless
 * Edge over CDP, waits in real time, and reports PLAYING / ERROR(code) per id.
 *
 * Usage:
 *   node verify-player.mjs F2sK70nF3OY,adyjwFgXRNY
 *   node verify-player.mjs --file ids.txt --wait 14000
 *   node verify-player.mjs id1,id2 --json results.json
 *
 * Error codes: 2=invalid, 5=HTML5, 100=not found/private, 101/150=embed blocked
 * Exit code 0 only if every id reached PLAYING/ENDED.
 */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE = process.env.CHECK_BASE || 'http://localhost/bhakti-sagar';
const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
let ids = [];
let waitMs = 14000;
let jsonOut = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--wait') { waitMs = parseInt(args[++i], 10); }
  else if (args[i] === '--json') { jsonOut = args[++i]; }
  else if (args[i] === '--file') {
    ids = readFileSync(resolve(__dirname, args[++i]), 'utf8').split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  } else if (!args[i].startsWith('--')) {
    ids = args[i].split(',').map(s => s.trim()).filter(Boolean);
  }
}
if (!ids.length) { console.error('no ids'); process.exit(2); }

const port = 9300 + (process.pid % 90);
const profile = `${process.env.TEMP}\\edge-verify-${process.pid}`;
const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--mute-audio', '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore', detached: false });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function http(method, url, body) {
  const res = await fetch(url, { method, body });
  return res.json();
}

async function connectWs(url) {
  const ws = new WebSocket(url);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
  return ws;
}

let msgId = 0;
function cdp(ws, method, params = {}) {
  return new Promise((ok, bad) => {
    const id = ++msgId;
    const onMsg = ev => {
      const m = JSON.parse(ev.data);
      if (m.id === id) { ws.removeEventListener('message', onMsg); m.error ? bad(new Error(m.error.message)) : ok(m.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  // 1. wait for devtools endpoint
  let ver = null;
  for (let i = 0; i < 40 && !ver; i++) {
    try { ver = await http('GET', `http://127.0.0.1:${port}/json/version`); } catch { await sleep(250); }
  }
  if (!ver) { throw new Error('Edge devtools did not start'); }

  // 2. open the harness page
  const url = `${BASE}/tools/player-check.html?ids=${encodeURIComponent(ids.join(','))}&wait=${waitMs}`;
  const target = await http('PUT', `http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`);
  const ws = await connectWs(target.webSocketDebuggerUrl);
  await cdp(ws, 'Runtime.enable');

  // 3. poll for results in real time
  const budget = ids.length * (waitMs + 4000) + 45000;
  const t0 = Date.now();
  let text = '';
  let done = false;
  while (Date.now() - t0 < budget) {
    await sleep(1500);
    try {
      const r = await cdp(ws, 'Runtime.evaluate', {
        expression: `(function(){var t=document.title;var e=document.getElementById('results');return t+'|||'+(e?e.textContent:'')})()`,
        returnByValue: true
      });
      const val = r.result && r.result.value || '';
      const split = val.indexOf('|||');
      const title = val.slice(0, split);
      const body = val.slice(split + 3);
      const m = body.match(/JSONSTART([\s\S]*?)JSONEND/);
      if (m) { text = m[1]; }
      if (title === 'DONE') { done = true; break; }
    } catch { /* page may be busy */ }
  }

  ws.close();
  edge.kill();

  if (!text) { console.error(done ? 'DONE but no results' : 'TIMEOUT: harness never finished'); process.exit(1); }

  let results;
  try { results = JSON.parse(text); } catch (e) { console.error('bad JSON: ' + text.slice(0, 300)); process.exit(1); }

  const bad = [];
  for (const r of results) {
    const ok = r.outcome === 'PLAYING' || r.outcome === 'ENDED';
    if (!ok) { bad.push(r); }
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.outcome}${r.code !== null ? ' code=' + r.code : ''}`);
  }
  console.log(`\n${results.length - bad.length}/${results.length} playable`);
  if (jsonOut) { writeFileSync(resolve(__dirname, jsonOut), JSON.stringify(results, null, 2), 'utf8'); }
  process.exit(bad.length ? 1 : 0);
}

main().catch(err => { try { edge.kill(); } catch {} console.error(err.message); process.exit(1); });
