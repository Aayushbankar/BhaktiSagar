# भक्ति सागर | Bhakti Sagar

A mobile-first devotional web app that shows the **current date & time** (Indian Standard Time,
Hindi + Saka/Shak calendar dates) and suggests **Hindu shlokas, bhajans and aartis** according to
**panchang rules — वार (weekday), तिथि (lunar date), नक्षत्र and festivals** — as well as the time
of the day, with an embedded **YouTube player** and a play queue.

- No login, no signup, no fees — open and play.
- Works perfectly on mobile and desktop.
- **Live darshan of the Jyotirlingas**: the home page carries a section with the temples'
  official **YouTube live streams** (currently 6 of the 12 — Somnath, Mahakaleshwar,
  Omkareshwar, Trimbakeshwar, Baidyanath, Kashi Vishwanath); the other six appear as soon as a live
  stream id is added to `data/jyotirlingas.php`. Live streams **start playing muted** (autoplay-safe,
  no surprise audio) — one tap on the sound button unmutes them.
- **Quick links**: a sticky pill nav under the header (and the same links in the footer, plus the
  language switcher) jumps to Live darshan, आज विशेष, पंचांग, the song catalogue and the player.
- Panchang data (vara/tithi/nakshatra + 200+ festivals) is **generated once and stored permanently**
  in `data/panchang.json` **and** the MySQL `panchang_days` table.
- Links are stored in **MySQL**, served by a small **PHP** JSON API.
- If MySQL is offline, the API automatically falls back to the bundled catalogue, so the site never breaks.

All **59 YouTube videos** in the catalogue were verified twice before being stored: once against
YouTube's **oEmbed API** (title + channel), and once by **actually playing them in the embedded
player** (headless Edge + YouTube IFrame API — only videos that reach the PLAYING state are kept).
A full sweep on 2026-10-19 ended at **59/59 playable**: 7 of the 18 videos added that day and one
pre-existing id (`hanuman-chalisa`) had started returning YouTube error `150` (owner restricted
embedding), so they were replaced with playback-verified alternates (`tools/verify-player.mjs`).

> `.htaccess` deliberately allows one file — `tools/player-check.html` — because that harness must
> load from the *same origin* the app runs on: YouTube honours domain-restricted embedding, and
> results from a different host (e.g. `127.0.0.1`) are not representative. Every other path under
> `tools/`, `data/`, `lib/`, `tests/`, `db/`, `docs/` and `vendor/` is still forbidden.

---

## Tech stack (100% free & open source)

| Layer     | Technology |
|-----------|------------|
| Frontend  | HTML5, CSS3, vanilla JavaScript (no build step, no framework) |
| Player    | YouTube IFrame Player API |
| Backend   | PHP 8 (works with PHP 7.4+) |
| Database  | MySQL / MariaDB (XAMPP ships MariaDB) |
| Fonts     | Google Fonts (Mukta + Tiro Devanagari Hindi) – optional, site works without them |

## Folder structure

```
bhakti-sagar/
├── index.php              # main page (responsive UI)
├── config.php             # DB credentials / environment overrides
├── api/
│   └── index.php          # JSON API: suggest + health  (MySQL with fallback)
├── data/
│   ├── catalog.php        # single source of truth: 59 tracks, slots, 17 daily shlokas
│   ├── day_rules.php      # वार / तिथि / त्योहार → track rules (49 rules)
│   ├── jyotirlingas.php   # the 12 Jyotirlingas + their YouTube LIVE darshan ids
│   └── panchang.json      # generated permanent dataset: 2026-01-01 → 2028-12-31
├── db/
│   ├── schema.sql         # database + tables (tracks, daily_shlokas, panchang_days, day_rules)
│   └── seed.php           # loads catalog + panchang.json + day_rules into MySQL (upsert + prune)
├── tools/
│   ├── generate-panchang.mjs  # regenerates data/panchang.json
│   ├── search-youtube.mjs     # search YouTube for candidate videos (id/title/channel)
│   ├── oembed-check.mjs       # verify ids exist + title/channel via oEmbed
│   ├── verify-player.mjs      # verify videos actually PLAY in an embedded player (headless Edge)
│   ├── live-check.mjs         # is a stream LIVE / scheduled / not live right now?
│   ├── player-check.html      # local harness page used by verify-player.mjs
│   ├── ui-check.mjs           # headless UI assertions (renders/auto-advance checks)
│   └── package.json           # depends on @ishubhamx/panchangam-js (MIT)
└── assets/
    ├── css/style.css      # mobile-first styling
    └── js/app.js          # clock, filters, panchang UI, suggestions, YouTube player, queue
```

## Quick start (XAMPP on Windows)

