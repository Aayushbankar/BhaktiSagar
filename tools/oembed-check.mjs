/*
 * Fetch YouTube oEmbed metadata for candidate ids (existence + title + channel).
 *
 * Usage:
 *   node oembed-check.mjs id1,id2,...
 *   node oembed-check.mjs --file ids.txt
 * Exit 0 if all resolve.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
let ids = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file') { ids = readFileSync(resolve(__dirname, args[++i]), 'utf8').split(/[\s,]+/).map(s => s.trim()).filter(Boolean); }
  else if (!args[i].startsWith('--')) { ids = ids.concat(args[i].split(',').map(s => s.trim()).filter(Boolean)); }
}
if (!ids.length) { console.error('no ids'); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0;
for (const id of ids) {
  try {
    const url = 'https://www.youtube.com/oembed?url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id) + '&format=json';
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) { console.log(`FAIL  ${id}  HTTP ${res.status}`); bad++; continue; }
    const j = await res.json();
    console.log(`OK    ${id}  ${j.author_name}  |  ${j.title}`);
  } catch (e) {
    console.log(`FAIL  ${id}  ${e.message}`); bad++;
  }
  await sleep(400);
}
console.log(`\n${ids.length - bad}/${ids.length} resolved`);
process.exit(bad ? 1 : 0);
