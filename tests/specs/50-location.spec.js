const { test, expect } = require('@playwright/test');

const Delhi = { city: 'new-delhi' };

async function seedCity(page, key) {
  await page.addInitScript((k) => {
    if (!window.localStorage.getItem('bs.city')) {
      window.localStorage.setItem('bs.city', k);
      window.localStorage.setItem('bs.cityAuto', '0');
    }
  }, key);
}

test.describe('Location-aware panchang', () => {
  test('API exposes the city registry and serves per-city sunrise', async ({ request }) => {
    const res = await request.get('./api/?action=suggest');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.location.key).toBe('new-delhi');
    expect(body.locations.length).toBeGreaterThanOrEqual(20);
    expect(body.locations.some((l) => l.key === 'london' && l.timezone === 'Europe/London')).toBeTruthy();

    const london = await (await request.get('./api/?action=suggest&city=london')).json();
    expect(london.location.key).toBe('london');
    expect(london.panchang.sunrise).not.toBe(body.panchang.sunrise);
    expect(london.panchang.source).toBe('json');
  });

  test('unknown / traversal ?city= falls back to the default city', async ({ request }) => {
    for (const key of ['nowhere', '../../config', 'london/../../config']) {
      const body = await (await request.get('./api/?action=suggest&city=' + encodeURIComponent(key))).json();
      expect(body.location.key).toBe('new-delhi');
    }
  });

  test('city picker is populated, note explains the location', async ({ page }) => {
    await seedCity(page, Delhi.city);
    await page.goto('./');
    const select = page.locator('#citySelect');
    await expect(select).toBeVisible();
    await expect.poll(async () => select.locator('option').count()).toBeGreaterThanOrEqual(20);
    await expect(select).toHaveValue('new-delhi');
    await expect(page.locator('#panchangNote')).toContainText('नई दिल्ली');
    await expect(page.locator('#panchangStrip')).toBeVisible();
  });

  test('switching to London changes sunrise and survives a reload', async ({ page }) => {
    await seedCity(page, Delhi.city);
    await page.goto('./');
    const rise = page.locator('#pcRise');
    await expect(rise).toHaveText(/^\d{2}:\d{2}$/);
    const delhiRise = await rise.textContent();

    await page.locator('#citySelect').selectOption('london');
    await expect.poll(async () => rise.textContent()).not.toBe(delhiRise);
    await expect(page.locator('#panchangNote')).toContainText('लंदन');
    await expect(page.locator('#citySelect')).toHaveValue('london');
    const londonRise = await rise.textContent();

    await page.reload();
    await expect(page.locator('#citySelect')).toHaveValue('london');
    await expect(rise).toHaveText(londonRise);
    expect(await page.evaluate(() => window.localStorage.getItem('bs.city'))).toBe('london');
  });

  test('?city= pin overrides the stored choice', async ({ page }) => {
    await seedCity(page, Delhi.city);
    await page.goto('./?city=sydney');
    await expect(page.locator('#citySelect')).toHaveValue('sydney');
    await expect(page.locator('#panchangNote')).toContainText('सिडनी');
  });

  test('?date= + ?city= disagree on tithi (Drik: 27 Aug 2026)', async ({ page }) => {
    await page.goto('./?date=2026-08-27&city=new-delhi');
    await expect(page.locator('#pcTithi')).toHaveText('शुक्ल पक्ष चतुर्दशी');

    await page.goto('./?date=2026-08-27&city=london');
    await expect(page.locator('#pcTithi')).toHaveText('शुक्ल पक्ष पूर्णिमा');
  });

  test('no console errors while switching cities', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await seedCity(page, Delhi.city);
    await page.goto('./');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();
    for (const key of ['london', 'new-york', 'sydney', 'suva', 'new-delhi']) {
      await page.locator('#citySelect').selectOption(key);
      await expect(page.locator('#citySelect')).toHaveValue(key);
      await expect.poll(async () => (await page.locator('#pcRise').textContent())).toMatch(/^\d{2}:\d{2}$/);
    }
    await page.waitForTimeout(800);
    expect(errors).toEqual([]);
  });
});
