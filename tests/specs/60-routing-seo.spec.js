const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost/bhakti-sagar';

function meta(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

test.describe('Routing & SEO', () => {
  test('home: 200, lang=hi, canonical, hreflang trio, JSON-LD, __ROUTE__', async ({ request }) => {
    const res = await request.get('');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/html');
    const html = await res.text();

    expect(html).toContain('<html lang="hi">');
    expect(html).toContain('<link rel="canonical" href="http://localhost/bhakti-sagar/">');
    for (const code of ['hi', 'en', 'sa', 'gu', 'x-default']) {
      expect(html, `hreflang ${code}`).toContain(`hreflang="${code}"`);
    }
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).not.toContain('noindex');

    const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
    expect(route).toMatchObject({ kind: 'home', lang: 'hi', path: '/', base: '/bhakti-sagar', notFound: false });
  });

  test('track URL: own title, canonical, MusicRecording, __ROUTE__.track, page still loads data', async ({ request, page }) => {
    const res = await request.get('track/hanuman-chalisa');
    expect(res.status()).toBe(200);
    const html = await res.text();

    expect(html).toContain('<link rel="canonical" href="http://localhost/bhakti-sagar/track/hanuman-chalisa">');
    expect(html).toContain('"@type":"MusicRecording"');
    expect(html).toContain('"@type":"BreadcrumbList"');

    const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
    expect(route.kind).toBe('track');
    expect(route.track).toBe('hanuman-chalisa');

    // pretty URL changes the document base -> API must still be reached from the site root
    const errors = [];
    let apiUrl = '';
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('request', (r) => { if (r.url().includes('/api/?action=suggest')) { apiUrl = r.url(); } });

    await page.goto('track/hanuman-chalisa');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();
    await expect(page.locator('#trackGrid .track-card.is-focused')).toHaveCount(1);
    expect(apiUrl.startsWith(`${BASE}/api/?`), `api url was ${apiUrl}`).toBe(true);
    expect(errors).toEqual([]);
  });

  test('/en, /sa and /gu switch <html lang>, title and hreflang but keep the route kind', async ({ request }) => {
    const home = {
      en: await (await request.get('en')).text(),
      sa: await (await request.get('sa')).text(),
      gu: await (await request.get('gu')).text(),
    };
    expect(home.en).toContain('<html lang="en">');
    expect(home.en).toContain('<title>Bhakti Sagar | Hindu Shlokas');
    expect(home.sa).toContain('<html lang="sa">');
    expect(home.gu).toContain('<html lang="gu">');
    expect(home.gu).toContain('<title>ભક્તિ સાગર | શ્લોક, ભજન અને આરતી');

    for (const lang of ['en', 'sa', 'gu']) {
      const html = await (await request.get(`${lang}/track/hanuman-chalisa`)).text();
      expect(html, `${lang} track`).toContain(`<html lang="${lang}">`);
      const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
      expect(route).toMatchObject({ kind: 'track', lang, track: 'hanuman-chalisa' });
      expect(html).toContain(`rel="canonical" href="http://localhost/bhakti-sagar/${lang}/track/hanuman-chalisa"`);
    }
  });

  test('language switch links are present and point at the same page in every language', async ({ request, page }) => {
    await page.goto('track/hanuman-chalisa');
    const hrefs = await page.locator('.lang-switch .lang-link').evaluateAll((els) =>
      els.map((a) => ({ lang: a.getAttribute('hreflang'), href: a.getAttribute('href') }))
    );
    expect(hrefs.map((h) => h.lang).sort()).toEqual(['en', 'gu', 'hi', 'sa']);
    expect(hrefs.find((h) => h.lang === 'hi').href, 'hi').toBe('/bhakti-sagar/track/hanuman-chalisa');
    expect(hrefs.find((h) => h.lang === 'en').href, 'en').toBe('/bhakti-sagar/en/track/hanuman-chalisa');
    expect(hrefs.find((h) => h.lang === 'sa').href, 'sa').toBe('/bhakti-sagar/sa/track/hanuman-chalisa');
    expect(hrefs.find((h) => h.lang === 'gu').href, 'gu').toBe('/bhakti-sagar/gu/track/hanuman-chalisa');
    await expect(page.locator('.lang-link.is-current')).toHaveAttribute('hreflang', 'hi');

    // and the link must actually navigate (href has to include the mount point)
    await page.locator('.lang-link[hreflang="en"]').click();
    await expect(page).toHaveURL(`${BASE}/en/track/hanuman-chalisa`);
    await expect(page.locator('.lang-link.is-current')).toHaveAttribute('hreflang', 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('festival URL pins its next occurrence into __ROUTE__.date', async ({ request }) => {
    const res = await request.get('festival/diwali-lakshmi-puja');
    expect(res.status()).toBe(200);
    const html = await res.text();
    const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
    expect(route.kind).toBe('festival');
    expect(route.festival).toBe('diwali-lakshmi-puja');
    expect(route.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(html).toContain('"@type":"Event"');
    expect(html).toContain('startDate');
  });

  test('date URL is canonical and pins the panchang day', async ({ request }) => {
    const res = await request.get('date/2026-11-15');
    expect(res.status()).toBe(200);
    const html = await res.text();
    const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
    expect(route).toMatchObject({ kind: 'date', date: '2026-11-15' });
    expect(html).toContain('<link rel="canonical" href="http://localhost/bhakti-sagar/date/2026-11-15">');
  });

  test('elderly-friendly aliases 301-redirect to the canonical URL', async ({ request }) => {
    const cases = [
      ['EN', '/bhakti-sagar/en'],
      ['en/', '/bhakti-sagar/en'],
      ['english', '/bhakti-sagar/en'],
      ['english/track/hanuman-chalisa', '/bhakti-sagar/en/track/hanuman-chalisa'],
      ['hindi', '/bhakti-sagar/'],
      ['sanskrit', '/bhakti-sagar/sa'],
      ['gujarati', '/bhakti-sagar/gu'],
      ['date/15-11-2026', '/bhakti-sagar/date/2026-11-15'],
      ['index.php', '/bhakti-sagar/'],
      ['Track/hanuman-chalisa', '/bhakti-sagar/track/hanuman-chalisa'],
    ];
    for (const [from, to] of cases) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), `${from} status`).toBe(301);
      expect(res.headers()['location'], `${from} -> ${to}`).toBe(to);
    }
  });

  test('query strings survive the canonical redirect', async ({ request }) => {
    const res = await request.get('en/?city=ahmedabad', { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers()['location']).toBe('/bhakti-sagar/en?city=ahmedabad');
  });

  test('unknown paths return 404 + noindex and render the not-found panel', async ({ request }) => {
    for (const path of ['nope/xyz', 'track/does-not-exist', 'festival/not-a-festival']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(404);
      const html = await res.text();
      expect(html, path).toContain('<meta name="robots" content="noindex, follow">');
      expect(html, path).toContain('class="notfound"');
      const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
      expect(route.notFound, path).toBe(true);
    }
  });

  test('404 panel links back home and the rest of the site still works', async ({ page }) => {
    await page.goto('nope/xyz');
    await expect(page.locator('#notFound')).toBeVisible();
    await expect(page.locator('#notFound .notfound-code')).toHaveText('404');
    const href = await page.locator('#notFound .notfound-link').getAttribute('href');
    expect(href).toBe('/bhakti-sagar/');
    await page.locator('#notFound .notfound-link').click();
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();
  });
});

test.describe('robots.txt & sitemap.xml', () => {
  test('robots.txt is text/plain, not the HTML shell', async ({ request }) => {
    const res = await request.get('robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Disallow: /lib/');
    expect(body).toContain(`Sitemap: ${BASE}/sitemap.xml`);
    expect(body).not.toContain('<!DOCTYPE html>');
  });

  test('sitemap.xml lists home + every track + every festival with hreflang alternates', async ({ request }) => {
    const res = await request.get('sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('xml');
    const xml = await res.text();

    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).not.toContain('<!DOCTYPE html>');

    const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    expect(locs.length).toBeGreaterThanOrEqual(276); // 1 home + 59 tracks + 216 festivals
    expect(locs.some((l) => l.includes(`${BASE}/`))).toBe(true);
    expect(locs.some((l) => l.includes('/track/hanuman-chalisa'))).toBe(true);
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).toContain('hreflang="en"');
  });

  test('internal directories are blocked from crawling', async ({ request }) => {
    const body = await (await request.get('robots.txt')).text();
    for (const path of ['/api/', '/lib/', '/data/', '/i18n/', '/config.php', '/*?city=']) {
      expect(body, path).toContain(`Disallow: ${path}`);
    }
  });
});
