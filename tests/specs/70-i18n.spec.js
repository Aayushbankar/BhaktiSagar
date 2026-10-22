const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost/bhakti-sagar';
const I18N_DIR = path.join(__dirname, '..', '..', 'i18n');

function readTable(lang) {
  return JSON.parse(fs.readFileSync(path.join(I18N_DIR, `${lang}.json`), 'utf8'));
}

test.describe('i18n', () => {
  test('hi, en, sa and gu tables carry exactly the same keys', () => {
    const hi = Object.keys(readTable('hi')).sort();
    const en = Object.keys(readTable('en')).sort();
    const sa = Object.keys(readTable('sa')).sort();
    const gu = Object.keys(readTable('gu')).sort();

    expect(hi.length).toBeGreaterThan(60);
    expect(en).toEqual(hi);
    expect(sa).toEqual(hi);
    expect(gu).toEqual(hi);

    for (const lang of ['hi', 'en', 'sa', 'gu']) {
      const table = readTable(lang);
      for (const [key, value] of Object.entries(table)) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect(value.length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  test('index.php embeds the table for the requested language', async ({ request }) => {
    for (const lang of ['hi', 'en', 'sa', 'gu']) {
      const url = lang === 'hi' ? '' : `${lang}`;
      const html = await (await request.get(url)).text();
      const m = html.match(/window\.__I18N__ = (\{.*?\});/);
      expect(m, `__I18N__ missing on ${lang}`).toBeTruthy();
      const embedded = JSON.parse(m[1]);
      expect(Object.keys(embedded).sort(), lang).toEqual(Object.keys(readTable('hi')).sort());
      expect(embedded['player.toggle']).toBe(readTable(lang)['player.toggle']);
    }
  });

  test('/ stays Hindi', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.locator('#searchInput')).toHaveAttribute('placeholder', /भजन/);
    await expect(page.locator('#nowTitle')).toHaveText('प्लेयर तैयार है');
    await expect(page.locator('.queue-head h3')).toHaveText('चलने की सूची');
    await expect(page.locator('#slotChips')).toContainText('सभी समय');
    await expect(page.locator('#typeChips')).toContainText('श्लोक');
    await expect(page.locator('#panchangTitle')).toHaveText('आज का पंचांग');
    await expect(page.locator('.special-title')).toContainText('आज विशेष');
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('ज्योतिर्लिंग लाइव दर्शन');
    await expect(page.locator('.lang-link.is-current')).toHaveAttribute('hreflang', 'hi');
  });

  test('/en renders the whole chrome in English', async ({ page }) => {
    await page.goto('en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#searchInput')).toHaveAttribute('placeholder', 'Search a bhajan, aarti, shloka or deity…');
    await expect(page.locator('#nowTitle')).toHaveText('Player is ready');
    await expect(page.locator('.queue-head h3')).toHaveText('Play queue');
    await expect(page.locator('#slotChips')).toContainText('All day');
    await expect(page.locator('#slotChips')).toContainText('Brahma Muhurta');
    await expect(page.locator('#typeChips')).toContainText('Shloka');
    await expect(page.locator('#panchangTitle')).toHaveText("Today's panchang");
    await expect(page.locator('#panchangStrip')).toContainText('Sunrise');
    await expect(page.locator('.site-footer')).toContainText('No login, no fees.');
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('Jyotirlinga Live Darshan');
    await expect(page.locator('#resultCount')).toContainText('results');
    await expect(page.locator('#quickNav a[href="#trackGrid"]')).toHaveText('Song catalogue');
    await expect(page.locator('.footer-links a[href="#playerCol"]')).toHaveText('Player & queue');
    await expect(page.locator('#btnSound')).toHaveAttribute('aria-label', 'Mute sound');
    // the language switcher itself stays bilingual
    await expect(page.locator('.lang-link.is-current')).toHaveAttribute('hreflang', 'en');
    await expect(page.locator('.lang-link[hreflang="sa"]')).toBeVisible();
  });

  test('/sa renders the whole chrome in Sanskrit', async ({ page }) => {
    await page.goto('sa');
    await expect(page.locator('html')).toHaveAttribute('lang', 'sa');
    await expect(page.locator('#nowTitle')).toHaveText('वादकः सज्जः अस्ति');
    await expect(page.locator('.queue-head h3')).toHaveText('चलनसूची');
    await expect(page.locator('#slotChips')).toContainText('सर्वदिनम्');
    await expect(page.locator('#panchangTitle')).toHaveText('अद्य पञ्चाङ्गम्');
    await expect(page.locator('#panchangStrip')).toContainText('सूर्योदयः');
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('ज्योतिर्लिंग लाइव दर्शनम्');
    await expect(page.locator('#quickNav a[href="#trackGrid"]')).toHaveText('गीतसङ्ग्रहः');
  });

  test('/gu renders the whole chrome in Gujarati', async ({ page }) => {
    await page.goto('gu');
    await expect(page.locator('html')).toHaveAttribute('lang', 'gu');
    await expect(page.locator('#nowTitle')).toHaveText('પ્લેયર તૈયાર છે');
    await expect(page.locator('.queue-head h3')).toHaveText('ચાલુ રહેલ યાદી');
    await expect(page.locator('#slotChips')).toContainText('બધા સમય');
    await expect(page.locator('#typeChips')).toContainText('શ્લોક');
    await expect(page.locator('#panchangTitle')).toHaveText('આજનું પંચાંગ');
    await expect(page.locator('#jyoSection .jyo-title')).toContainText('જ્યોતિર્લિંગ લાઈવ દર્શન');
    await expect(page.locator('#quickNav a[href="#trackGrid"]')).toHaveText('ભજન સંગ્રહ');
    await expect(page.locator('.lang-link.is-current')).toHaveAttribute('hreflang', 'gu');
    await expect(page.locator('.lang-link.is-current')).toHaveText('ગુજરાતી');
    await expect(page.locator('.lang-link[hreflang="sa"]')).toBeVisible();
  });

  test('/en uses the English song titles and English empty states', async ({ page, request }) => {
    const data = await (await request.get('api/?action=suggest')).json();
    const track = (data.tracks || []).find(
      (t) => t.title_en && t.title_hi && t.title_en !== t.title_hi
    );
    expect(track, 'catalogue has no bilingual title').toBeTruthy();

    await page.goto('en');
    await page.locator('#slotChips [data-slot="all"]').click();
    await expect(page.locator('#resultCount')).toContainText('results');

    await page.locator('#searchInput').fill(track.title_en);
    await expect(page.locator('#trackGrid .track-title')).toHaveCount(1);
    await expect(page.locator('#trackGrid .track-title')).toHaveText(track.title_en);
    // the Devanagari title must not be what an English visitor reads
    await expect(page.locator('#trackGrid .track-title')).not.toHaveText(track.title_hi);

    await page.locator('#searchInput').fill('zzzz-no-such-song');
    await expect(page.locator('#trackGrid .empty-state')).toContainText('Nothing matched');
    await expect(page.locator('#resultCount')).toHaveText('0 results');

    // switching language is a plain navigation back to the default language
    await page.locator('.lang-link[hreflang="hi"]').click();
    await expect(page).toHaveURL(`${BASE}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.locator('#searchInput')).toHaveAttribute('placeholder', /भजन/);
  });

  test('a language change is a plain navigation: no reload loop, no page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      // the YouTube player's compute-pressure probe trips a Permissions
      // Policy warning in every browser — not ours to fix
      if (m.type() === 'error' && !/compute-pressure|Permissions policy/i.test(m.text())) {
        errors.push(m.text());
      }
    });

    await page.goto('track/hanuman-chalisa');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();

    await page.locator('.lang-link[hreflang="sa"]').click();
    await expect(page).toHaveURL(`${BASE}/sa/track/hanuman-chalisa`);
    await expect(page.locator('#nowTitle')).toHaveText('वादकः सज्जः अस्ति');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();

    await page.locator('.lang-link[hreflang="hi"]').click();
    await expect(page).toHaveURL(`${BASE}/track/hanuman-chalisa`);
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible();

    expect(errors).toEqual([]);
  });
});
