<?php
declare(strict_types=1);

/*
 * Routing + URL helpers for Bhakti Sagar.
 *
 * The site is a single index.php. .htaccess rewrites every non-file request to
 * it, and this module turns REQUEST_URI into a route:
 *
 *   /                       home (Hindi, the default language)
 *   /en  /sa                home in English / Sanskrit
 *   /track/{slug}           one track
 *   /festival/{slug}        one festival, pinned to its next occurrence
 *   /date/{Y-m-d}           one panchang day
 *   /robots.txt /sitemap.xml
 *
 * Unknown paths render the shell with a 404 status.
 */

const BS_LANGS = ['hi', 'en', 'sa'];
const BS_DEFAULT_LANG = 'hi';

function bs_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require dirname(__DIR__) . '/config.php';
    }
    return $config;
}

/** Directory the app is mounted in ('' at document root, '/bhakti-sagar' under XAMPP). */
function bs_base_path(): string
{
    $script = (string) ($_SERVER['SCRIPT_NAME'] ?? '/');
    $dir = str_replace('\\', '/', dirname($script));
    if ($dir === '/' || $dir === '.' || $dir === '') {
        return '';
    }
    return rtrim($dir, '/');
}

/** Requested path relative to the app root, e.g. '/track/hanuman-chalisa'. */
function bs_request_path(): string
{
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
    $path = parse_url($uri, PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        $path = '/';
    }
    $base = bs_base_path();
    if ($base !== ''
        && strncmp($path, $base, strlen($base)) === 0
        && (strlen($path) === strlen($base) || $path[strlen($base)] === '/')
    ) {
        $path = (string) substr($path, strlen($base));
    }
    $path = '/' . ltrim($path, '/');
    if ($path === '/index.php' || $path === '/index.php/') {
        $path = '/';
    }
    return $path;
}

function bs_catalog(): array
{
    static $catalog = null;
    if ($catalog === null) {
        $catalog = require dirname(__DIR__) . '/data/catalog.php';
    }
    return $catalog;
}

function bs_track(?string $slug): ?array
{
    if ($slug === null || $slug === '') {
        return null;
    }
    foreach (bs_catalog()['tracks'] as $track) {
        if (($track['slug'] ?? '') === $slug) {
            return $track;
        }
    }
    return null;
}

function bs_panchang(): array
{
    static $panchang = null;
    if ($panchang === null) {
        $raw = @file_get_contents(dirname(__DIR__) . '/data/panchang.json');
        $panchang = $raw !== false ? (json_decode($raw, true) ?: []) : [];
        if (!isset($panchang['days']) || !is_array($panchang['days'])) {
            $panchang['days'] = [];
        }
        if (!isset($panchang['festivals']) || !is_array($panchang['festivals'])) {
            $panchang['festivals'] = [];
        }
    }
    return $panchang;
}

/** slug => ['name' => ..., 'hi' => ..., 'cat' => ...] */
function bs_festival_info(?string $slug): ?array
{
    if ($slug === null || $slug === '') {
        return null;
    }
    $info = bs_panchang()['festivals'][$slug] ?? null;
    return is_array($info) ? $info : null;
}

/** slug => sorted list of ISO dates, built once per request. */
function bs_festival_index(): array
{
    static $index = null;
    if ($index === null) {
        $index = [];
        foreach (bs_panchang()['days'] as $date => $day) {
            foreach (($day['festivals'] ?? []) as $slug) {
                if (!isset($index[$slug])) {
                    $index[$slug] = [];
                }
                $index[$slug][] = (string) $date;
            }
        }
        foreach ($index as &$dates) {
            sort($dates);
        }
        unset($dates);
    }
    return $index;
}

function bs_festival_dates(string $slug): array
{
    return bs_festival_index()[$slug] ?? [];
}

function bs_today(): string
{
    date_default_timezone_set((string) (bs_config()['timezone'] ?? 'Asia/Kolkata'));
    return date('Y-m-d');
}

function bs_day(string $date): ?array
{
    $day = bs_panchang()['days'][$date] ?? null;
    return is_array($day) ? $day : null;
}

/**
 * Parse a request path into a route.
 *
 * @return array{kind:string,lang:string,slug:?string,date:?string,path:string,ok:bool}
 */
function bs_parse_route(?string $path = null): array
{
    $path = $path ?? bs_request_path();
    $route = [
        'kind' => 'home',
        'lang' => BS_DEFAULT_LANG,
        'slug' => null,
        'date' => null,
        'path' => $path,
        'ok' => true,
    ];

    $trimmed = trim($path, '/');
    $segs = $trimmed === '' ? [] : explode('/', $trimmed);

    if ($segs !== [] && in_array($segs[0], BS_LANGS, true)) {
        $route['lang'] = (string) array_shift($segs);
    }
    if ($segs === []) {
        return $route;
    }
    if (count($segs) !== 2) {
        $route['ok'] = false;
        return $route;
    }

    [$head, $arg] = [$segs[0], $segs[1]];
    if ($head === 'track' && bs_track($arg) !== null) {
        $route['kind'] = 'track';
        $route['slug'] = $arg;
        return $route;
    }
    if ($head === 'festival' && bs_festival_info($arg) !== null) {
        $route['kind'] = 'festival';
        $route['slug'] = $arg;
        $route['date'] = bs_next_occurrence($arg);
        return $route;
    }
    if ($head === 'date' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $arg) === 1 && bs_day($arg) !== null) {
        $route['kind'] = 'date';
        $route['date'] = $arg;
        return $route;
    }

    $route['ok'] = false;
    return $route;
}

/** First date of a festival that is today or later; its first date otherwise. */
function bs_next_occurrence(string $slug): ?string
{
    $dates = bs_festival_dates($slug);
    if ($dates === []) {
        return null;
    }
    $today = bs_today();
    foreach ($dates as $date) {
        if ($date >= $today) {
            return $date;
        }
    }
    return $dates[0];
}

/** Canonical in-app path for a route ('/' for the Hindi home page). */
function bs_path_of(array $route): string
{
    $segs = [];
    if (($route['lang'] ?? BS_DEFAULT_LANG) !== BS_DEFAULT_LANG) {
        $segs[] = $route['lang'];
    }
    switch ($route['kind'] ?? 'home') {
        case 'track':
            $segs[] = 'track';
            $segs[] = (string) $route['slug'];
            break;
        case 'festival':
            $segs[] = 'festival';
            $segs[] = (string) $route['slug'];
            break;
        case 'date':
            $segs[] = 'date';
            $segs[] = (string) $route['date'];
            break;
    }
    return $segs === [] ? '/' : '/' . implode('/', $segs);
}

/**
 * href value for an in-app link: bs_path_of() is app-relative, but an <a href>
 * is resolved against the document root, so the mount point has to be added.
 * (Absolute URLs go through bs_absolute() instead, which already carries the base.)
 */
function bs_href(array $route): string
{
    return bs_base_path() . bs_path_of($route);
}

function bs_site_url(): string
{
    $configured = (string) (bs_config()['site_url'] ?? '');
    if ($configured !== '') {
        return rtrim($configured, '/');
    }
    $https = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || (strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https');
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    return ($https ? 'https' : 'http') . '://' . $host . bs_base_path();
}

function bs_absolute(string $path): string
{
    if ($path === '/') {
        return bs_site_url() . '/';
    }
    return bs_site_url() . $path;
}

function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
