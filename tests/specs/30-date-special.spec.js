const { test, expect } = require('@playwright/test');

test.describe('Date deep-link & आज विशेष', () => {
  test('?date=2026-11-08 (दिवाली): chips, badges, special cards', async ({ page }) => {
    await page.goto('./?date=2026-11-08');
    await expect(page.locator('#specialSection')).toBeVisible();
    const badges = (await page.locator('.rule-badge').allTextContents()).join('|');
    expect(badges).toContain('दिवाली – लक्ष्मी पूजा');
    expect(badges).not.toContain('महाशिवरात्रि');
    const chips = (await page.locator('.fest-chip').allTextContents()).join('|');
    expect(chips).toContain('दिवाली');
    const cards = await page.locator('#specialGrid .track-card').count();
    expect(cards).toBeGreaterThanOrEqual(5);
    expect(await page.locator('#specialGrid [data-splay]').count()).toBe(cards);
    await expect(page.locator('#panchangStrip')).toContainText('रविवार');
  });

  test('?date=2026-11-24 (कार्तिक पूर्णिमा): no दिवाली badge', async ({ page }) => {
    await page.goto('./?date=2026-11-24');
    await expect(page.locator('#specialSection')).toBeVisible();
    const badges = (await page.locator('.rule-badge').allTextContents()).join('|');
    expect(badges).not.toContain('दिवाली – लक्ष्मी पूजा');
    expect(badges).toContain('पूर्णिमा');
  });

  test('?date=2026-08-17 (सावन सोमवार + नाग पंचमी): both badges', async ({ page }) => {
    await page.goto('./?date=2026-08-17');
    await expect(page.locator('#specialSection')).toBeVisible();
    const badges = (await page.locator('.rule-badge').allTextContents()).join('|');
    expect(badges).toContain('सावन सोमवार – शिव आराधना');
    expect(badges).toContain('नाग पंचमी');
  });

  test('invalid date falls back to today without crash', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('./?date=2026-99-99');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('page has no console errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto('./');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });
});
