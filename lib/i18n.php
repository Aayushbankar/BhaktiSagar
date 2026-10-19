<?php
declare(strict_types=1);

/*
 * UI string tables for the site chrome (labels, buttons, empty states).
 * Content that lives in the catalogue (song titles, festival names, panchang
 * rows) is handled in app.js from the API payloads, not from here.
 *
 * Files: i18n/<lang>.json — every language must carry the same key set,
 * missing keys silently fall back to the default language (hi).
 */

/** Raw table for a language, merged over the default language. Never empty. */
function bs_i18n(string $lang): array
{
    static $cache = [];

    if (isset($cache[$lang])) {
        return $cache[$lang];
    }

    $read = static function (string $code): array {
        $file = dirname(__DIR__) . '/i18n/' . $code . '.json';
        if (!is_file($file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data)) {
            return [];
        }
        $out = [];
        foreach ($data as $k => $v) {
            if (is_string($k) && is_string($v)) {
                $out[$k] = $v;
            }
        }
        return $out;
    };

    $base = $read(BS_DEFAULT_LANG);
    $table = $lang === BS_DEFAULT_LANG ? $base : array_replace($base, $read($lang));

    if ($table === []) {
        $table = ['__missing' => 'i18n table missing'];
    }

    $cache[$lang] = $table;
    return $table;
}

/** Translate a chrome key, substituting {placeholders}. */
function bs_t_ui(string $lang, string $key, array $vars = []): string
{
    $table = bs_i18n($lang);
    $text  = $table[$key] ?? (bs_i18n(BS_DEFAULT_LANG)[$key] ?? $key);

    foreach ($vars as $name => $value) {
        $text = str_replace('{' . $name . '}', (string) $value, $text);
    }

    return $text;
}

/** Keys present in a language file (used by the i18n spec). */
function bs_i18n_keys(string $lang): array
{
    return array_keys(bs_i18n($lang));
}