1. Copy the `bhakti-sagar` folder into `C:\xampp\htdocs\`.
2. Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
3. Seed the database (any one of these):
   - CLI: `C:\xampp\php\php.exe C:\xampp\htdocs\bhakti-sagar\db\seed.php`
   - Browser: `http://localhost/bhakti-sagar/db/seed.php` (localhost only)
4. Open the site: **http://localhost/bhakti-sagar/**

### No XAMPP? Use PHP's built-in server

```bash
cd bhakti-sagar
php -S 127.0.0.1:8080        # then browse http://127.0.0.1:8080/
php db/seed.php               # seed MySQL (needs MySQL/MariaDB running)
```

## Configuration

Defaults match XAMPP (`root` / empty password / port `3306`). Override with environment variables:

```
BHAKTI_DB_HOST   (default 127.0.0.1)
BHAKTI_DB_PORT   (default 3306)
BHAKTI_DB_NAME   (default bhakti_sagar)
BHAKTI_DB_USER   (default root)
BHAKTI_DB_PASS   (default empty)
```

## API

| Endpoint | Description |
|----------|-------------|
| `api/?action=suggest` | Full payload: time slots, tracks, current slot (computed in IST), shloka of the day, `panchang` and `day_matches` |
| `api/?action=suggest&date=2026-11-08` | Same, but pins the panchang day (preview/testing) |
| `api/?action=health`  | `{ ok, db, source }` – `source` is `mysql` or `fallback` |

Example:

```bash
curl "http://localhost/bhakti-sagar/api/?action=suggest"
```

## How suggestions work

The day is split into six traditional time windows; the API/UI pick the window from the
current IST time and show tracks tagged for it (you can also switch windows or choose
"सभी समय"):

| Key | Window | Hindi label |
|-----|--------|-------------|
| `brahma` | 04:00 – 06:00 | ब्रह्म मुहूर्त |
| `pratah` | 06:00 – 11:00 | प्रातः काल |
| `divas` | 11:00 – 16:00 | दिवस |
| `sandhya` | 16:00 – 19:00 | संध्या समय |
| `aarti` | 19:00 – 21:00 | संध्या आरती |
| `ratri` | 21:00 – 04:00 | रात्रि |

Each track also has a `type`: `shloka`, `bhajan` or `aarti`, plus a rotating
**आज का श्लोक** (daily shloka with meaning).

## Panchang-based suggestions (आज विशेष)

On top of the time windows, the API matches three kinds of **day rules**
(`data/day_rules.php`, stored in the MySQL `day_rules` table, priority high → low):

| Type | Matches on | Priority | Example |
|------|-----------|----------|---------|
| `festival` | today's festival slug (substring) | 3 | `diwali` → लक्ष्मी/गणेश आरतियाँ |
| `tithi` | today's udaya tithi number group | 2 | `ekadashi` = 11 & 26 → कृष्ण/विष्णु भजन |
| `var` | weekday | 1 | `mon` → शिव आराधना |

The UI shows:

- a **पंचांग strip** (वार · तिथि · नक्षत्र · सूर्योदय · सूर्यास्त) with festival chips ("आज के पर्व");
- an **आज विशेष** section listing the matched rules with the reason ("नियम") and the deduplicated
  tracks in priority order, playable with one tap;
- an `आज विशेष` tag on those tracks inside the normal grid.

### Where the panchang data comes from

`data/panchang.json` (2026-01-01 → 2028-12-31, 1096 days) is generated once with the open-source
**[@ishubhamx/panchangam-js](https://github.com/ishubhamx/Hindu-Panchangam-Legal)** engine (MIT,
pure JavaScript, Drik Ganita calculations) and stores, per day: weekday, tithi (1–30) + paksha,
nakshatra, sunrise/sunset (IST) and 200+ festival slugs with Hindi names. `db/seed.php` imports it
into the `panchang_days` table; if MySQL is down the API reads the same JSON file, so the feature
works in both modes.

Regenerate or extend the range (Node.js required):

```bash
cd tools
npm install
node generate-panchang.mjs 2026-01-01 2029-12-31     # writes ../data/panchang.json
cd .. && php db/seed.php                             # re-import into MySQL
```

The location used for sunrise/sunset is New Delhi by default — change `LOCATION` in
`tools/generate-panchang.mjs` and regenerate for another city.

## Adding / editing tracks

1. Open `data/catalog.php` and add an entry to `$tracks`:

