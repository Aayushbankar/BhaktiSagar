<?php
declare(strict_types=1);

/*
 * Per-route <head> data: title, description, canonical, hreflang,
 * Open Graph / Twitter cards and JSON-LD.
 */

function bs_seo_texts(): array
{
    return [
        'hi' => [
            'site' => 'भक्ति सागर',
            'home_title' => 'भक्ति सागर | Shlokas, Bhajans & Aartis – समय के अनुसार सुझाव',
            'home_h1' => 'भक्ति सागर · श्लोक · भजन · आरती',
            'home_desc' => 'पंचांग (वार, तिथि, नक्षत्र और त्योहार) के अनुसार हिंदू श्लोक, भजन और आरती के सुझाव – YouTube प्लेयर के साथ। बिना लॉगिन, मोबाइल और डेस्कटॉप दोनों पर।',
            'track_title' => '{title} | भक्ति सागर',
            'track_desc' => '{blurb} शब्द, अर्थ, सुनने का सही समय और YouTube प्लेयर के साथ।',
            'festival_title' => '{name} {year} – तिथि, पंचांग और भक्ति सुझाव | भक्ति सागर',
            'festival_h1' => '{name} {year}',
            'festival_desc' => '{name} {year} की तिथि और पंचांग (वार, तिथि, नक्षत्र) के अनुसार श्लोक, भजन और आरती के सुझाव।',
            'date_title' => '{date} का पंचांग – वार, तिथि, नक्षत्र, त्योहार | भक्ति सागर',
            'date_h1' => '{date} का पंचांग',
            'date_desc' => '{date} का पंचांग और उस दिन के लिए श्लोक, भजन और आरती के सुझाव।',
            'notfound_title' => 'पेज नहीं मिला | भक्ति सागर',
            'notfound_desc' => 'यह पेज उपलब्ध नहीं है। भक्ति सागर पर आज का पंचांग और भक्ति सुझाव देखें।',
            'notfound_cta' => 'आज का पंचांग और भक्ति सुझाव देखें →',
        ],
        'en' => [
            'site' => 'Bhakti Sagar',
            'home_title' => 'Bhakti Sagar | Hindu Shlokas, Bhajans & Aartis – suggestions by time of day',
            'home_h1' => 'Bhakti Sagar · Shlokas · Bhajans · Aartis',
            'home_desc' => 'Devotional suggestions for Hindu shlokas, bhajans and aartis based on the panchang (week-day, tithi, nakshatra and festivals), with a YouTube player. No login, works on mobile and desktop.',
            'track_title' => '{title} | Bhakti Sagar',
            'track_desc' => 'Lyrics, meaning, the right time to listen and a YouTube player for {title}.',
            'festival_title' => '{name} {year} – date, panchang & devotional suggestions | Bhakti Sagar',
            'festival_h1' => '{name} {year}',
            'festival_desc' => 'Date and panchang for {name} {year}, with shloka, bhajan and aarti suggestions for the day.',
            'date_title' => 'Panchang for {date} – week-day, tithi, nakshatra, festivals | Bhakti Sagar',
            'date_h1' => 'Panchang for {date}',
            'date_desc' => 'Panchang for {date} with shloka, bhajan and aarti suggestions for that day.',
            'notfound_title' => 'Page not found | Bhakti Sagar',
            'notfound_desc' => 'This page is not available. See today\u2019s panchang and devotional suggestions on Bhakti Sagar.',
            'notfound_cta' => 'See today\u2019s panchang and suggestions →',
        ],
        'sa' => [
            'site' => 'भक्ति सागर',
            'home_title' => 'भक्ति सागर | श्लोकानि, भजनानि, आरतीः – कालानुसारं सूचनाम्',
            'home_h1' => 'भक्ति सागर · श्लोकानि · भजनानि · आरतीः',
            'home_desc' => 'पञ्चाङ्गस्य (वारः, तिथिः, नक्षत्रम्, पर्वाणि) आधारेण श्लोकानां भजनानां आरतीनां सूचना – YouTube यन्त्रेण सह। लगिनं विना, मोबाइल-डेस्कटपयोः।',
            'track_title' => '{title} | भक्ति सागर',
            'track_desc' => 'पदानि, अर्थः, श्रोतुं योग्यः कालः च YouTube यन्त्रं च सहितं – {title} ।',
            'festival_title' => '{name} {year} – तिथिः, पञ्चाङ्गम्, भक्तिसूचनाः | भक्ति सागर',
            'festival_h1' => '{name} {year}',
            'festival_desc' => '{name} {year} इत्यस्य तिथिः पञ्चाङ्गम् च तदधारेण श्लोक-भजन-आरतीसूचनाः ।',
            'date_title' => '{date} इत्यस्य पञ्चाङ्गम् – वारः, तिथिः, नक्षत्रम्, पर्वाणि | भक्ति सागर',
            'date_h1' => '{date} इत्यस्य पञ्चाङ्गम्',
            'date_desc' => '{date} इत्यस्य पञ्चाङ्गं तद्दिनस्य श्लोक-भजन-आरतीसूचनाः च ।',
            'notfound_title' => 'पृष्ठं न लभ्यते | भक्ति सागर',
            'notfound_desc' => 'इदं पृष्ठं न विद्यते । भक्तिसागरे अद्य पञ्चाङ्गं भक्तिसूचनाः च पश्यतु ।',
            'notfound_cta' => 'अद्य पञ्चाङ्गं पश्यतु →',
        ],
        'gu' => [
            'site' => 'ભક્તિ સાગર',
            'home_title' => 'ભક્તિ સાગર | શ્લોક, ભજન અને આરતી – સમય મુજબ સૂચનો',
            'home_h1' => 'ભક્તિ સાગર · શ્લોક · ભજન · આરતી',
            'home_desc' => 'પંચાંગ (વાર, તિથિ, નક્ષત્ર અને તહેવાર) મુજબ હિન્દુ શ્લોક, ભજન અને આરતીના સૂચનો – YouTube પ્લેયર સાથે. લોગિન વિના, મોબાઇલ અને ડેસ્કટોપ બંને પર.',
            'track_title' => '{title} | ભક્તિ સાગર',
            'track_desc' => '{blurb} શબ્દો, અર્થ, સાંભળવાનો યોગ્ય સમય અને YouTube પ્લેયર સાથે.',
            'festival_title' => '{name} {year} – તિથિ, પંચાંગ અને ભક્તિ સૂચનો | ભક્તિ સાગર',
            'festival_h1' => '{name} {year}',
            'festival_desc' => '{name} {year}ની તિથિ અને પંચાંગ (વાર, તિથિ, નક્ષત્ર) મુજબ શ્લોક, ભજન અને આરતીના સૂચનો.',
            'date_title' => '{date}નું પંચાંગ – વાર, તિથિ, નક્ષત્ર, તહેવાર | ભક્તિ સાગર',
            'date_h1' => '{date}નું પંચાંગ',
            'date_desc' => '{date}નું પંચાંગ અને એ દિવસ માટે શ્લોક, ભજન અને આરતીના સૂચનો.',
            'notfound_title' => 'પેજ મળ્યું નથી | ભક્તિ સાગર',
            'notfound_desc' => 'આ પેજ ઉપલબ્ધ નથી. ભક્તિ સાગર પર આજનું પંચાંગ અને ભક્તિ સૂચનો જુઓ.',
            'notfound_cta' => 'આજનું પંચાંગ અને ભક્તિ સૂચનો જુઓ →',
        ],
    ];
}

