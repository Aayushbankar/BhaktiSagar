const { test, expect } = require('@playwright/test');

test.describe('API', () => {
  test('health: ok + mysql', async ({ request }) => {
    const res = await request.get('api/?action=health');
    expect(res.ok()).toBeTruthy();
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.db).toBe(true);
    expect(j.source).toBe('mysql');
    expect(j.php).toBeTruthy();
  });

  const cases = [
    { date: '2026-10-06', must: ['एकादशी – विष्णु व्रत', 'मंगलवार – हनुमान जी'], mustNot: [] },
    { date: '2026-10-11', must: ['शारदीय नवरात्रि – देवी आराधना'], mustNot: [] },
    { date: '2026-08-17', must: ['सावन सोमवार – शिव आराधना', 'नाग पंचमी'], mustNot: [] },
    { date: '2026-10-29', must: ['चतुर्थी व्रत – करवा चौथ / सकट चौथ'], mustNot: [] },
    { date: '2026-11-08', must: ['दिवाली – लक्ष्मी पूजा'], mustNot: ['महाशिवरात्रि'] },
    { date: '2026-11-24', must: [], mustNot: ['दिवाली – लक्ष्मी पूजा'] },
    { date: '2026-02-15', must: ['महाशिवरात्रि'], mustNot: [] },
    { date: '2026-11-15', must: ['छठ पूजा – सूर्य षष्ठी'], mustNot: [] },
  ];

  for (const c of cases) {
    test(`suggest ${c.date}: correct day badges`, async ({ request }) => {
      const res = await request.get(`api/?action=suggest&date=${c.date}`);
      expect(res.ok()).toBeTruthy();
      const j = await res.json();
      const badges = (j.day_matches || []).map((m) => m.badge_hi);
      for (const b of c.must) expect(badges).toContain(b);
      for (const b of c.mustNot) expect(badges).not.toContain(b);
      expect((j.day_matches || []).length).toBeGreaterThan(0);
      for (const m of j.day_matches) {
        expect((m.tracks || []).length, `rule "${m.badge_hi}" must have tracks`).toBeGreaterThan(0);
      }
      expect(j.panchang).toBeTruthy();
      expect(j.panchang.festivals).toBeTruthy();
      expect(j.current_slot).toBeTruthy();
      expect((j.tracks || []).length).toBeGreaterThan(0);
    });
  }

  test('suggest with invalid date falls back gracefully', async ({ request }) => {
    const res = await request.get('api/?action=suggest&date=2026-99-99');
    expect(res.ok()).toBeTruthy();
    const j = await res.json();
    expect(j.panchang).toBeTruthy();
  });

  test('every catalogue track has valid slot names + youtube id', async ({ request }) => {
    const res = await request.get('api/?action=suggest');
    const j = await res.json();
    const validSlots = new Set(['brahma', 'pratah', 'divas', 'sandhya', 'aarti', 'ratri']);
    expect(j.tracks.length).toBe(59);
    for (const t of j.tracks) {
      expect(t.youtube_id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(t.type).toMatch(/^(shloka|bhajan|aarti)$/);
      const slotList = Array.isArray(t.slots) ? t.slots : String(t.slots).split(',');
      expect(slotList.length).toBeGreaterThan(0);
      for (const s of slotList) expect(validSlots.has(String(s).trim())).toBe(true);
    }
  });

  const dayWiring = [
    { date: '2026-10-18', day: 'Sunday', must: ['aditya-hridayam-stotram', 'purusha-suktam'] },
    { date: '2026-10-19', day: 'Monday', must: ['shiva-panchakshari-stotram', 'om-namah-shivaya-dhun', 'namo-namo-namoh-namoh', 'jai-jai-shiv-shankar'] },
    { date: '2026-10-21', day: 'Wednesday', must: ['vakratunda-mahakaya', 'sankat-nashan-ganesh-stotram', 'saraswati-aarti-om-jai-saraswati'] },
    { date: '2026-10-22', day: 'Thursday', must: ['kanakadhara-stotram', 'vishnu-sahasranamam', 'ashtalakshmi-stotram'] },
    { date: '2026-10-23', day: 'Friday', must: ['kanakadhara-stotram', 'ashtalakshmi-stotram', 'ambe-tu-hai-jagdambe-aarti'] },
    { date: '2026-10-24', day: 'Saturday', must: ['shani-aarti-jai-jai-shani-dev'] },
  ];

  for (const c of dayWiring) {
    test(`day wiring: ${c.day} suggests the new catalogue entries`, async ({ request }) => {
      const res = await request.get(`api/?action=suggest&date=${c.date}`);
      expect(res.ok()).toBeTruthy();
      const j = await res.json();
      const matches = j.day_matches || [];
      expect(matches.some((m) => m.type === 'var'), `${c.day} must carry a weekday rule`).toBe(true);
      const suggested = new Set(matches.flatMap((m) => m.tracks || []));
      for (const slug of c.must) {
        expect(suggested.has(slug), `${slug} must be suggested on ${c.day}`).toBe(true);
      }
      const known = new Set((j.tracks || []).map((t) => t.slug));
      for (const slug of suggested) {
        expect(known.has(slug), `day rule points at unknown slug ${slug}`).toBe(true);
      }
    });
  }

  test('no shloka is assigned the aarti muhurta', async ({ request }) => {
    const res = await request.get('api/?action=suggest');
    const j = await res.json();
    for (const t of j.tracks) {
      if (t.type !== 'shloka') continue;
      const slots = Array.isArray(t.slots) ? t.slots : String(t.slots).split(',');
      expect(slots, `${t.slug} is a shloka but carries the aarti slot`).not.toContain('aarti');
    }
  });

  test('jyotirlingas: all twelve in order, live ids well formed', async ({ request }) => {
    const res = await request.get('api/?action=suggest');
    expect(res.ok()).toBeTruthy();
    const j = await res.json();
    const jyo = j.jyotirlingas || [];

    expect(jyo.length).toBe(12);
    expect(jyo.map((x) => x.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(new Set(jyo.map((x) => x.slug)).size).toBe(12);

    const live = jyo.filter((x) => x.youtube_id);
    expect(live.length, 'at least one darshan must be live').toBeGreaterThanOrEqual(1);

    const ids = new Set();
    for (const x of jyo) {
      expect(x.name_hi, `${x.slug} name_hi`).toBeTruthy();
      expect(x.name_en, `${x.slug} name_en`).toBeTruthy();
      expect(x.place_hi, `${x.slug} place_hi`).toBeTruthy();
      expect(x.place_en, `${x.slug} place_en`).toBeTruthy();
      if (!x.youtube_id) {
        expect(x.youtube_id).toBeNull();
        continue;
      }
      expect(x.youtube_id, `${x.slug} youtube_id`).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(ids.has(x.youtube_id), `duplicate live id ${x.youtube_id}`).toBe(false);
      ids.add(x.youtube_id);
      expect(x.verified_on, `${x.slug} has a live id but no verified_on`)
        .toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(x.channel, `${x.slug} channel`).toBeTruthy();
    }
  });
});
