const { test, expect } = require('@playwright/test');

const chipCount = async (page, sel) => {
  const txt = (await page.locator(sel).textContent()) || '';
  const m = txt.match(/\((\d+)\)/);
  return m ? parseInt(m[1], 10) : NaN;
};

test.describe('Home UI & filters', () => {
  test('renders panchang strip, clock pill, daily shloka, grids', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#panchangStrip')).toBeVisible();
    await expect(page.locator('#panchangStrip')).toContainText('वार');
    await expect(page.locator('#panchangStrip')).toContainText('तिथि');
    await expect(page.locator('#slotPillText')).toContainText('·', { timeout: 15000 });
    await expect(page.locator('#shlokaText')).not.toBeEmpty();
    await expect(page.locator('#shlokaTranslit')).not.toBeEmpty();
    await expect(page.locator('#shlokaSource')).not.toBeEmpty();
    await expect(page.locator('#slotChips [data-slot]')).toHaveCount(8);
    await expect(page.locator('#typeChips [data-type]')).toHaveCount(4);
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();
    await expect(page.locator('#resultCount')).toContainText('परिणाम');
  });

  test('type chips counts match visible grid (श्लोक = 18) with सभी समय', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-slot="all"]').click();

    expect(await chipCount(page, '[data-type="all"]')).toBe(59);
    expect(await page.locator('#trackGrid .track-card').count()).toBe(59);

    const shlokaN = await chipCount(page, '[data-type="shloka"]');
    expect(shlokaN).toBe(18);
    await page.locator('[data-type="shloka"]').click();
    expect(await page.locator('#trackGrid .track-card').count()).toBe(shlokaN);

    const bhajanN = await chipCount(page, '[data-type="bhajan"]');
    await page.locator('[data-type="bhajan"]').click();
    expect(await page.locator('#trackGrid .track-card').count()).toBe(bhajanN);

    const aartiN = await chipCount(page, '[data-type="aarti"]');
    await page.locator('[data-type="aarti"]').click();
    expect(await page.locator('#trackGrid .track-card').count()).toBe(aartiN);
    expect(shlokaN + bhajanN + aartiN).toBe(59);
  });

  test('slot filter narrows results; resultCount always matches grid', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-slot="pratah"]').click();
    const rc1 = parseInt((await page.locator('#resultCount').textContent()).match(/\d+/)[0], 10);
    const cards1 = await page.locator('#trackGrid .track-card').count();
    expect(rc1).toBe(cards1);
    expect(cards1).toBeGreaterThan(0);

    await page.locator('[data-slot="all"]').click();
    const cards2 = await page.locator('#trackGrid .track-card').count();
    expect(cards2).toBeGreaterThan(cards1);

    await page.locator('[data-slot="ratri"]').click();
    const rc3 = parseInt((await page.locator('#resultCount').textContent()).match(/\d+/)[0], 10);
    expect(rc3).toBe(await page.locator('#trackGrid .track-card').count());
  });

  test('slot+type interplay: chip count == grid count, empty state explains (bug fix)', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-slot="aarti"]').click();
    await page.locator('[data-type="shloka"]').click();

    const n = await chipCount(page, '[data-type="shloka"]');
    const cards = await page.locator('#trackGrid .track-card').count();
    expect(cards).toBe(n);
    expect(n).toBe(0);
    await expect(page.locator('#trackGrid .empty-state')).toContainText('समय');
    await expect(page.locator('#trackGrid .empty-state')).toContainText('श्लोक');
    await expect(page.locator('#resultCount')).toHaveText('0 परिणाम');

    await page.locator('[data-type="aarti"]').click();
    const aartiCards = await page.locator('#trackGrid .track-card').count();
    expect(aartiCards).toBeGreaterThan(0);
    expect(aartiCards).toBe(await chipCount(page, '[data-type="aarti"]'));
  });

  test('search filters results and clears back', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-slot="all"]').click();
    await page.locator('#searchInput').fill('हनुमान');
    await page.waitForTimeout(500);
    const n = await page.locator('#trackGrid .track-card').count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(59);
    const rc = parseInt((await page.locator('#resultCount').textContent()).match(/\d+/)[0], 10);
    expect(rc).toBe(n);

    await page.locator('#searchInput').fill('zzzz-no-match');
    await page.waitForTimeout(500);
    expect(await page.locator('#trackGrid .track-card').count()).toBe(0);
    await expect(page.locator('#trackGrid .empty-state')).toContainText('खोज');

    await page.locator('#searchInput').fill('');
    await page.waitForTimeout(500);
    expect(await page.locator('#trackGrid .track-card').count()).toBe(59);
  });

  test('chip count == grid count for EVERY slot × type combination', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('./');
    const slots = await page
      .locator('#slotChips [data-slot]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-slot')));
    expect(slots.length).toBe(8);

    for (const slot of slots) {
      await page.locator(`[data-slot="${slot}"]`).click();
      for (const type of ['all', 'shloka', 'bhajan', 'aarti']) {
        await page.locator(`[data-type="${type}"]`).click();
        const chipN = await chipCount(page, `[data-type="${type}"]`);
        const cards = await page.locator('#trackGrid .track-card').count();
        expect(chipN, `chip count slot=${slot} type=${type}`).toBeGreaterThanOrEqual(0);
        expect(cards, `grid cards slot=${slot} type=${type}`).toBe(chipN);
        const rc = parseInt((await page.locator('#resultCount').textContent()).match(/\d+/)[0], 10);
        expect(rc, `resultCount slot=${slot} type=${type}`).toBe(chipN);
        if (chipN === 0) {
          await expect(page.locator('#trackGrid .empty-state'), `empty state slot=${slot} type=${type}`).toBeVisible();
        }
      }
    }

    await page.locator('[data-slot="all"]').click();
    expect(await chipCount(page, '[data-type="all"]')).toBe(59);
    expect(await chipCount(page, '[data-type="shloka"]')).toBe(18);
    expect(await chipCount(page, '[data-type="bhajan"]')).toBe(26);
    expect(await chipCount(page, '[data-type="aarti"]')).toBe(15);
  });

  test('app.js and style.css are cache-busted (?v=) so fixes reach users', async ({ page }) => {
    await page.goto('./');
    const jsSrc = await page.locator('script[src*="app.js"]').getAttribute('src');
    expect(jsSrc, 'app.js must carry ?v= cache-buster').toMatch(/app\.js\?v=\d{10,}/);
    const cssHref = await page.locator('link[rel="stylesheet"][href*="style.css"]').getAttribute('href');
    expect(cssHref, 'style.css must carry ?v= cache-buster').toMatch(/style\.css\?v=\d{10,}/);
  });

  test('text-size control cycles three steps, enlarges the page and persists', async ({ page }) => {
    await page.goto('./');
    const html = page.locator('html');
    const btn = page.locator('#textSizeBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('aria-label', 'Text size / अक्षर का आकार');
    await expect(btn).toHaveAttribute('data-size', '1');
    await expect(html).toHaveAttribute('data-textsize', '1');

    const rootPx = () => page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).fontSize));
    const base = await rootPx();
    expect(base).toBeGreaterThan(0);

    // step 2: root font-size really grows (every rem in the UI scales with it)
    await btn.click();
    await expect(btn).toHaveAttribute('data-size', '2');
    await expect(html).toHaveAttribute('data-textsize', '2');
    expect(await rootPx()).toBeGreaterThan(base);

    // step 3
    await btn.click();
    await expect(btn).toHaveAttribute('data-size', '3');
    await expect(html).toHaveAttribute('data-textsize', '3');
    expect(await rootPx()).toBeGreaterThan(base * 1.15);

    // the choice survives a reload — the inline head script applies it early
    await page.reload();
    await expect(html).toHaveAttribute('data-textsize', '3');
    await expect(btn).toHaveAttribute('data-size', '3');

    // one more tap wraps back to the default
    await btn.click();
    await expect(html).toHaveAttribute('data-textsize', '1');
    await expect(btn).toHaveAttribute('data-size', '1');
    expect(Math.abs((await rootPx()) - base)).toBeLessThan(0.5);
  });

  test('quick links and footer links point at real page sections', async ({ page, request }) => {
    await page.goto('./');
    const nav = page.locator('#quickNav');
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-label', 'त्वरित लिंक');

    // every pill must target an element that really exists on the page
    const hrefs = await nav.locator('a').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(2);
    for (const href of hrefs) {
      expect(href).toMatch(/^#\w+$/);
      await expect(page.locator(href), `anchor target ${href}`).toHaveCount(1);
    }
    await expect(nav.locator('a[href="#trackGrid"]')).toBeVisible();
    await expect(nav.locator('a[href="#playerCol"]')).toBeVisible();

    // jyoSection link is only visible when there are live darshans
    const liveCount = (await (await request.get('api/?action=suggest')).json()).jyotirlingas
      ?.filter((x) => x.available && x.youtube_id).length ?? 0;
    if (liveCount > 0) {
      await expect(nav.locator('a[data-nav="jyoSection"]')).toBeVisible();
    } else {
      await expect(nav.locator('a[data-nav="jyoSection"]')).toBeHidden();
    }

    // footer mirrors the section links and adds the language switcher
    const footer = page.locator('.footer-links');
    await expect(footer).toBeVisible();
    if (liveCount > 0) {
      await expect(footer.locator('a[data-nav="jyoSection"]')).toBeVisible();
    } else {
      await expect(footer.locator('a[data-nav="jyoSection"]')).toBeHidden();
    }
    await expect(footer.locator('a[href="#trackGrid"]')).toBeVisible();
    await expect(footer.locator('a[href="#playerCol"]')).toBeVisible();
    await expect(page.locator('.footer-langs a')).toHaveCount(4);
    await expect(page.locator('.footer-langs a.is-current')).toHaveText('हिन्दी');

    // clicking a pill jumps to that section
    await nav.locator('a[href="#trackGrid"]').click();
    await expect(page).toHaveURL(/#trackGrid$/);
  });
});