function bs_t(string $lang, string $key, array $vars = []): string
{
    $texts = bs_seo_texts();
    $lang = in_array($lang, BS_LANGS, true) ? $lang : BS_DEFAULT_LANG;
    $template = $texts[$lang][$key] ?? ($texts[BS_DEFAULT_LANG][$key] ?? $key);
    foreach ($vars as $name => $value) {
        $template = str_replace('{' . $name . '}', (string) $value, $template);
    }
    return $template;
}

function bs_jsonld(array $route, array $ctx): array
{
    $webSite = [
        '@type' => 'WebSite',
        'name' => bs_t($route['lang'], 'site'),
        'alternateName' => 'Bhakti Sagar',
        'url' => bs_absolute('/'),
        'inLanguage' => $route['lang'],
    ];

    $items = [$webSite];

    if ($route['kind'] === 'track' && isset($ctx['track'])) {
        $track = $ctx['track'];
        $items[] = [
            '@type' => 'MusicRecording',
            'name' => bs_track_title($track, $route['lang']),
            'url' => bs_absolute(bs_path_of($route)),
            'description' => bs_t($route['lang'], 'track_desc', [
                'title' => $track['title_en'] ?? $track['slug'],
                'blurb' => $track['blurb'] ?? '',
            ]),
            'inLanguage' => $route['lang'],
            'byArtist' => [
                '@type' => 'MusicGroup',
                'name' => $track['singer'] ?? ($track['deity'] ?? 'Bhakti Sagar'),
            ],
            'genre' => $track['type'] ?? 'devotional',
        ];
        $items[] = bs_breadcrumb($route, [
            ['name' => bs_t($route['lang'], 'site'), 'url' => bs_absolute('/')],
            ['name' => $track['title_en'] ?? $track['slug'], 'url' => bs_absolute(bs_path_of($route))],
        ]);
    }

    if ($route['kind'] === 'festival' && isset($ctx['festival'])) {
        $fest = $ctx['festival'];
        $items[] = [
            '@type' => 'Event',
            'name' => $fest['name'],
            'description' => bs_t($route['lang'], 'festival_desc', [
                'name' => $fest['name'],
                'year' => $ctx['year'] ?? '',
            ]),
            'startDate' => $route['date'],
            'url' => bs_absolute(bs_path_of($route)),
            'inLanguage' => $route['lang'],
        ];
        $items[] = bs_breadcrumb($route, [
            ['name' => bs_t($route['lang'], 'site'), 'url' => bs_absolute('/')],
            ['name' => $fest['name'], 'url' => bs_absolute(bs_path_of($route))],
        ]);
    }

    if ($route['kind'] === 'date') {
        $items[] = bs_breadcrumb($route, [
            ['name' => bs_t($route['lang'], 'site'), 'url' => bs_absolute('/')],
            ['name' => $route['date'], 'url' => bs_absolute(bs_path_of($route))],
        ]);
    }

    return $items;
}

