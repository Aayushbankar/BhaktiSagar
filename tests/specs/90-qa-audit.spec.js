const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost/bhakti-sagar';

const ROUTES = [
  ['home', './'],
  ['home-en', 'en'],
  ['home-sa', 'sa'],
  ['track-with-lyrics', 'track/om-jai-jagdish-hare-lata'],
  ['track-without-lyrics', 'track/hanuman-chalisa'],
  ['festival', 'festival/diwali-lakshmi-puja'],
  ['date', 'date/2026-11-15'],
  ['not-found', 'nope/xyz'],
];

function isInternal(url) {
  return url.startsWith(`${BASE}/`) || url.startsWith(`http://localhost/bhakti-sagar/`);
}

test.describe('QA audit', () => {
  test('no console errors, page errors or failing first-party requests', async ({ page }) => {
    test.setTimeout(180000);
    const findings = [];

    for (const [name, path] of ROUTES) {
      const consoleErrors = [];
      const pageErrors = [];
      const badResponses = [];
      const failedRequests = [];

      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        // a deliberate 404 route makes the browser echo the document's own
        // status; the response listener below still catches asset 404s
        if (name === 'not-found' && /Failed to load resource/.test(m.text())) return;
        consoleErrors.push(m.text());
      });
      page.on('pageerror', (e) => pageErrors.push(String(e)));
      page.on('response', (r) => {
        if (!isInternal(r.url()) || r.status() < 400) return;
        if (name === 'not-found' && r.request().resourceType() === 'document') return;
        badResponses.push(`${r.status()} ${r.request().method()} ${r.url()}`);
      });
      page.on('requestfailed', (r) => {
        const why = (r.failure() || {}).errorText || '';
        if (isInternal(r.url()) && !/ERR_ABORTED/.test(why)) {
          failedRequests.push(`${r.url()} :: ${why}`);
        }
      });

      await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => {
        findings.push({ route: name, kind: 'navigation', detail: String(e) });
      });
      await page.waitForTimeout(600);

      if (consoleErrors.length) findings.push({ route: name, kind: 'console.error', detail: consoleErrors });
      if (pageErrors.length) findings.push({ route: name, kind: 'pageerror', detail: pageErrors });
      if (badResponses.length) findings.push({ route: name, kind: 'http>=400', detail: badResponses });
      if (failedRequests.length) findings.push({ route: name, kind: 'requestfailed', detail: failedRequests });
    }

    await testInfo_attach('console-and-network-findings', findings);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });

  test('every first-party resource referenced by the home page loads', async ({ page }) => {
    const bad = [];
    const assets = [];

    page.on('response', (r) => {
      if (!isInternal(r.url())) return;
      const type = (r.headers()['content-type'] || '').toLowerCase();
      const url = r.url();
      if (r.status() >= 400) bad.push(`${r.status()} ${r.request().resourceType()} ${url}`);
      const looksLikeAsset = /\.(css|js|woff2?|png|jpe?g|svg|webp|ico)(\?|$)/.test(url)
        || type.startsWith('text/css')
        || type.includes('javascript')
        || type.startsWith('image/');
      if (looksLikeAsset) assets.push({ url, status: r.status(), type });
    });

    await page.goto('./', { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('[data-slot="all"]').click();
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(500);

    await testInfo_attach('home-assets', assets);
    expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
    expect(assets.length, 'the page must actually pull styles and scripts').toBeGreaterThanOrEqual(2);
  });

  test('link integrity: every track URL in the sitemap resolves 200 with real content', async ({ request }) => {
    test.setTimeout(240000);
    const xml = await (await request.get('sitemap.xml')).text();
    const trackUrls = (xml.match(/<loc>([^<]*?\/track\/[^<]*)<\/loc>/g) || [])
      .map((l) => l.replace(/<\/?loc>/g, ''))
      .filter((u) => !/\/(en|sa)\//.test(u));
    expect(trackUrls.length, 'sitemap must list every track').toBeGreaterThanOrEqual(59);

    const broken = [];
    for (const url of trackUrls) {
      const path = url.replace(`${BASE}/`, '');
      const res = await request.get(path);
      if (res.status() !== 200) { broken.push(`${res.status()} ${path}`); continue; }
      const html = await res.text();
      if (!html.includes('<h1') && !html.includes('track-h1')) broken.push(`no <h1> ${path}`);
      if (html.includes('class="notfound"')) broken.push(`renders 404 panel ${path}`);
      if (!html.includes('window.__ROUTE__')) broken.push(`missing __ROUTE__ ${path}`);
    }
    expect(broken, JSON.stringify(broken, null, 2)).toEqual([]);
  });

  test('accessibility basics: lang, single h1, alt text, named controls, no dead hrefs', async ({ page }) => {
    const report = {};

    for (const [name, path] of ROUTES) {
      // wait for hydration: the track grid is client-rendered from the API,
      // so auditing at DOMContentLoaded would miss every card image
      await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(300);
      const audit = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        const imgsNoAlt = [...document.querySelectorAll('img:not([alt])')]
          .map((el) => el.getAttribute('src'));
        const deadHrefs = [...document.querySelectorAll('a')]
          .map((a) => a.getAttribute('href'))
          .filter((h) => h === null || h === '' || h === '#' || /^javascript:/i.test(h));
        const unnamedButtons = [...document.querySelectorAll('button, [role="button"]')]
          .filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label')
            && !b.getAttribute('title') && !b.getAttribute('aria-labelledby'))
          .map((b) => b.outerHTML.slice(0, 120));
        const inputsNoLabel = [...document.querySelectorAll('input, select, textarea')]
          .filter((el) => {
            if (el.type === 'hidden') return false;
            if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
            if (el.id && document.querySelector(`label[for="${el.id}"]`)) return false;
            return !el.closest('label');
          })
          .map((el) => el.outerHTML.slice(0, 120));
        const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
          .map((h) => ({ level: Number(h.tagName[1]), text: (h.textContent || '').trim().slice(0, 60) }));
        return {
          htmlLang: document.documentElement.getAttribute('lang'),
          title: (document.title || '').trim(),
          h1Count: headings.filter((h) => h.level === 1).length,
          headings,
          dupIds: [...new Set(dupes)],
          imgsNoAlt,
          deadHrefs: [...new Set(deadHrefs)],
          unnamedButtons,
          inputsNoLabel,
          imgCount: document.images.length,
          domNodes: document.querySelectorAll('*').length,
        };
      });
      report[name] = audit;
    }

    await testInfo_attach('accessibility-audit', report);

    const violations = [];
    for (const [name, a] of Object.entries(report)) {
      if (!a.htmlLang) violations.push(`${name}: <html lang> missing`);
      if (!a.title) violations.push(`${name}: <title> missing`);
      if (a.dupIds.length) violations.push(`${name}: duplicate ids ${a.dupIds.join(', ')}`);
      if (a.imgsNoAlt.length) violations.push(`${name}: <img> without alt ${a.imgsNoAlt.join(', ')}`);
      if (a.deadHrefs.length) violations.push(`${name}: dead hrefs ${a.deadHrefs.join(', ')}`);
      if (a.unnamedButtons.length) violations.push(`${name}: unnamed buttons ${JSON.stringify(a.unnamedButtons)}`);
      if (a.inputsNoLabel.length) violations.push(`${name}: unlabelled controls ${JSON.stringify(a.inputsNoLabel)}`);
    }
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  // QA-001 - fixed: home (hi/en/sa), festival and date pages now render a
  // page-level <h1> (index.php, .page-h1); track pages keep .track-h1 and
  // 404 keeps .notfound-title, so every route ships exactly one.
  test('heading structure: exactly one <h1> per route', async ({ page }) => {
    const counts = {};
    for (const [name, path] of ROUTES) {
      await page.goto(path, { waitUntil: 'networkidle', timeout: 60000 });
      counts[name] = await page.locator('h1').count();
    }
    await testInfo_attach('heading-h1-counts', counts);

    const offenders = Object.entries(counts).filter(([, n]) => n !== 1)
      .map(([name, n]) => `${name}: ${n} <h1>`);
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  test('content coverage: catalogue, API, sitemap and lyrics stay in sync', async ({ request }) => {
    const suggest = await (await request.get('api/?action=suggest')).json();
    const health = await (await request.get('api/?action=health')).json();
    const xml = await (await request.get('sitemap.xml')).text();

    const tracks = suggest.tracks || [];
    const slugs = tracks.map((t) => t.slug);
    const dupSlugs = slugs.filter((s, i) => slugs.indexOf(s) !== i);

    const sitemapTrackSlugs = [...xml.matchAll(/<loc>[^<]*?\/track\/([^<]+)<\/loc>/g)].map((m) => m[1]);
    const uniqueSitemapSlugs = [...new Set(sitemapTrackSlugs)];
    const missingInSitemap = slugs.filter((s) => !uniqueSitemapSlugs.includes(s));
    const orphanInSitemap = uniqueSitemapSlugs.filter((s) => !slugs.includes(s));

    const withLyrics = tracks.filter((t) => t.lyrics > 0);
    const withoutLyrics = tracks.filter((t) => !(t.lyrics > 0));

    const coverage = {
      health,
      totalTracks: tracks.length,
      sitemapTrackSlugs: uniqueSitemapSlugs.length,
      dupSlugs,
      missingInSitemap,
      orphanInSitemap,
      withLyrics: withLyrics.map((t) => t.slug),
      withoutLyrics: withoutLyrics.map((t) => t.slug),
      lyricsCoveragePct: tracks.length ? Math.round((withLyrics.length / tracks.length) * 100) : 0,
      missingLyricsDetail: withoutLyrics.map((t) => `${t.slug} | ${t.title_en}`),
      tracksMissingField: tracks.filter((t) => !t.title_hi || !t.title_en || !t.type)
        .map((t) => t.slug),
    };
    await testInfo_attach('content-coverage', coverage);

    expect(health).toBeTruthy();
    expect(coverage.totalTracks).toBeGreaterThanOrEqual(59);
    expect(dupSlugs, 'duplicate slugs in catalogue').toEqual([]);
    expect(missingInSitemap, 'tracks absent from sitemap').toEqual([]);
    expect(orphanInSitemap, 'orphan track slugs in sitemap').toEqual([]);
    expect(coverage.tracksMissingField, 'catalogue fields incomplete').toEqual([]);
    expect(withLyrics.length, 'some lyrics must ship').toBeGreaterThanOrEqual(29);
  });

  test('performance smoke: home page budget', async ({ page }) => {
    await page.goto('./', { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('[data-slot="all"]').click();
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible({ timeout: 30000 });

    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const res = performance.getEntriesByType('resource');
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        loadEvent: Math.round(nav.loadEventEnd || 0),
        resources: res.length,
        transferredKb: Math.round(res.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
        domNodes: document.querySelectorAll('*').length,
        longTasks: (performance.getEntriesByType('longtask') || []).length,
      };
    });
    await testInfo_attach('performance-home', perf);

    expect(perf.loadEvent, `load event took ${perf.loadEvent}ms`).toBeLessThan(15000);
    expect(perf.domNodes, `home renders ${perf.domNodes} nodes`).toBeLessThan(6000);
  });
});

async function testInfo_attach(name, body) {
  // eslint-disable-next-line no-undef
  await test.info().attach(name, {
    contentType: 'application/json',
    body: JSON.stringify(body, null, 2),
  });
}
