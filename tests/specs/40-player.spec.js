const { test, expect } = require('@playwright/test');

const ORANGE = 'rgb(232, 135, 30)';
const INITIAL = 'प्लेयर तैयार है';

async function playFirstCard(page) {
  await page.goto('./');
  await expect(page.locator('#trackGrid [data-play]').first()).toBeVisible({ timeout: 30000 });
  await page.locator('#trackGrid [data-play]').first().click();
  await expect(page.locator('#nowTitle')).not.toHaveText(INITIAL, { timeout: 60000 });
}

test.describe('Player, queue & playback states', () => {
  test('card play → orange pause button, queue, mini-bar, icons', async ({ page }) => {
    await playFirstCard(page);
    const firstTitle = (await page.locator('#trackGrid .track-title').first().textContent()).trim();
    await expect(page.locator('#nowTitle')).toHaveText(firstTitle);

    const playing = page.locator('#trackGrid .track-card.is-playing');
    await expect(playing).toHaveCount(1);
    const fab = playing.locator('.play-fab');
    await expect(fab).toHaveCSS('background-color', ORANGE);
    await expect(fab).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(fab.locator('path')).toHaveAttribute('d', /^M6 5h4/);
    await expect(fab).toHaveAttribute('aria-label', /^रोकें/);
    await expect(playing).toHaveCSS('border-top-color', ORANGE);

    await expect(page.locator('#iconPlay')).toBeHidden();
    await expect(page.locator('#iconPause')).toBeVisible();
    await expect(page.locator('#queueList .queue-item.active')).toHaveCount(1);
    expect(parseInt(await page.locator('#queueCount').textContent(), 10)).toBeGreaterThan(1);
    await expect(page.locator('#btnOpenYt')).toHaveAttribute('href', /youtube\.com/);
  });

  test('next button + queue jump navigate tracks, highlight follows', async ({ page }) => {
    await playFirstCard(page);
    const t1 = (await page.locator('#nowTitle').textContent()).trim();

    await page.locator('#btnNext').click();
    await expect(page.locator('#nowTitle')).not.toHaveText(t1, { timeout: 30000 });
    const t2 = (await page.locator('#nowTitle').textContent()).trim();
    expect(t2).not.toBe(t1);
    await expect(page.locator('#trackGrid .track-card.is-playing')).toHaveCount(1);

    await page.locator('#btnPrev').click();
    await expect(page.locator('#nowTitle')).toHaveText(t1, { timeout: 30000 });

    const qCount = await page.locator('#queueList [data-q]').count();
    expect(qCount).toBeGreaterThan(2);
    await page.locator('#queueList [data-q="1"]').click();
    await expect(page.locator('#nowTitle')).toHaveText(t2, { timeout: 30000 });
    await expect(page.locator('#queueList .queue-item.active')).toHaveCount(1);
    await expect(page.locator('#queueList .queue-item.active')).toHaveAttribute('data-q', '1');
  });

  test('special (आज विशेष) card plays & shows orange pause state', async ({ page }) => {
    await page.goto('./?date=2026-11-08');
    await expect(page.locator('#specialGrid [data-splay]').first()).toBeVisible({ timeout: 30000 });
    const title = (await page.locator('#specialGrid .track-title').first().textContent()).trim();
    await page.locator('#specialGrid [data-splay]').first().click();
    await expect(page.locator('#nowTitle')).toHaveText(title, { timeout: 60000 });
    const playing = page.locator('#specialGrid .track-card.is-playing');
    await expect(playing).toHaveCount(1);
    await expect(playing.locator('.play-fab')).toHaveCSS('background-color', ORANGE);
    await expect(playing.locator('.play-fab path')).toHaveAttribute('d', /^M6 5h4/);
    await expect(page.locator('#queueList .queue-item.active')).toHaveCount(1);
  });

  test('filter change while playing keeps highlight on active card', async ({ page }) => {
    await playFirstCard(page);
    const t1 = (await page.locator('#nowTitle').textContent()).trim();
    await page.locator('[data-slot="all"]').click();
    const playing = page.locator('#trackGrid .track-card.is-playing');
    await expect(playing).toHaveCount(1);
    await expect(playing.locator('.track-title')).toHaveText(t1);
    await expect(playing.locator('.play-fab')).toHaveCSS('background-color', ORANGE);
  });

  test('mini-bar (mobile viewport) appears while playing and icons toggle', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await playFirstCard(page);
    const title = (await page.locator('#nowTitle').textContent()).trim();
    await expect(page.locator('#miniBar')).toBeVisible();
    await expect(page.locator('#miniIconPlay')).toBeHidden();
    await expect(page.locator('#miniIconPause')).toBeVisible();
    await expect(page.locator('#miniTitle')).toHaveText(title);
    await page.locator('#btnToggle').click();
    await expect(page.locator('#miniIconPlay')).toBeVisible();
    await expect(page.locator('#miniIconPause')).toBeHidden();
  });

  test('main button below player: play → pause → resume icon cycle', async ({ page }) => {
    await playFirstCard(page);

    await expect(page.locator('#iconPlay')).toBeHidden();
    await expect(page.locator('#iconPause')).toBeVisible();
    await expect(page.locator('#trackGrid .track-card.is-playing')).toHaveCount(1);

    await page.locator('#btnToggle').click();
    await expect(page.locator('#iconPlay')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#iconPause')).toBeHidden();
    await expect(page.locator('#trackGrid .track-card.is-playing')).toHaveCount(0);
    await expect(page.locator('#trackGrid .play-fab').first()).toHaveAttribute('aria-label', /^चलाएँ/);

    await page.locator('#btnToggle').click();
    await expect(page.locator('#iconPause')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#iconPlay')).toBeHidden();
    await expect(page.locator('#trackGrid .track-card.is-playing')).toHaveCount(1);
    await expect(page.locator('#trackGrid .track-card.is-playing .play-fab')).toHaveCSS('background-color', ORANGE);
  });

  test('auto-advance: next track starts when current ENDS', async ({ page }) => {
    test.setTimeout(150000);
    await playFirstCard(page);
    const title1 = (await page.locator('#nowTitle').textContent()).trim();
    await page.waitForTimeout(6000);

    const res = await page.evaluate(async () => {
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
      const now = () => norm((document.getElementById('nowTitle') || {}).textContent);
      let i;
      const frame = document.querySelector('iframe[src*="youtube.com/embed"]');
      if (!frame) { return { step: 'no-iframe', ok: false }; }
      const msgs = [];
      window.addEventListener('message', (e) => {
        if (String(e.origin).indexOf('youtube') < 0) { return; }
        const d = e.data;
        msgs.push(typeof d === 'string' ? d : JSON.stringify(d));
      });
      let duration = 0;
      for (i = 0; i < 100 && !duration; i++) {
        await sleep(300);
        for (const m of msgs) {
          const dm = m.match(/"duration":([\d.]+)/);
          if (dm) { duration = parseFloat(dm[1]); break; }
        }
      }
      if (!duration) { return { step: 'no-duration', ok: false }; }
      const target = Math.max(1, duration - 1);
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true] }), '*');
      const title1 = now();
      for (i = 0; i < 80; i++) {
        await sleep(500);
        const t = now();
        if (t && t !== title1) { return { ok: true, duration, title1, title2: t }; }
      }
      return { ok: false, duration, title1, title2: now() };
    });

    expect(res.step, `player setup: ${JSON.stringify(res)}`).toBeUndefined();
    expect(res.ok, `auto-advance failed: ${JSON.stringify(res)}`).toBe(true);
    expect(res.title2).not.toBe(title1);
    await expect(page.locator('#nowTitle')).not.toHaveText(title1);
    await expect(page.locator('#iconPlay')).toBeHidden();
    await expect(page.locator('#queueList .queue-item.active')).toHaveCount(1);
  });
});