```php
[
    'slug' => 'unique-slug',
    'title_hi' => 'गीत का नाम',
    'title_en' => 'Track name',
    'type' => 'bhajan',                 // shloka | bhajan | aarti
    'deity' => 'श्री कृष्ण',
    'singer' => 'गायक का नाम',
    'youtube_id' => 'dQw4w9WgXcQ',       // 11-char id from the watch URL
    'slots' => 'pratah,divas,ratri',     // any of the 6 slot keys
    'tags' => 'krishna,bhajan',
    'blurb' => 'छोटा विवरण।',
    'sort_order' => 200,
],
```

2. Verify the video before storing it:

```bash
cd tools
node oembed-check.mjs dQw4w9WgXcQ                       # exists? title/channel match?
node verify-player.mjs dQw4w9WgXcQ                      # actually plays in the embed player?
cd .. && php db/seed.php                                # sync into MySQL
```

`verify-player.mjs` opens the local `player-check.html` harness in headless Edge and waits for the
YouTube IFrame API to report the PLAYING state — a video only belongs in the catalogue if it plays.

You can also insert rows directly into the `bhakti_sagar.tracks` table.

## Adding / editing day rules

Open `data/day_rules.php` and append an entry to `$rules`:

```php
[
    'type' => 'tithi',          // var | tithi | festival
    'match' => 'pradosh',       // var key (mon..sun) | tithi group | festival slug substring
    'priority' => 2,            // festival=3, tithi=2, var=1
    'badge_hi' => 'प्रदोष काल – शिव पूजा',
    'note_hi' => 'कारण (दिखाया जाएगा)।',
    'tracks' => ['om-jai-shiv-omkara', 'shiv-amritwani'],
],
```

Tithi groups (`ekadashi`, `pradosh`, `purnima`, …) are defined in the same file under
`tithi_groups`. Re-run `php db/seed.php` to sync the rules into MySQL.

## Adding a Jyotirlinga live darshan

`data/jyotirlingas.php` lists all twelve Jyotirlingas in traditional order. Entries with a
`youtube_id` render on the home page as a live-darshan card; entries with `youtube_id => null`
are still returned by the API but stay hidden until a stream is found.

Only **live** streams belong here — recorded darshan videos are not acceptable. Verify before
storing:

```bash
node tools/live-check.mjs WY5LoCD2vPg          # LIVE / SCHEDULED / NOT_LIVE right now
node tools/verify-player.mjs WY5LoCD2vPg       # reaches PLAYING from the app origin
```

Then fill `youtube_id`, `channel` and `verified_on`. The API reads the file directly, so no
`php db/seed.php` is needed.

## Testing (Playwright)

```bash
cd tests
npm install
npx playwright test          # runs the full suite against http://localhost/bhakti-sagar/
```

- 84 tests in `tests/specs/`: API (health, date-pinned day rules, catalogue integrity,
  weekday → track wiring, shloka/slot invariants, Jyotirlinga live ids), home UI (filters,
  chip counts for every slot × type, search, empty-state, cache-busting, quick links/footer
  links), date deep-links/आज विशेष, ज्योतिर्लिंग live darshan (cards, queue hand-off, muted
  autoplay + sound toggle, /en), the player
  (orange pause state, play→pause→resume icon cycle, queue/next/prev, special cards, mobile
  mini-bar, auto-advance), location-aware panchang, routing/SEO + robots/sitemap, i18n
  (hi/en/sa), lyrics/track pages, and a QA audit (console/network errors, link integrity,
  accessibility, content coverage, performance budget). See `docs/qa-report-2026-10-19.md`.
- Report is saved automatically:
  - HTML: `tests/playwright-report/index.html` (open in a browser)
  - JSON: `tests/playwright-report/results.json`
- Uses the installed system Edge (`channel: 'msedge'`) – no browser download needed.

## Domain-expert verification report (printable PDF)

```bash
php tools/generate-report.php        # → docs/bhakti-sagar-domain-verification.html
# then print to PDF (headless Edge), or simply open the HTML and Ctrl+P
```

`docs/bhakti-sagar-domain-verification.pdf` (A4, ~19 pages, Devanagari font embedded) lists,
with a tick-box per row: daily shlokas, all tracks by type (श्लोक/भजन/आरती), day-wise rules
(वार / तिथि-व्रत / त्योहार with real 2026–27 dates) and the time-slot groups.

## Notes

- The play queue **auto-advances**: when a video ends, the next track starts automatically; if a
  video errors (removed/blocked), the player skips to the next one instead of stopping.
- Videos are embedded from their official channels (T-Series Bhakti Sagar, Shemaroo Bhakti,
  Rajshri Soul, etc.). All content rights belong to their respective owners; this app only
  embeds them via the official YouTube player.
- No user accounts, no tracking, no cookies.
- Works offline-ish: if the API or MySQL is unreachable, the UI shows a retry button and the
  bundled catalogue keeps the site functional.
