<?php
declare(strict_types=1);

/*
 * JSON API for Bhakti Sagar.
 *
 *   GET api/?action=suggest   full payload: slots, tracks, current slot, shloka of the day
 *   GET api/?action=health    database status
 *
 * Reads from MySQL when available, otherwise falls back to data/catalog.php,
 * so the website never breaks even if the database is offline.
 */

$root = dirname(__DIR__);
$config = require $root . '/config.php';
$catalog = require $root . '/data/catalog.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function json_out(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

function db_connect(array $config): ?PDO
{
    try {
        $db = $config['db'];
        $pdo = new PDO(
            sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset']),
            $db['user'],
            $db['pass'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 3,
            ]
        );
        return $pdo;
    } catch (Throwable $e) {
        return null;
    }
}

function slots_from_catalog(array $catalog): array
{
    // keep from/to (minutes) so the browser can pick the current slot offline
    return array_values($catalog['slots']);
}

function slot_at(array $slotsConfig, int $minutes): string
{
    foreach ($slotsConfig as $slot) {
        $from = (int) $slot['from'];
        $to = (int) $slot['to'];
        if ($from <= $to) {
            if ($minutes >= $from && $minutes < $to) {
                return $slot['key'];
            }
        } elseif ($minutes >= $from || $minutes < $to) {
            return $slot['key'];
        }
    }
    return $slotsConfig[0]['key'];
}

function normalize_track(array $row): array
{
    $slots = array_values(array_filter(array_map('trim', explode(',', (string) ($row['slots'] ?? '')))));
    return [
        'slug' => $row['slug'] ?? '',
        'title_hi' => $row['title_hi'] ?? '',
        'title_en' => $row['title_en'] ?? '',
        'title_gu' => $row['title_gu'] ?? '',
        'type' => $row['type'] ?? 'bhajan',
        'deity' => $row['deity'] ?? '',
        'singer' => $row['singer'] ?? '',
        'youtube_id' => $row['youtube_id'] ?? null,
        'slots' => $slots,
        'tags' => $row['tags'] ?? '',
        'blurb' => $row['blurb'] ?? '',
        'sort_order' => (int) ($row['sort_order'] ?? 0),
    ];
}

/**
 * Stanza count for a slug. Always read from data/lyrics.php - the same file
 * the track page renders from - because the MySQL `tracks` table has no lyrics
 * column, so both MySQL and catalogue mode stay in agreement.
 */
function lyrics_data(): array
{
    static $data = null;
    if ($data === null) {
        $path = dirname(__DIR__) . '/data/lyrics.php';
        $data = is_file($path) ? require $path : [];
        if (!is_array($data)) {
            $data = [];
        }
    }
    return $data;
}

function lyrics_count(string $slug): int
{
    $raw = lyrics_data()[$slug] ?? null;
    if (!is_array($raw) || $raw === []) {
        return 0;
    }
    // Single-stanza shorthand: ['hi' => ..., 'translit' => ...] with no list.
    return array_key_exists('hi', $raw) ? 1 : count($raw);
}

