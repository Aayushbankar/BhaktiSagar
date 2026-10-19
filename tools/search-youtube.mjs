/*
 * Search YouTube and list candidate videos (id, title, channel).
 *
 * Usage:
 *   node search-youtube.mjs "shiva bhajan t series bhakti sagar"
 *   node search-youtube.mjs "query" --n 8
 *   node search-youtube.mjs --batch queries.txt --n 6
 *   node search-youtube.mjs --batch queries.txt --json candidates.json
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
let delay = 6000;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--n') { n = parseInt(args[++i], 10); }
  else if (args[i] === '--delay') { delay = parseInt(args[++i], 10); }
  else if (args[i] === '--json') { jsonOut = args[++i]; }
  else if (args[i] === '--batch') {
    queries = readFileSync(resolve(__dirname, args[++i]), 'utf8').split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  } else if (!args[i].startsWith('--')) {
    queries.push(args[i]);
  }
}
if (!queries.length) { console.error('no query'); process.exit(2); }

function extract(html) {
  const parts = html.split('"videoRenderer":{');
  const out = [];
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].slice(0, 6000);
    const idm = block.match(/^"videoId":"([A-Za-z0-9_-]{11})"/);
    if (!idm) continue;
    const t = block.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)
      || block.match(/"title":\{"simpleText":"((?:[^"\\]|\\.)*)"/);
    const ch = block.match(/"longBylineText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)
      || block.match(/"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/);
    const title = t ? safeJson(t[1]) : '';
    const channel = ch ? safeJson(ch[1]) : '';
    if (title) out.push({ id: idm[1], title, channel });
  }
  // fallback: unique ids if renderer parse failed
  if (!out.length) {
    const ids = [...html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)].map(x => x[1]);
    for (const id of [...new Set(ids)].slice(0, n)) out.push({ id, title: '', channel: '' });
  }
  return out;
}

function safeJson(s) {
  try { return JSON.parse('"' + s + '"'); } catch { return s; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const all = [];
for (const q of queries) {
  let items = null;
  for (let attempt = 0; attempt < 3 && !items; attempt++) {
    try {
      const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
      const html = await res.text();
      const parsed = extract(html);
      if (!parsed.some(x => x.title)) throw new Error('parse empty');
      items = parsed;
    } catch (e) {
      if (attempt < 2) { await sleep(12000); } else { console.log('\n# ' + q + '  FAILED: ' + e.message); }
    }
  }
  if (items) {
    const seen = new Set();
    items = items.filter(x => !seen.has(x.id) && seen.add(x.id)).slice(0, n);
    console.log('\n# ' + q);
    for (const it of items) console.log(`  ${it.id}  ${it.channel || '?'}  |  ${it.title}`);
    for (const it of items) all.push({ query: q, ...it });
  }
  await sleep(delay);
}
if (jsonOut) { writeFileSync(resolve(__dirname, jsonOut), JSON.stringify(all, null, 2), 'utf8'); }
console.log(`\ntotal candidates: ${all.length}`);
