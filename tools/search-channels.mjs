/*
 * Search YouTube CHANNELS (not videos) and list name, id and subscribers.
 *
 * Usage:
 *   node search-channels.mjs --batch queries.txt --n 6
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
let queries = [];
let n = 6;
let jsonOut = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--batch') {
    queries = readFileSync(resolve(__dirname, args[++i]), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  } else if (args[i] === '--n') { n = parseInt(args[++i], 10); }
  else if (args[i] === '--json') { jsonOut = args[++i]; }
  else if (!args[i].startsWith('--')) { queries.push(args[i]); }
}
if (!queries.length) { console.error('no query'); process.exit(2); }

const safeJson = (s) => { try { return JSON.parse('"' + s + '"'); } catch { return s; } };

function extract(html) {
  const parts = html.split('"channelRenderer":{');
  const out = [];
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].slice(0, 6000);
    const idm = block.match(/"channelId":"(UC[^"]+)"/);
    if (!idm) continue;
    const t = block.match(/"title":\{"simpleText":"((?:[^"\\]|\\.)*)"/)
      || block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    const d = block.match(/"descriptionSnippet":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    const v = block.match(/"videosCountText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    out.push({
      channel_id: idm[1],
      name: t ? safeJson(t[1]) : '',
      description: d ? safeJson(d[1]) : '',
      videos: v ? safeJson(v[1]) : '',
    });
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const all = [];
for (const q of queries) {
  let items = null;
  for (let attempt = 0; attempt < 3 && !items; attempt++) {
    try {
      // EgIQAg%3D%3D = the "Channel" result-type filter
      const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '&sp=EgIQAg%253D%253D';
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
      const html = await res.text();
      const parsed = extract(html);
      if (!parsed.some((x) => x.name)) throw new Error('parse empty');
      items = parsed;
    } catch (e) {
      if (attempt < 2) { await sleep(10000); } else { console.log('\n# ' + q + '  FAILED: ' + e.message); }
    }
  }
  if (items) {
    const seen = new Set();
    items = items.filter((x) => !seen.has(x.channel_id) && seen.add(x.channel_id)).slice(0, n);
    console.log('\n# ' + q);
    for (const it of items) {
      console.log(`  ${it.channel_id}  ${it.name}  ${it.videos}`);
      if (it.description) { console.log(`      ${it.description.slice(0, 120)}`); }
    }
    for (const it of items) { all.push({ query: q, ...it }); }
  }
  await sleep(4000);
}
if (jsonOut) { writeFileSync(resolve(__dirname, jsonOut), JSON.stringify(all, null, 2), 'utf8'); }
console.log(`\ntotal channels: ${all.length}`);
