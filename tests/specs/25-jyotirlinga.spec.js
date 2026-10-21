const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost/bhakti-sagar';

async function liveJyotirlingas(request) {
  const data = await (await request.get('api/?action=suggest')).json();
  return (data.jyotirlingas || []).filter((x) => x.youtube_id);
}

test.describe('ज्योतिर्लिंग लाइव दर्शन', () => {
  test('home shows one card per live darshan, in traditional order', async ({ page, request }) => {
    const live = await liveJyotirlingas(request);
    expect(live.length, 'at least one Jyotirlinga must be live').toBeGreaterThanOrEqual(1);

    await page.goto('./');
    await expect(page.locator('#jyoSection')).toBeVisible();
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('ज्योतिर्लिंग लाइव दर्शन');
    await expect(page.locator('#jyoGrid .track-card')).toHaveCount(live.length);
    await expect(page.locator('#jyoGrid .badge-live')).toHaveCount(live.length);
    await expect(page.locator('#jyoGrid [data-jplay]')).toHaveCount(live.length);

    // the cards follow data/jyotirlingas.php order, so सोमनाथ (order 1) leads
    const titles = await page.locator('#jyoGrid .track-title').allTextContents();
    expect(titles[0]).toContain('सोमनाथ');
    expect(new Set(titles.map((t) => t.trim())).size).toBe(live.length);

    for (const img of await page.locator('#jyoGrid .thumb img').all()) {
      expect(await img.getAttribute('src'))
        .toMatch(/^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\/hqdefault\.jpg$/);
      expect(await img.getAttribute('alt')).toBeTruthy();
    }
  });

  test('clicking a darshan loads it into the player queue', async ({ page, request }) => {
    const live = await liveJyotirlingas(request);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    // the mini bar is the mobile player; it stays out of the desktop layout
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    await expect(page.locator('#jyoGrid [data-jplay]').first()).toBeVisible({ timeout: 30000 });
    const name = (await page.locator('#jyoGrid .track-title').first().textContent()).trim();

    await page.locator('#jyoGrid [data-jplay]').first().click();

    await expect(page.locator('#nowTitle')).toContainText(name);
    await expect(page.locator('#nowMeta')).toContainText('लाइव दर्शन');
    // the queue carries every live darshan, so next/prev walks the Jyotirlingas
    await expect(page.locator('#queueCount')).toHaveText(String(live.length));
    await expect(page.locator('#miniBar')).toBeVisible();
    await expect(page.locator('#btnOpenYt')).toHaveAttribute('href', /watch\?v=[A-Za-z0-9_-]{11}/);
    await expect(page.locator('#jyoGrid .track-card.is-playing')).toHaveCount(1, { timeout: 60000 });

    expect(errors).toEqual([]);
  });

  test('/en shows the English names and the LIVE badge', async ({ page, request }) => {
    const live = await liveJyotirlingas(request);
    await page.goto('en');
    await expect(page.locator('#jyoSection')).toBeVisible();
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('Jyotirlinga Live Darshan');
    await expect(page.locator('#jyoGrid .track-card')).toHaveCount(live.length);
    await expect(page.locator('#jyoGrid .badge-live').first()).toHaveText('LIVE');
    const titles = await page.locator('#jyoGrid .track-title').allTextContents();
    expect(titles[0]).toContain('Somnath');
  });
});