function load_tracks(?PDO $pdo, array $catalog): array
{
    $withLyrics = static function (array $rows): array {
        foreach ($rows as &$row) {
            $row['lyrics'] = lyrics_count((string) ($row['slug'] ?? ''));
        }
        unset($row);
        return $rows;
    };

    if ($pdo instanceof PDO) {
        try {
            $rows = $pdo->query('SELECT slug, title_hi, title_en, title_gu, type, deity, singer, youtube_id, slots, tags, blurb, sort_order
                                 FROM tracks WHERE is_active = 1 ORDER BY sort_order, id')->fetchAll();
            if ($rows) {
                return $withLyrics(array_map('normalize_track', $rows));
            }
        } catch (Throwable $e) {
            // fall through to bundled catalogue
        }
    }
    return $withLyrics(array_map('normalize_track', $catalog['tracks']));
}

function load_shlokas(?PDO $pdo, array $catalog): array
{
    if ($pdo instanceof PDO) {
        try {
            $rows = $pdo->query('SELECT `key`, sanskrit, translit, source, meaning_hi
                                 FROM daily_shlokas WHERE is_active = 1 ORDER BY id')->fetchAll();
            if ($rows) {
                return $rows;
            }
        } catch (Throwable $e) {
            // fall through to bundled catalogue
        }
    }
    return $catalog['daily_shlokas'];
}

/* ---------------- locations (city-aware panchang) ---------------- */

/** Registry shared with the UI picker and tools/generate-panchang.mjs. */
function load_locations(string $root): array
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $file = $root . '/data/locations.json';
    $raw = is_file($file) ? file_get_contents($file) : false;
    $data = $raw === false ? null : json_decode($raw, true);
    if (!is_array($data) || !isset($data['locations']) || !is_array($data['locations'])) {
        $data = ['default' => 'new-delhi', 'locations' => []];
    }
    $cache = $data;
    return $cache;
}

/** Minimal, safe shape for the browser (no lat/lng needed by the client). */
function locations_public(array $registry): array
{
    $default = (string) ($registry['default'] ?? '');
    $out = [];
    foreach ($registry['locations'] as $loc) {
        $out[] = [
            'key' => (string) ($loc['key'] ?? ''),
            'name_hi' => (string) ($loc['name_hi'] ?? ''),
            'name_en' => (string) ($loc['name_en'] ?? ''),
            'country_hi' => (string) ($loc['country_hi'] ?? ''),
            'country_en' => (string) ($loc['country_en'] ?? ''),
            'timezone' => (string) ($loc['timezone'] ?? ''),
            'is_default' => (string) ($loc['key'] ?? '') === $default,
        ];
    }
    return $out;
}

/** ?city= key -> registry entry, falling back to the default city. */
function resolve_location(array $registry): array
{
    $wanted = isset($_GET['city']) ? (string) $_GET['city'] : '';
    $default = (string) ($registry['default'] ?? '');
    foreach ($registry['locations'] as $loc) {
        if (($loc['key'] ?? '') === $wanted) {
            return $loc;
        }
    }
    foreach ($registry['locations'] as $loc) {
        if (($loc['key'] ?? '') === $default) {
            return $loc;
        }
    }
    return ['key' => $default, 'name_hi' => 'नई दिल्ली', 'name_en' => 'New Delhi', 'timezone' => 'Asia/Kolkata'];
}

/**
 * Dataset path for a city. The default city keeps the original
 * data/panchang.json (also the source of truth for db/seed.php); every other
 * city lives in data/panchang/<key>.json.
 *
 * Only keys present in locations.json are ever used, so no path traversal.
 */
function panchang_file(string $root, array $loc, array $registry): string
{
    $default = (string) ($registry['default'] ?? '');
    $key = (string) ($loc['key'] ?? '');
    if ($key === $default) {
        return $root . '/data/panchang.json';
    }
    if (!preg_match('/^[a-z0-9\-]{1,40}$/', $key)) {
        return $root . '/data/panchang.json';
    }
    return $root . '/data/panchang/' . $key . '.json';
}

/* ---------------- Jyotirlinga live darshan ---------------- */

require_once __DIR__ . '/../lib/live.php';

/**
 * The twelve Jyotirlingas with their YouTube LIVE darshan streams.
 *
 * Each entry has a `channel_id` (official YouTube channel). The API resolves
 * the *currently* live video ID from that channel on every request.
 * Only streams that are LIVE right now get `available = true` and a `youtube_id`.
 * Entries without a channel_id or with no live stream right now get
 * `available = false` and `youtube_id = null` — the site hides them.
 */
function load_jyotirlingas(string $root): array
{
    $file = require $root . '/data/jyotirlingas.php';
    if (!is_array($file)) {
        return [];
    }
    $out = [];
    foreach ($file as $j) {
        if (!is_array($j)) {
            continue;
        }
        $channelId = isset($j['channel_id']) ? (string) $j['channel_id'] : '';
        $liveId = null;
        $available = false;
        if ($channelId !== '' && preg_match('/^UC[A-Za-z0-9_-]{22}$/', $channelId)) {
            $liveId = resolve_live_id_cached($channelId, 5); // 5-min cache
            $available = $liveId !== null;
        }
        $out[] = [
            'order' => (int) ($j['order'] ?? 0),
            'slug' => (string) ($j['slug'] ?? ''),
            'name_hi' => (string) ($j['name_hi'] ?? ''),
            'name_en' => (string) ($j['name_en'] ?? ''),
            'place_hi' => (string) ($j['place_hi'] ?? ''),
            'place_en' => (string) ($j['place_en'] ?? ''),
            'youtube_id' => $liveId,
            'channel' => (string) ($j['channel'] ?? ''),
            'verified_on' => (string) ($j['verified_on'] ?? ''),
            'available' => $available,
        ];
    }
    return $out;
}

/* ---------------- panchang (वार / तिथि / नक्षत्र / त्योहार) ---------------- */

function load_day_rules(?PDO $pdo, array $dayRules): array
{
    if ($pdo instanceof PDO) {
        try {
            $rows = $pdo->query('SELECT rule_type, match_val, priority, badge_hi, note_hi, track_slugs
                                 FROM day_rules WHERE is_active = 1 ORDER BY priority DESC, id')->fetchAll();
            if ($rows) {
                return $rows;
            }
        } catch (Throwable $e) {
            // fall through to bundled rules
        }
    }
    $out = [];
    foreach ($dayRules['rules'] as $rule) {
        $out[] = [
            'rule_type' => $rule['type'],
            'match_val' => $rule['match'],
            'priority' => $rule['priority'],
            'badge_hi' => $rule['badge_hi'],
            'note_hi' => $rule['note_hi'],
            'track_slugs' => implode(',', $rule['tracks']),
        ];
    }
    return $out;
}

/** Festival slug -> {name, hi, cat} dictionary from the generated dataset. */
function load_festival_dict(string $jsonFile): array
{
    if (!is_file($jsonFile)) {
        return [];
    }
    $raw = file_get_contents($jsonFile);
    if ($raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) && isset($data['festivals']) && is_array($data['festivals'])
        ? $data['festivals']
        : [];
}

function festival_objs(array $slugs, array $dict): array
{
    $out = [];
    foreach ($slugs as $slug) {
        $f = $dict[$slug] ?? null;
        $out[] = [
            'key' => $slug,
            'hi' => $f['hi'] ?? '',
            'name' => $f['name'] ?? '',
            'cat' => $f['cat'] ?? 'major',
        ];
    }
    return $out;
}

function normalize_panchang_row(array $row, array $dict): array
{
    $slugs = array_values(array_filter(array_map('trim', explode(',', (string) ($row['festivals'] ?? '')))));
    return [
        'date' => (string) ($row['d'] ?? $row['date'] ?? ''),
        'var_num' => (int) ($row['var_num'] ?? 0),
        'var_key' => (string) ($row['var_key'] ?? ''),
        'var_hi' => (string) ($row['var_hi'] ?? ''),
        'tithi' => (int) ($row['tithi'] ?? 0),
        'tithi_hi' => (string) ($row['tithi_hi'] ?? ''),
        'paksha' => (string) ($row['paksha'] ?? ''),
        'paksha_hi' => (string) ($row['paksha_hi'] ?? ''),
        'nakshatra' => (int) ($row['nakshatra'] ?? 0),
        'nakshatra_hi' => (string) ($row['nakshatra_hi'] ?? ''),
        'sunrise' => (string) ($row['sunrise'] ?? ''),
        'sunset' => (string) ($row['sunset'] ?? ''),
        'festivals' => festival_objs($slugs, $dict),
        'source' => (string) ($row['source'] ?? ''),
    ];
}

/** Devanagari names for the numeric panchang fields (JSON fallback path). */
function hi_maps(): array
{
    return [
        'vara_key' => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        'vara_hi' => ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
        'tithi_hi' => [
            'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
            'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी',
            'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'अमावस्या',
        ],
        'nakshatra_hi' => [
            'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा',
            'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल',
            'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपदा', 'उत्तराभाद्रपदा', 'रेवती',
        ],
    ];
}

function load_panchang(?PDO $pdo, string $dateKey, string $jsonFile, array $dict): ?array
{
    if ($pdo instanceof PDO) {
        try {
            $stmt = $pdo->prepare('SELECT d, var_num, var_key, var_hi, tithi, tithi_hi, paksha, paksha_hi,
                                          nakshatra, nakshatra_hi, sunrise, sunset, festivals
                                   FROM panchang_days WHERE d = :d');
            $stmt->execute([':d' => $dateKey]);
            $row = $stmt->fetch();
            if ($row) {
                $row['source'] = 'mysql';
                return normalize_panchang_row($row, $dict);
            }
        } catch (Throwable $e) {
            // fall through to bundled dataset
        }
    }
    if (is_file($jsonFile)) {
        $raw = file_get_contents($jsonFile);
        $data = $raw === false ? null : json_decode($raw, true);
        if (is_array($data) && isset($data['days'][$dateKey])) {
            $day = $data['days'][$dateKey];
            $maps = hi_maps();
            $var = (int) $day['var'];
            $tithi = (int) $day['tithi'];
            $nak = (int) $day['nakshatra'];
            return normalize_panchang_row([
                'd' => $dateKey,
                'var_num' => $var,
                'var_key' => $maps['vara_key'][$var],
                'var_hi' => $maps['vara_hi'][$var],
                'tithi' => $tithi,
                'tithi_hi' => $maps['tithi_hi'][$tithi - 1],
                'paksha' => $day['paksha'],
                'paksha_hi' => $day['paksha'] === 'krishna' ? 'कृष्ण पक्ष' : 'शुक्ल पक्ष',
                'nakshatra' => $nak,
                'nakshatra_hi' => $maps['nakshatra_hi'][$nak],
                'sunrise' => $day['sunrise'],
                'sunset' => $day['sunset'],
                'festivals' => implode(',', $day['festivals'] ?? []),
                'source' => 'json',
            ], $dict);
        }
    }
    return null;
}

/**
 * Apply वार / तिथि / त्योहार rules for the current day.
 * Returns matched rules (priority desc) with their track slugs.
 */
function day_matches(array $rules, ?array $panchang, array $tithiGroups, string $weekdayKey): array
{
    $festKeys = [];
    $tithi = null;
    $varKey = $weekdayKey;
    if ($panchang !== null) {
        foreach ($panchang['festivals'] as $f) {
            $festKeys[] = (string) $f['key'];
        }
        $tithi = (int) $panchang['tithi'];
        $varKey = $panchang['var_key'];
    }

    $matches = [];
    foreach ($rules as $rule) {
        $type = (string) $rule['rule_type'];
        $matchVal = (string) $rule['match_val'];
        $hit = false;

        if ($type === 'var') {
            $hit = $matchVal === $varKey;
        } elseif ($type === 'tithi') {
            $group = $tithiGroups[$matchVal] ?? [];
            $hit = $tithi !== null && in_array($tithi, $group, true);
        } elseif ($type === 'festival') {
            foreach ($festKeys as $key) {
                if ($matchVal !== '' && strpos($key, $matchVal) !== false) {
                    $hit = true;
                    break;
                }
            }
        }

        if (!$hit) {
            continue;
        }

        $slugs = array_values(array_filter(array_map('trim', explode(',', (string) $rule['track_slugs']))));
        if (!$slugs) {
            continue;
        }
        $matches[] = [
            'type' => $type,
            'badge_hi' => (string) $rule['badge_hi'],
            'note_hi' => (string) $rule['note_hi'],
            'priority' => (int) $rule['priority'],
            'tracks' => $slugs,
        ];
    }

    usort($matches, static fn (array $a, array $b): int => $b['priority'] <=> $a['priority']);
    return $matches;
}

$action = isset($_GET['action']) ? (string) $_GET['action'] : 'suggest';
$pdo = db_connect($config);
$source = $pdo instanceof PDO ? 'mysql' : 'fallback';

if ($action === 'health') {
    json_out([
        'ok' => true,
        'app' => $config['app_name_en'],
        'db' => $pdo instanceof PDO,
        'source' => $source,
        'php' => PHP_VERSION,
    ]);
}

if ($action !== 'suggest') {
    json_out(['ok' => false, 'error' => 'unknown action'], 400);
}

$tz = new DateTimeZone($config['timezone']);
$now = new DateTimeImmutable('now', $tz);
$minutes = ((int) $now->format('G')) * 60 + (int) $now->format('i');
$currentSlot = slot_at($catalog['slots'], $minutes);
$shlokas = load_shlokas($pdo, $catalog);
$dayIndex = (int) $now->format('z');
$shloka = $shlokas ? $shlokas[$dayIndex % count($shlokas)] : null;
$tracks = load_tracks($pdo, $catalog);

// panchang-based suggestions (वार / तिथि / नक्षत्र / त्योहार)
// optional ?date=YYYY-MM-DD pins the panchang day (used for testing/preview)
$dateKey = $now->format('Y-m-d');
$dateParam = isset($_GET['date']) ? (string) $_GET['date'] : '';
if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $dateParam)) {
    $pinned = DateTimeImmutable::createFromFormat('!Y-m-d', $dateParam);
    if ($pinned !== false && $pinned->format('Y-m-d') === $dateParam) {
        $dateKey = $dateParam;
    }
}
$weekdayOf = DateTimeImmutable::createFromFormat('!Y-m-d', $dateKey);
$weekdayKey = $weekdayOf === false ? strtolower(substr($now->format('D'), 0, 3)) : strtolower(substr($weekdayOf->format('D'), 0, 3));
$dayRules = require $root . '/data/day_rules.php';
$rules = load_day_rules($pdo, $dayRules);

// location-aware panchang: ?city=<key> (default: New Delhi)
$locations = load_locations($root);
$location = resolve_location($locations);
$isDefaultCity = (string) ($location['key'] ?? '') === (string) ($locations['default'] ?? '');
$panchangFile = panchang_file($root, $location, $locations);
// the panchang_days table only holds the default city – never serve another
// city's rows out of MySQL
$panchangPdo = $isDefaultCity ? $pdo : null;
$panchang = load_panchang($panchangPdo, $dateKey, $panchangFile, load_festival_dict($panchangFile));
$matches = day_matches($rules, $panchang, $dayRules['tithi_groups'], $weekdayKey);

json_out([
    'ok' => true,
    'source' => $source,
    'generated_at' => $now->format('c'),
    'now_ist' => [
        'date' => $now->format('Y-m-d'),
        'time' => $now->format('H:i:s'),
        'weekday' => $now->format('l'),
        'day_of_year' => $dayIndex,
    ],
    'current_slot' => $currentSlot,
    'slots' => slots_from_catalog($catalog),
    'shloka' => $shloka,
    'locations' => locations_public($locations),
    'location' => [
        'key' => (string) ($location['key'] ?? ''),
        'name_hi' => (string) ($location['name_hi'] ?? ''),
        'name_en' => (string) ($location['name_en'] ?? ''),
        'country_hi' => (string) ($location['country_hi'] ?? ''),
        'country_en' => (string) ($location['country_en'] ?? ''),
        'timezone' => (string) ($location['timezone'] ?? ''),
    ],
    'panchang' => $panchang,
    'day_matches' => $matches,
    'jyotirlingas' => load_jyotirlingas($root),
    'tracks' => $tracks,
]);
