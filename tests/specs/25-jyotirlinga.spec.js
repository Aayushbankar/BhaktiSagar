const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost/bhakti-sagar';

async function liveJyotirlingas(request) {
  const data = await (await request.get('api/?action=suggest')).json();
  // Only currently-LIVE darshans have available=true and a youtube_id
  return (data.jyotirlingas || []).filter((x) => x.available && x.youtube_id);
}

test.describe('ज्योतिर्लिंग लाइव दर्शन', () => {
  test.setTimeout(300000); // 5 min — live resolution takes ~30s on cold cache

  test('home shows one card per live darshan, in traditional order', async ({ page, request }) => {
    const live = await liveJyotirlingas(request);
    expect(live.length, 'at least one Jyotirlinga must be live').toBeGreaterThanOrEqual(1);

    await page.goto('./');
    await expect(page.locator('#jyoSection')).toBeVisible();
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('ज्योतिर्लिंग लाइव दर्शन');
    await expect(page.locator('#jyoGrid .track-card')).toHaveCount(live.length);
    await expect(page.locator('#jyoGrid .badge-live')).toHaveCount(live.length);
    await expect(page.locator('#jyoGrid [data-jtoggle]')).toHaveCount(live.length);

    // the cards follow data/jyotirlingas.php order, so सोमनाथ (order 1) leads
    const titles = await page.locator('#jyoGrid .track-title').allTextContents();
    expect(titles[0]).toContain('सोमनाथ');
    expect(new Set(titles.map((t) => t.trim())).size).toBe(live.length);

    // the section is reachable from the quick links and the footer
    await expect(page.locator('#quickNav a[data-nav="jyoSection"]')).toBeVisible();
    await expect(page.locator('#quickNav a[data-nav="jyoSection"]')).toHaveAttribute('href', '#jyoSection');
    await expect(page.locator('.footer-links a[data-nav="jyoSection"]')).toBeVisible();

    for (const img of await page.locator('#jyoGrid .thumb img').all()) {
      expect(await img.getAttribute('src'))
        .toMatch(/^https:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11}\/hqdefault\.jpg$/);
      expect(await img.getAttribute('alt')).toBeTruthy();
    }

    // iframes are lazy-loaded on user interaction (play/fullscreen click)
    // initially no iframes should be present
    await expect(page.locator('#jyoGrid .jyo-preview iframe')).toHaveCount(0);

    // clicking play button on first card should lazy-load its iframe
    await page.locator('#jyoGrid [data-jtoggle]').first().click();
    await expect(page.locator('#jyoGrid .jyo-preview iframe')).toHaveCount(1, { timeout: 30000 });
    const frame = page.locator('#jyoGrid .jyo-preview iframe').first();
    const src = await frame.getAttribute('src');
    expect(src).toContain(`/embed/${live[0].youtube_id}`);
    expect(src).toContain('autoplay=1');
    expect(src).toContain('mute=1');
    expect(await frame.getAttribute('title')).toBeTruthy();
  });

  test('clicking a darshan loads it into the player queue', async ({ page, request }) => {
    const live = await liveJyotirlingas(request);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    // the mini bar is the mobile player; it stays out of the desktop layout
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    await expect(page.locator('#jyoGrid [data-jtoggle]').first()).toBeVisible({ timeout: 30000 });
    const name = (await page.locator('#jyoGrid .track-title').first().textContent()).trim();

    // tapping the card body (not its pause button) loads the darshan into the player
    await page.locator('#jyoGrid .track-card').first().locator('.track-title').click();

    await expect(page.locator('#nowTitle')).toContainText(name);
    await expect(page.locator('#nowMeta')).toContainText('लाइव दर्शन');
    // the queue carries every live darshan, so next/prev walks the Jyotirlingas
    await expect(page.locator('#queueCount')).toHaveText(String(live.length));
    await expect(page.locator('#miniBar')).toBeVisible();
    await expect(page.locator('#btnOpenYt')).toHaveAttribute('href', /watch\?v=[A-Za-z0-9_-]{11}/);
    await expect(page.locator('#jyoGrid .track-card.is-playing')).toHaveCount(1, { timeout: 60000 });

    // live darshans always come in muted — no surprise audio, autoplay-safe
    await expect(page.locator('#btnSound')).toHaveAttribute('data-muted', '1');
    await expect(page.locator('#btnSound')).toHaveClass(/is-muted/);
    await expect(page.locator('#miniSound')).toHaveAttribute('data-muted', '1');
    await expect(page.locator('#miniSound')).toHaveClass(/is-muted/);

    expect(errors).toEqual([]);
  });

  test('sound button unmutes a live darshan without stopping it', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#jyoGrid [data-jtoggle]').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('#btnSound')).toHaveAttribute('data-muted', '0');

    await page.locator('#jyoGrid .track-card').first().locator('.track-title').click();
    await expect(page.locator('#btnSound')).toHaveAttribute('data-muted', '1');
    await expect(page.locator('#btnSound')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btnSound')).toHaveAttribute('aria-label', 'ध्वनि चालू करें');

    await page.locator('#btnSound').click();
    await expect(page.locator('#btnSound')).toHaveAttribute('data-muted', '0');
    await expect(page.locator('#btnSound')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#btnSound')).toHaveAttribute('aria-label', 'ध्वनि बंद करें');
    await expect(page.locator('#btnSound')).not.toHaveClass(/is-muted/);

    // the stream keeps playing through the toggle
    await expect(page.locator('#jyoGrid .track-card.is-playing')).toHaveCount(1, { timeout: 60000 });
  });

  test('card button icon tracks the live preview and toggles play/pause', async ({ page }) => {
    await page.goto('./');
    const fab = page.locator('#jyoGrid [data-jtoggle]').first();
    await expect(fab).toBeVisible({ timeout: 30000 });

    const PLAY = /M6 5h4v14H6zM14 5h4v14h-4z/;   // two bars
    const PAUSE = /M8 5v14l11-7z/;               // triangle
    const snap = () => fab.evaluate((el) => ({
      state: el.getAttribute('data-playing'),
      d: el.querySelector('svg path') ? el.querySelector('svg path').getAttribute('d') : '',
      label: el.getAttribute('aria-label') || '',
    }));

    // the icon always mirrors the card's own playing state — the stream itself
    // may be offline, so the state is what matters, not one fixed glyph
    await expect(fab).toHaveAttribute('data-playing', /^[01]$/, { timeout: 30000 });
    const first = await snap();
    if (first.state === '1') {
      expect(first.d).toMatch(PLAY);
      expect(first.label).toMatch(/^रोकें /);
    } else {
      expect(first.d).toMatch(PAUSE);
      expect(first.label).toMatch(/का लाइव दर्शन देखें$/);
    }

    // tapping it pauses the preview; the icon flips to play
    await fab.click();
    await expect(fab).toHaveAttribute('data-playing', '0', { timeout: 15000 });
    const paused = await snap();
    expect(paused.d).toMatch(PAUSE);
    await expect(fab).toHaveAttribute('aria-label', /लाइव दर्शन देखें$/);

    // tapping again resumes the preview and the icon returns to pause
    await fab.click();
    await expect(fab).toHaveAttribute('data-playing', '1', { timeout: 15000 });
    const resumed = await snap();
    expect(resumed.d).toMatch(resumed.state === '1' ? PLAY : PAUSE);
  });

  test('/en shows the English names and the LIVE badge', async ({ page, request }) => {
    test.setTimeout(180000);
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