function bs_breadcrumb(array $route, array $items): array
{
    $out = [
        '@type' => 'BreadcrumbList',
        'itemListElement' => [],
    ];
    foreach (array_values($items) as $i => $item) {
        $out['itemListElement'][] = [
            '@type' => 'ListItem',
            'position' => $i + 1,
            'name' => $item['name'],
            'item' => $item['url'],
        ];
    }
    return $out;
}

/**
 * @return array{status:int,title:string,description:string,canonical:string,
 *   alternates:array<string,string>,og:array<string,string>,
 *   jsonld:array<int,array>}
 */
function bs_seo(array $route): array
{
    $lang = $route['lang'];
    $kind = $route['kind'];
    $status = $route['ok'] ? 200 : 404;
    $ctx = [];

    if ($kind === 'track') {
        $ctx['track'] = bs_track($route['slug']);
    }
    if ($kind === 'festival') {
        $ctx['festival'] = bs_festival_info($route['slug']);
        $ctx['year'] = $route['date'] !== null ? (int) substr($route['date'], 0, 4) : '';
    }

    switch ($kind) {
        case 'track':
            $title = bs_t($lang, 'track_title', ['title' => bs_track_title($ctx['track'], $lang)]);
            $description = bs_t($lang, 'track_desc', [
                'title' => $ctx['track']['title_en'] ?? $route['slug'],
                'blurb' => $ctx['track']['blurb'] ?? '',
            ]);
            break;
        case 'festival':
            $title = bs_t($lang, 'festival_title', [
                'name' => $ctx['festival']['name'] ?? $route['slug'],
                'year' => $ctx['year'],
            ]);
            $description = bs_t($lang, 'festival_desc', [
                'name' => $ctx['festival']['name'] ?? $route['slug'],
                'year' => $ctx['year'],
            ]);
            break;
        case 'date':
            $title = bs_t($lang, 'date_title', ['date' => $route['date']]);
            $description = bs_t($lang, 'date_desc', ['date' => $route['date']]);
            break;
        default:
            if (!$route['ok']) {
                $title = bs_t($lang, 'notfound_title');
                $description = bs_t($lang, 'notfound_desc');
            } else {
                $title = bs_t($lang, 'home_title');
                $description = bs_t($lang, 'home_desc');
            }
    }

    $canonicalPath = bs_path_of($route);
    $alternates = [];
    foreach (BS_LANGS as $code) {
        $clone = $route;
        $clone['lang'] = $code;
        $alternates[$code] = bs_absolute(bs_path_of($clone));
    }
    // x-default = the default-language version of THIS page, not always home
    $defaultRoute = $route;
    $defaultRoute['lang'] = BS_DEFAULT_LANG;
    $alternates['x-default'] = bs_absolute(bs_path_of($defaultRoute));

    $og = [
        'og:type' => 'website',
        'og:site_name' => bs_t($lang, 'site'),
        'og:locale' => ['hi' => 'hi_IN', 'en' => 'en_US', 'sa' => 'sa_IN', 'gu' => 'gu_IN'][$lang] ?? 'hi_IN',
        'og:title' => $title,
        'og:description' => $description,
        'og:url' => bs_absolute($canonicalPath),
        'og:locale:alternate' => implode(',', array_filter([
            $lang === 'hi' ? '' : 'hi_IN',
            $lang === 'en' ? '' : 'en_US',
            $lang === 'sa' ? '' : 'sa_IN',
            $lang === 'gu' ? '' : 'gu_IN',
        ])),
        'twitter:card' => 'summary',
        'twitter:title' => $title,
        'twitter:description' => $description,
        'twitter:url' => bs_absolute($canonicalPath),
    ];
    $og = array_filter($og, static fn ($v) => $v !== '' && $v !== null);
    $image = __DIR__ . '/../assets/img/og.png';
    if (is_file($image)) {
        $og['og:image'] = bs_absolute('/assets/img/og.png');
    }

    return [
        'status' => $status,
        'title' => $title,
        'description' => $description,
        'canonical' => bs_absolute($canonicalPath),
        'alternates' => $alternates,
        'og' => $og,
        'jsonld' => bs_jsonld($route, $ctx),
    ];
}
