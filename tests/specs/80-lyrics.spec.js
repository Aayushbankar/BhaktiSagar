const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost/bhakti-sagar';

const WITH_LYRICS = 'om-jai-jagdish-hare-lata';
const WITHOUT_LYRICS = 'hanuman-chalisa';

function meta(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

test.describe('Lyrics / track pages', () => {
  test('track with lyrics: server-rendered stanzas, stanza badge, toolbar, no empty state', async ({ request, page }) => {
    const res = await request.get(`track/${WITH_LYRICS}`);
    expect(res.status()).toBe(200);
    const html = await res.text();

    // rendered on the server, before any JS runs
    expect(html).toContain('class="lyric-stanza"');
    expect(html).toContain('id="lyricsBody"');
    expect(html).not.toContain('class="lyrics-empty"');
    expect(html).toContain('id="tgTranslit"');
    expect(html).toContain('id="tgMeaning"');
    expect(html).toContain('class="stanza-count"');

    const stanzas = (html.match(/class="lyric-stanza"/g) || []).length;
    expect(stanzas).toBeGreaterThanOrEqual(3);
    expect(stanzas).toBeLessThanOrEqual(40);
    expect(html, 'stanza badge must show the count').toMatch(
      new RegExp(`class="stanza-count">\\s*${stanzas}\\s+`)
    );

    await page.goto(`track/${WITH_LYRICS}`);
    await expect(page.locator('#trackDetail .track-h1')).toBeVisible();
    await expect(page.locator('#lyricsBody .lyric-stanza')).toHaveCount(stanzas);
    await expect(page.locator('#lyricsBody .lyric-line').first()).toBeVisible();
    // transliteration and meaning start hidden
    await expect(page.locator('#lyricsBody .lyric-translit').first()).toBeHidden();
    await expect(page.locator('#lyricsBody .lyric-meaning').first()).toBeHidden();
  });

  test('track without lyrics shows the empty state and no reading toolbar', async ({ request }) => {
    const res = await request.get(`track/${WITHOUT_LYRICS}`);
    expect(res.status()).toBe(200);
    const html = await res.text();

    expect(html).toContain('class="lyrics-empty"');
    expect(html).not.toContain('class="lyric-stanza"');
    expect(html).not.toContain('id="tgTranslit"');
    expect(html).not.toContain('id="tgMeaning"');
    expect(html).not.toContain('class="stanza-count"');
  });

  test('transliteration toggle shows the romanisation and survives a reload', async ({ page }) => {
    await page.goto(`track/${WITH_LYRICS}`);
    const body = page.locator('#lyricsBody');
    const toggle = page.locator('#tgTranslit');

    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(body).toHaveClass(/show-translit/);
    await expect(page.locator('#lyricsBody .lyric-translit').first()).toBeVisible();

    await page.reload();
    await expect(page.locator('#tgTranslit')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lyricsBody')).toHaveClass(/show-translit/);
    await expect(page.locator('#lyricsBody .lyric-translit').first()).toBeVisible();

    await page.locator('#tgTranslit').click();
    await expect(page.locator('#lyricsBody .lyric-translit').first()).toBeHidden();
  });

  test('meaning toggle shows the gloss and survives a reload', async ({ page }) => {
    await page.goto(`track/${WITH_LYRICS}`);
    await page.locator('#tgMeaning').click();
    await expect(page.locator('#tgMeaning')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#lyricsBody')).toHaveClass(/show-meaning/);
    await expect(page.locator('#lyricsBody .lyric-meaning').first()).toBeVisible();

    await page.reload();
    await expect(page.locator('#lyricsBody .lyric-meaning').first()).toBeVisible();

    await page.locator('#tgMeaning').click();
    await expect(page.locator('#lyricsBody .lyric-meaning').first()).toBeHidden();
  });

  test('font size buttons step the type scale and persist', async ({ page }) => {
    await page.goto(`track/${WITH_LYRICS}`);
    const body = page.locator('#lyricsBody');
    const size = () => body.evaluate((el) => el.style.getPropertyValue('--lyric-size').trim());

    expect(await size()).toBe('1.1rem');

    await page.locator('#fontInc').click();
    expect(await size()).toBe('1.3rem');
    await page.locator('#fontDec').click();
    expect(await size()).toBe('1.1rem');

    await page.reload();
    expect(await size()).toBe('1.1rem');
  });

  test('grid cards link only to tracks that have lyrics, and the link navigates', async ({ request, page }) => {
    const data = await (await request.get('api/?action=suggest')).json();
    const expected = data.tracks.filter((t) => t.lyrics > 0);
    expect(expected.length).toBeGreaterThanOrEqual(1);

    await page.goto('./');
    await expect(page.locator('#trackGrid .track-card').first()).toBeVisible({ timeout: 30000 });
    // the default slot chip only shows the current muhurta - show every track
    await page.locator('[data-slot="all"]').click();
    await expect(page.locator('#trackGrid .track-card')).toHaveCount(data.tracks.length);

    const links = await page.locator('#trackGrid .card-lyrics').evaluateAll((els) =>
      els.map((a) => a.getAttribute('href'))
    );
    expect(links.length, 'exactly the tracks that carry lyrics get a badge').toBe(expected.length);
    for (const href of links) {
      expect(href, 'lyrics links must be absolute paths from the mount point').toMatch(/^\/bhakti-sagar\/track\//);
    }
    expect(links).not.toContain(`/bhakti-sagar/track/${WITHOUT_LYRICS}`);

    const target = page.locator(`#trackGrid .card-lyrics[href="/bhakti-sagar/track/${WITH_LYRICS}"]`);
    await target.scrollIntoViewIfNeeded();
    await target.click();
    await expect(page).toHaveURL(`${BASE}/track/${WITH_LYRICS}`);
    await expect(page.locator('#lyricsBody .lyric-stanza').first()).toBeVisible();
  });

  test('API stanza count matches the number rendered on the page', async ({ request, page }) => {
    const data = await (await request.get('api/?action=suggest')).json();
    expect(Array.isArray(data.tracks)).toBe(true);

    const withLyrics = data.tracks.filter((t) => t.lyrics > 0);
    expect(withLyrics.length).toBeGreaterThanOrEqual(1);
    expect(withLyrics.every((t) => Number.isInteger(t.lyrics))).toBe(true);

    const api = withLyrics.find((t) => t.slug === WITH_LYRICS);
    expect(api, `${WITH_LYRICS} must carry a stanza count`).toBeTruthy();

    await page.goto(`track/${WITH_LYRICS}`);
    await expect(page.locator('#lyricsBody .lyric-stanza')).toHaveCount(api.lyrics);
  });

  test('track page plays from the button and highlights the focused card', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto(`track/${WITH_LYRICS}`);
    await expect(page.locator('#trackPlayBtn')).toBeVisible();
    await expect(page.locator('#trackPlayBtn')).not.toHaveClass(/is-playing/);

    await page.locator('#trackPlayBtn').click();
    await expect(page.locator('#trackPlayBtn')).toHaveClass(/is-playing/, { timeout: 60000 });
    await expect(page.locator('#trackGrid .track-card.is-playing')).toHaveCount(1);
    await expect(page.locator('#trackGrid .track-card.is-focused')).toHaveCount(1);
    await expect(page.locator('#nowTitle')).not.toContainText('प्लेयर तैयार', { timeout: 60000 });

    await page.locator('#trackPlayBtn').click();
    await expect(page.locator('#trackPlayBtn')).not.toHaveClass(/is-playing/, { timeout: 15000 });
    await expect(page.locator('#trackGrid .track-card.is-playing')).toHaveCount(0);
  });

  test('lyrics render in /en and /sa with the translated reading controls', async ({ request }) => {
    const en = await (await request.get(`en/track/${WITH_LYRICS}`)).text();
    const sa = await (await request.get(`sa/track/${WITH_LYRICS}`)).text();

    for (const [lang, html] of [['en', en], ['sa', sa]]) {
      expect(html, lang).toContain('<html lang="' + lang + '">');
      expect(html, lang).toContain('id="lyricsBody"');
      expect(html, lang).toContain('class="lyric-stanza"');
      const route = JSON.parse(meta(html, /window\.__ROUTE__ = (\{.*?\});/));
      expect(route, lang).toMatchObject({ kind: 'track', lang, track: WITH_LYRICS });
    }

    expect(en).toContain('>Roman script<');
    expect(sa).toContain('>रोमनलिपिः<');
  });
});
