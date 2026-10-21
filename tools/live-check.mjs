/*
 * Check whether YouTube videos are LIVE RIGHT NOW.
 *
 * YouTube search results and titles are unreliable ("LIVE" in a title of an
 * archived video). This fetches the watch page and reads
 * ytInitialPlayerResponse: playabilityStatus, videoDetails.isLive /
 * isLiveContent and microformat liveBroadcastDetails.isLiveNow.
 *
 * Usage:
 *   node live-check.mjs ID1,ID2,...
 *   node live-check.mjs --file ids.txt --json out.json
 *   node live-check.mjs ID1 --verbose
 *
 * Result per id: LIVE | SCHEDULED | NOT_LIVE | UNPLAYABLE
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
let ids = [];
let file = null;
let jsonOut = null;
let verbose = false;
let pause = 2500;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file') { file = args[++i]; }
  else if (args[i] === '--json') { jsonOut = args[++i]; }
  else if (args[i] === '--pause') { pause = parseInt(args[++i], 10); }
  else if (args[i] === '--verbose') { verbose = true; }
  else if (!args[i].startsWith('--')) {
    ids.push(...args[i].split(',').map((s) => s.trim()).filter(Boolean));
  }
}
if (file) {
  ids = readFileSync(resolve(__dirname, file), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
}
if (!ids.length) { console.error('no ids'); process.exit(2); }

/** Pull `var ytInitialPlayerResponse = {...};` out of a watch page. */
function playerResponse(html) {
  const marker = 'ytInitialPlayerResponse = ';
  const at = html.indexOf(marker);
  if (at < 0) return null;
  const start = html.indexOf('{', at);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) { esc = false; }
      else if (c === '\\') { esc = true; }
      else if (c === '"') { inStr = false; }
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

async function fetchText(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: {
          'user-agent': UA,
          'accept-language': 'en-US,en;q=0.9',
          cookie: 'SOCS=CAI; CONSENT=YES+cb',
        },
      });
    } catch (e) {
      return { ok: false, status: 0, note: String(e.message || e) };
    }
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 20000)); // back off, YouTube throttles hard
      continue;
    }
    return { ok: res.ok, status: res.status, text: res.ok ? await res.text() : '' };
  }
  return { ok: false, status: 429, note: 'http 429 (throttled)' };
}

async function check(id) {
  // watch page first; when YouTube throttles it, fall back to the much lighter
  // embed page, which carries the same ytInitialPlayerResponse payload.
  let got = await fetchText(`https://www.youtube.com/watch?v=${id}`);
  if (!got.ok || !got.text) {
    const alt = await fetchText(`https://www.youtube.com/embed/${id}`);
    if (alt.ok && alt.text) got = alt;
  }
  if (!got.ok || !got.text) return { id, status: 'NOT_LIVE', note: got.note || `http ${got.status}` };
  const html = got.text;

  const pr = playerResponse(html);
  if (!pr) return { id, status: 'NOT_LIVE', note: 'no ytInitialPlayerResponse' };

  const status = pr.playabilityStatus?.status || 'UNKNOWN';
  const reason = pr.playabilityStatus?.reason || pr.playabilityStatus?.messages?.[0] || '';
  const v = pr.videoDetails || {};
  const mm = pr.microformat?.playerMicroformatRenderer || {};
  const live = mm.liveBroadcastDetails || {};
  const title = v.title || '';
  const channel = v.author || '';

  let state;
  if (status !== 'OK') state = 'UNPLAYABLE';
  else if (live.isLiveNow === true || v.isLive === true) state = 'LIVE';
  else if (live.startTimestamp && !live.endTimestamp) state = 'SCHEDULED';
  else state = 'NOT_LIVE';

  const out = { id, status: state, title, channel, isLive: !!v.isLive, isLiveContent: !!v.isLiveContent, isLiveNow: !!live.isLiveNow, reason: reason || undefined };
  if (verbose) out.rawStatus = status;
  return out;
}

const results = [];
for (const id of ids) {
  const r = await check(id);
  results.push(r);
  const pad = (s) => String(s || '').slice(0, 60).padEnd(60);
  console.log(`${r.status.padEnd(10)} ${r.id}  ${pad(r.channel)} | ${pad(r.title)}${r.note ? '  [' + r.note + ']' : ''}`);
  await new Promise((r) => setTimeout(r, pause));
}

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nwrote ${jsonOut}`);
}

const counts = results.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});
console.log('\n' + JSON.stringify(counts));
console.log(`LIVE: ${results.filter((r) => r.status === 'LIVE').length}/${results.length}`);
