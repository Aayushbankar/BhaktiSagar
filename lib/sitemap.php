<?php
declare(strict_types=1);

/*
 * robots.txt and sitemap.xml, served dynamically by index.php so that the
 * host and mount path are always correct.
 */

function bs_sitemap_groups(): array
{
    $groups = [];
    $paths = static function (string $kind, ?string $slug = null): array {
        $out = [];
        foreach (BS_LANGS as $lang) {
            $out[$lang] = bs_path_of([
                'kind' => $kind,
                'lang' => $lang,
                'slug' => $slug,
                'date' => null,
            ]);
        }
        return $out;
    };

    $groups[] = [
        'paths' => $paths('home'),
        'lastmod' => date('Y-m-d'),
        'priority' => '1.0',
        'changefreq' => 'daily',
    ];

    $catalogMtime = date('Y-m-d', (int) @filemtime(dirname(__DIR__) . '/data/catalog.php'));
    foreach (bs_catalog()['tracks'] as $track) {
        $groups[] = [
            'paths' => $paths('track', (string) $track['slug']),
            'lastmod' => $catalogMtime,
            'priority' => '0.7',
            'changefreq' => 'monthly',
        ];
    }

    $panchangMtime = date('Y-m-d', (int) @filemtime(dirname(__DIR__) . '/data/panchang.json'));
    foreach (bs_festival_index() as $slug => $dates) {
        if (bs_festival_info($slug) === null || $dates === []) {
            continue;
        }
        $groups[] = [
            'paths' => $paths('festival', $slug),
            'lastmod' => end($dates),
            'priority' => '0.8',
            'changefreq' => 'yearly',
        ];
    }

    return $groups;
}

function bs_sitemap_xml(): string
{
    $lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
            . ' xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ];
    foreach (bs_sitemap_groups() as $group) {
        $primary = $group['paths'][BS_DEFAULT_LANG];
        $lines[] = '  <url>';
        $lines[] = '    <loc>' . e(bs_absolute($primary)) . '</loc>';
        if (!empty($group['lastmod'])) {
            $lines[] = '    <lastmod>' . e((string) $group['lastmod']) . '</lastmod>';
        }
        $lines[] = '    <changefreq>' . e((string) $group['changefreq']) . '</changefreq>';
        $lines[] = '    <priority>' . e((string) $group['priority']) . '</priority>';
        foreach ($group['paths'] as $lang => $path) {
            $lines[] = '    <xhtml:link rel="alternate" hreflang="' . e($lang) . '" href="'
                . e(bs_absolute($path)) . '"/>';
        }
        // x-default = this group's default-language page, not always home
        $lines[] = '    <xhtml:link rel="alternate" hreflang="x-default" href="'
            . e(bs_absolute($group['paths'][BS_DEFAULT_LANG])) . '"/>';
        $lines[] = '  </url>';
    }
    $lines[] = '</urlset>';
    return implode("\n", $lines) . "\n";
}

function bs_robots_txt(): string
{
    $lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        'Disallow: /lib/',
        'Disallow: /i18n/',
        'Disallow: /data/',
        'Disallow: /tools/',
        'Disallow: /tests/',
        'Disallow: /docs/',
        'Disallow: /db/',
        'Disallow: /config.php',
        'Disallow: /*?city=',
        'Disallow: /*?date=',
        'Disallow: /*?q=',
        '',
        'Sitemap: ' . bs_absolute('/sitemap.xml'),
    ];
    return implode("\n", $lines) . "\n";
}
