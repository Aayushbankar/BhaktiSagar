const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'qa-results.json');
const outDir = path.join(__dirname, 'qa-attachments');
fs.mkdirSync(outDir, { recursive: true });

const data = JSON.parse(fs.readFileSync(src, 'utf8'));
const specs = [];

function walk(suite) {
  (suite.specs || []).forEach((spec) => specs.push({ suite: suite.title, spec }));
  (suite.suites || []).forEach(walk);
}
(data.suites || []).forEach(walk);

let dumped = 0;
const summary = [];

for (const { suite, spec } of specs) {
  const test = (spec.tests || [])[0];
  const result = (test && test.results && test.results[0]) || {};
  summary.push({
    suite,
    title: spec.title,
    status: result.status || 'unknown',
    durationMs: Math.round(result.duration || 0),
    attachments: (result.attachments || []).map((a) => a.name),
  });
  for (const att of result.attachments || []) {
    const safe = `${suite}--${spec.title}--${att.name}`.replace(/[^a-z0-9._-]+/gi, '_');
    if (att.body) {
      fs.writeFileSync(path.join(outDir, `${safe}.json`), Buffer.from(att.body, 'base64'));
      dumped += 1;
    } else if (att.path) {
      fs.copyFileSync(att.path, path.join(outDir, `${safe}${path.extname(att.path)}`));
      dumped += 1;
    }
  }
}

fs.writeFileSync(path.join(__dirname, 'qa-summary.json'), JSON.stringify(summary, null, 2));
console.log('specs:', summary.length, 'attachments dumped:', dumped);
console.log(JSON.stringify(summary.map((s) => ({ t: s.title, st: s.status, ms: s.durationMs })), null, 0));
