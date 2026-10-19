<?php
declare(strict_types=1);

/*
 * Track lyrics: normalisation + server-side rendering.
 *
 * Why server-side? The lyrics have to be in the HTML for the page to be worth
 * anything as a "lyrics site" (and for Google). They are read straight from
 * data/lyrics.php - a plain slug -> stanzas map - so the track page keeps
 * working when MySQL is down, and the catalogue file stays readable.
 *
 * Source file shape (data/lyrics.php):
 *
 *   return [
 *       'om-jai-jagdish-hare' => [
 *           'ओम जय जगदीश हरे',                     // a bare string = one stanza
 *           [                                       // or an explicit stanza
 *               'label'    => 'अंतरा',              // optional section heading
 *               'hi'       => "पहली पंक्ति\nदूसरी पंक्ति",
 *               'translit' => "pahli pangti\ndusri pangti",   // optional
 *               'meaning'  => "अर्थ एक पंक्ति\nअर्थ दूसरी",   // optional
 *           ],
 *       ],
 *   ];
 *
 * 'meaning' is line-aligned when it has exactly as many lines as 'hi', and is
 * otherwise rendered as one block under the stanza. 'translit' behaves the
 * same way.
 */

/** slug => raw stanzas exactly as stored, or []. */
function bs_lyrics_file(): array
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

/** Raw lyrics for a track, or null when there are none. */
function bs_lyrics_raw(?string $slug): ?array
{
    if ($slug === null || $slug === '') {
        return null;
    }
    $raw = bs_lyrics_file()[$slug] ?? null;
    if (!is_array($raw) || $raw === []) {
        return null;
    }
    // Single-stanza shorthand: ['hi' => ..., 'translit' => ...] with no list.
    if (array_key_exists('hi', $raw)) {
        return [$raw];
    }
    return $raw;
}

/** Normalised stanzas for a track: [] when it has no lyrics yet. */
function bs_lyrics(?string $slug): array
{
    static $cache = [];

    $key = (string) $slug;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }

    $raw = bs_lyrics_raw($slug);
    if ($raw === null) {
        $cache[$key] = [];
        return [];
    }

    $stanzas = [];
    foreach ($raw as $item) {
        if (is_string($item)) {
            $item = ['hi' => $item];
        }
        if (!is_array($item)) {
            continue;
        }
        $hi = trim((string) ($item['hi'] ?? ''));
        if ($hi === '') {
            continue;
        }
        $lines = preg_split('/\R/u', $hi) ?: [];
        $count = count($lines);

        $translit = trim((string) ($item['translit'] ?? ''));
        $meaning  = trim((string) ($item['meaning'] ?? ''));

        $lineOut = [];
        foreach ($lines as $i => $line) {
            $lineOut[] = ['hi' => trim($line), 'translit' => ''];
        }

        $stanza = [
            'label'        => trim((string) ($item['label'] ?? '')),
            'lines'        => $lineOut,
            'translit'     => '',
            'meaning'      => '',
            'meaningLines' => [],
        ];

        if ($translit !== '') {
            $parts = preg_split('/\R/u', $translit) ?: [];
            if (count($parts) === $count) {
                foreach ($parts as $i => $part) {
                    $stanza['lines'][$i]['translit'] = trim($part);
                }
            } else {
                $stanza['translit'] = $translit;
            }
        }

        if ($meaning !== '') {
            $parts = preg_split('/\R/u', $meaning) ?: [];
            if (count($parts) === $count) {
                $stanza['meaningLines'] = array_map('trim', $parts);
            } else {
                $stanza['meaning'] = $meaning;
            }
        }

        $stanzas[] = $stanza;
    }

    $cache[$key] = $stanzas;
    return $stanzas;
}

function bs_has_lyrics(?string $slug): bool
{
    return bs_lyrics($slug) !== [];
}

/** Number of stanzas (0 when the track has no lyrics yet). */
function bs_lyrics_count(?string $slug): int
{
    return count(bs_lyrics($slug));
}

/** True when at least one line or stanza carries a romanisation. */
function bs_lyrics_has_translit(?string $slug): bool
{
    foreach (bs_lyrics($slug) as $stanza) {
        if ($stanza['translit'] !== '') {
            return true;
        }
        foreach ($stanza['lines'] as $line) {
            if ($line['translit'] !== '') {
                return true;
            }
        }
    }
    return false;
}

/** True when at least one line or stanza carries a meaning. */
function bs_lyrics_has_meaning(?string $slug): bool
{
    foreach (bs_lyrics($slug) as $stanza) {
        if ($stanza['meaning'] !== '') {
            return true;
        }
        foreach ($stanza['meaningLines'] as $meaning) {
            if ($meaning !== '') {
                return true;
            }
        }
    }
    return false;
}

/**
 * Server-rendered markup for the stanzas.
 *
 * Every text node is escaped; only the tags produced here end up in the page.
 */
function bs_lyrics_html(?string $slug): string
{
    $stanzas = bs_lyrics($slug);
    if ($stanzas === []) {
        return '';
    }

    $out = '';
    foreach ($stanzas as $stanza) {
        $out .= '<div class="lyric-stanza">';
        if ($stanza['label'] !== '') {
            $out .= '<p class="lyric-label">' . e($stanza['label']) . '</p>';
        }

        foreach ($stanza['lines'] as $i => $line) {
            $meaning = $stanza['meaningLines'][$i] ?? '';
            $out .= '<p class="lyric-line"' . ($meaning !== '' ? ' data-has-meaning="1"' : '') . '>'
                . '<span class="lyric-hi">' . e($line['hi']) . '</span>';
            if ($line['translit'] !== '') {
                $out .= '<span class="lyric-translit" lang="en">' . e($line['translit']) . '</span>';
            }
            if ($meaning !== '') {
                $out .= '<span class="lyric-meaning">' . e($meaning) . '</span>';
            }
            $out .= '</p>';
        }

        if ($stanza['translit'] !== '') {
            $out .= '<p class="lyric-translit lyric-translit-block" lang="en">'
                . e($stanza['translit']) . '</p>';
        }
        if ($stanza['meaning'] !== '') {
            $out .= '<p class="lyric-meaning lyric-meaning-block">' . e($stanza['meaning']) . '</p>';
        }

        $out .= '</div>';
    }

    return $out;
}

/** First lyric line, flattened - used for the meta description. */
function bs_lyrics_preview(?string $slug, int $limit = 160): string
{
    foreach (bs_lyrics($slug) as $stanza) {
        foreach ($stanza['lines'] as $line) {
            $text = trim($line['hi']);
            if ($text === '') {
                continue;
            }
            return mb_strlen($text) > $limit ? mb_substr($text, 0, $limit - 1) . '…' : $text;
        }
    }
    return '';
}
