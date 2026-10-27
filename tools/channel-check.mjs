/*
 * Report who actually owns a YouTube video: channel id, channel name and
 * whether the channel carries YouTube's verified badge.
 *
 * Usage:
 *   node channel-check.mjs ID1,ID2,...
 */
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const ids = process.argv.slice(2)
  .filter((a) => !a.startsWith('--'))
  .flatMap((a) => a.split(',').map((s) => s.trim()))
  .filter(Boolean);

if (!ids.length) { console.error('no ids'); process.exit(2); }

async function get(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', cookie: 'SOCS=CAI; CONSENT=YES+cb' },
  });
  return res.ok ? res.text() : '';
}

for (const id of ids) {
  const html = await get(`https://www.youtube.com/watch?v=${id}`);
  const chId = (html.match(/"channelId":"(UC[^"]+)"/) || [])[1] || '';
  const chName = (html.match(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/) || [])[1] || '';
  let verified = false;
  let desc = '';
  if (chId) {
    const chHtml = await get(`https://www.youtube.com/channel/${chId}`);
    verified = /BADGE_STYLE_TYPE_VERIFIED/.test(chHtml);
    const d = (chHtml.match(/"description":"((?:[^"\\]|\\.)*)"/) || [])[1] || '';
    desc = d.replace(/\\n/g, ' ').replace(/\\u0026/g, '&').slice(0, 220);
  }
  console.log(`${id}  ${chName}  ${chId}  verified=${verified}`);
  if (desc) { console.log(`    ${desc}`); }
}
