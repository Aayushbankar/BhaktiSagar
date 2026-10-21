<?php
declare(strict_types=1);

require __DIR__ . '/lib/route.php';
require __DIR__ . '/lib/lyrics.php';
require __DIR__ . '/lib/seo.php';
require __DIR__ . '/lib/sitemap.php';
require __DIR__ . '/lib/i18n.php';

$requestPath = bs_request_path();

/* Static files served by this front controller (never real files on disk). */
if ($requestPath === '/robots.txt') {
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo bs_robots_txt();
    exit;
}
if ($requestPath === '/sitemap.xml') {
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo bs_sitemap_xml();
    exit;
}

$route = bs_parse_route($requestPath);
$seo   = bs_seo($route);
$base  = bs_base_path();
$lang  = $route['lang'];

/** Chrome strings for this language (see lib/i18n.php). */
$t = static function (string $key, array $vars = []) use ($lang): string {
    return bs_t_ui($lang, $key, $vars);
};

if ($seo['status'] !== 200) {
    http_response_code($seo['status']);
}

/** Handed to app.js so it knows where the site root and its own route are. */
$jsRoute = [
    'kind'      => $route['kind'],
    'lang'      => $lang,
    'path'      => bs_path_of($route),
    'base'      => $base,
    'track'     => $route['kind'] === 'track' ? (string) $route['slug'] : '',
    'festival'  => $route['kind'] === 'festival' ? (string) $route['slug'] : '',
    'date'      => (string) ($route['date'] ?? ''),
    'notFound'  => !$route['ok'],
];
$jsonld = json_encode($seo['jsonld'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
$jsonld = $jsonld === false ? '[]' : $jsonld;

$assetVer = static function (string $path): string {
    return (string) (int) @filemtime(__DIR__ . '/' . $path);
};
?>
<!DOCTYPE html>
<html lang="<?= e($lang) ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title><?= e($seo['title']) ?></title>
<meta name="description" content="<?= e($seo['description']) ?>">
<link rel="canonical" href="<?= e($seo['canonical']) ?>">
<?php foreach ($seo['alternates'] as $code => $href): ?>
<link rel="alternate" hreflang="<?= e($code) ?>" href="<?= e($href) ?>">
<?php endforeach; ?>
<?php foreach ($seo['og'] as $property => $content): ?>
<meta <?= strpos($property, 'twitter:') === 0 ? 'name' : 'property' ?>="<?= e($property) ?>" content="<?= e($content) ?>">
<?php endforeach; ?>
<?php if ($seo['status'] !== 200): ?>
<meta name="robots" content="noindex, follow">
<?php endif; ?>
<meta name="theme-color" content="#7b1e2b">
<meta name="color-scheme" content="light">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%237b1e2b'/%3E%3Ctext x='32' y='44' font-size='34' text-anchor='middle' fill='%23f4a024' font-family='serif'%3E%E0%A5%90%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= e($base) ?>/assets/css/style.css?v=<?= e($assetVer('assets/css/style.css')) ?>">
<script type="application/ld+json"><?= $jsonld ?></script>
</head>
<body>

<header class="topbar">
  <div class="brand">
    <span class="brand-mark" aria-hidden="true">ॐ</span>
    <span class="brand-text">
      <strong>भक्ति सागर</strong>
      <small><?= e($t('brand.tagline')) ?></small>
    </span>
  </div>

  <nav class="lang-switch" aria-label="<?= e($t('lang.aria')) ?>">
    <?php foreach (BS_LANGS as $code):
        $alt = $route;
        $alt['lang'] = $code;
        $isCurrent = $code === $lang; ?>
    <a class="lang-link<?= $isCurrent ? ' is-current' : '' ?>"
       href="<?= e(bs_href($alt)) ?>"
       lang="<?= e($code) ?>"
       hreflang="<?= e($code) ?>"
       <?= $isCurrent ? 'aria-current="page"' : '' ?>><?= e(mb_strtoupper($code)) ?></a>
    <?php endforeach; ?>
  </nav>

  <div class="clockbox" aria-label="<?= e($t('clock.aria')) ?>">
    <span class="clock-main" id="clockIst">--:--:--</span>
    <span class="clock-meta"><span id="istLabel"><?= e($t('clock.ist')) ?></span><span class="dot">•</span><span id="clockLocal">--:--</span> <span id="localLabel"><?= e($t('clock.local')) ?></span></span>
  </div>
</header>

<?php if (!$route['ok']): ?>
<section class="notfound" id="notFound" role="alert">
  <span class="notfound-code">404</span>
  <h1 class="notfound-title"><?= e($seo['title']) ?></h1>
  <p class="notfound-text"><?= e($seo['description']) ?></p>
  <a class="notfound-link" href="<?= e(bs_href(['kind' => 'home', 'lang' => $lang, 'slug' => null, 'date' => null])) ?>">
    <?= e(bs_t($lang, 'notfound_cta')) ?>
  </a>
</section>
<?php endif; ?>

<section class="dateline">
  <div class="dateline-block">
    <span class="date-hi" id="dateHi">…</span>
    <span class="date-en" id="dateEn">…</span>
  </div>
  <div class="slot-pill" id="slotPill">
    <span class="slot-pill-dot" aria-hidden="true"></span>
    <span id="slotPillText"><?= e($t('slot.calculating')) ?></span>
  </div>
</section>

<section class="panchang" id="panchangStrip" aria-label="<?= e($t('panchang.aria')) ?>" hidden>
  <div class="panchang-head">
    <span class="panchang-title" id="panchangTitle"><?= e($t('panchang.title')) ?></span>
    <label class="city-picker">
      <span class="city-picker-label" id="cityLabel"><?= e($t('panchang.cityLabel')) ?></span>
      <select id="citySelect" aria-label="<?= e($t('panchang.cityAria')) ?>"></select>
    </label>
  </div>
  <div class="panchang-items">
    <div class="panch-item">
      <span class="panch-label"><?= e($t('panchang.var')) ?></span>
      <span class="panch-value" id="pcVar">–</span>
    </div>
    <div class="panch-item">
      <span class="panch-label"><?= e($t('panchang.tithi')) ?></span>
      <span class="panch-value" id="pcTithi">–</span>
    </div>
    <div class="panch-item">
      <span class="panch-label"><?= e($t('panchang.nakshatra')) ?></span>
      <span class="panch-value" id="pcNak">–</span>
    </div>
    <div class="panch-item">
      <span class="panch-label"><?= e($t('panchang.sunrise')) ?></span>
      <span class="panch-value" id="pcRise">–</span>
    </div>
    <div class="panch-item">
      <span class="panch-label"><?= e($t('panchang.sunset')) ?></span>
      <span class="panch-value" id="pcSet">–</span>
    </div>
  </div>
  <div class="fest-row" id="festRow" hidden></div>
  <p class="panchang-note" id="panchangNote" hidden></p>
</section>

<main class="layout">

  <div class="main-col">

    <?php
    /* One page-level heading per route: home, festival and date pages have no
       track H1 of their own (QA-001). Track and 404 pages ship theirs already. */
    if ($route['ok'] && $route['kind'] !== 'track'):
        if ($route['kind'] === 'festival'):
            $festInfo = bs_festival_info($route['slug']);
            $pageH1 = bs_t($lang, 'festival_h1', [
                'name' => ($lang !== 'en' && ($festInfo['hi'] ?? '') !== '')
                    ? (string) $festInfo['hi']
                    : (string) ($festInfo['name'] ?? $route['slug']),
                'year' => $route['date'] !== null ? substr((string) $route['date'], 0, 4) : '',
            ]);
        elseif ($route['kind'] === 'date'):
            $pageH1 = bs_t($lang, 'date_h1', ['date' => (string) $route['date']]);
        else:
            $pageH1 = bs_t($lang, 'home_h1');
        endif;
    ?>
    <h1 class="page-h1"><?= e($pageH1) ?></h1>
    <?php endif; ?>

    <?php if ($route['kind'] === 'track' && $route['ok'] && ($trackDetail = bs_track($route['slug'])) !== null):
        $lyricsHtml  = bs_lyrics_html($route['slug']);
        $lyricsCount = bs_lyrics_count($route['slug']);
        $hasTranslit = bs_lyrics_has_translit($route['slug']);
        $hasMeaning  = bs_lyrics_has_meaning($route['slug']);
        $trackTitle  = (string) ($trackDetail[$lang === 'en' ? 'title_en' : 'title_hi'] ?? $trackDetail['title_en']);
    ?>
    <section class="track-detail" id="trackDetail" data-slug="<?= e($route['slug']) ?>" aria-label="<?= e($t('track.aria')) ?>">
      <p class="track-crumb">
        <a class="track-back" href="<?= e(bs_href(['kind' => 'home', 'lang' => $lang, 'slug' => null, 'date' => null])) ?>">&larr; <?= e($t('track.back')) ?></a>
      </p>

      <p class="track-kicker">
        <span class="badge badge-<?= e($trackDetail['type']) ?>"><?= e($t('type.' . $trackDetail['type'])) ?></span>
        <?php if ($lyricsCount > 0): ?>
        <span class="stanza-count"><?= e($t('track.stanzas', ['n' => $lyricsCount])) ?></span>
        <?php endif; ?>
      </p>

      <h1 class="track-h1"><?= e($trackTitle) ?></h1>

      <p class="track-facts">
        <span><?= e($trackDetail['deity']) ?></span>
        <?php if (($trackDetail['singer'] ?? '') !== ''): ?>
        <span class="dot" aria-hidden="true">·</span> <span><?= e($trackDetail['singer']) ?></span>
        <?php endif; ?>
      </p>

      <p class="track-blurb-desc"><?= e($trackDetail['blurb']) ?></p>

      <div class="track-actions">
        <button type="button" class="track-play" id="trackPlayBtn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span><?= e($t('track.play')) ?></span>
        </button>
        <?php if (($trackDetail['youtube_id'] ?? '') !== ''): ?>
        <a class="yt-link" href="https://www.youtube.com/watch?v=<?= e($trackDetail['youtube_id']) ?>" target="_blank" rel="noopener"><?= e($t('player.openYt')) ?></a>
        <?php endif; ?>
      </div>

      <?php if ($lyricsHtml !== ''): ?>
      <div class="lyrics-toolbar" role="group" aria-label="<?= e($t('track.reading')) ?>">
        <?php if ($hasTranslit): ?>
        <button type="button" class="tg" id="tgTranslit" aria-pressed="false"><?= e($t('track.translit')) ?></button>
        <?php endif ?>
        <?php if ($hasMeaning): ?>
        <button type="button" class="tg" id="tgMeaning" aria-pressed="false"><?= e($t('track.meaning')) ?></button>
        <?php endif ?>
        <span class="tg-sep" aria-hidden="true"></span>
        <button type="button" class="tg tg-icon" id="fontDec" aria-label="<?= e($t('track.fontSmaller')) ?>" title="<?= e($t('track.fontSmaller')) ?>">A&minus;</button>
        <button type="button" class="tg tg-icon" id="fontInc" aria-label="<?= e($t('track.fontBigger')) ?>" title="<?= e($t('track.fontBigger')) ?>">A+</button>
      </div>
      <div class="lyrics" id="lyricsBody" lang="<?= e($lang === 'en' ? 'hi' : $lang) ?>"><?= $lyricsHtml ?></div>
      <?php else: ?>
      <p class="lyrics-empty" id="lyricsBody"><?= e($t('track.noLyrics')) ?></p>
      <?php endif; ?>
    </section>
    <?php endif; ?>

    <section class="shloka-card" id="shlokaCard" aria-label="<?= e($t('shloka.aria')) ?>">
      <div class="shloka-head">
        <span class="shloka-kicker"><?= e($t('shloka.kicker')) ?></span>
        <span class="shloka-source" id="shlokaSource"></span>
      </div>
      <p class="shloka-text" id="shlokaText">ॐ …</p>
      <p class="shloka-translit" id="shlokaTranslit"></p>
      <p class="shloka-meaning" id="shlokaMeaning"></p>
    </section>

    <section class="special" id="specialSection" aria-label="<?= e($t('special.aria')) ?>" hidden>
      <div class="special-head">
        <h2 class="special-title"><?= e($t('special.title')) ?> <small><?= e($t('special.sub')) ?></small></h2>
      </div>
      <ul class="rule-list" id="ruleList"></ul>
      <div class="grid grid-special" id="specialGrid"></div>
    </section>

    <section class="jyo" id="jyoSection" aria-label="<?= e($t('jyo.aria')) ?>" hidden>
      <div class="special-head">
        <h2 class="jyo-title"><?= e($t('jyo.title')) ?> <small><?= e($t('jyo.sub')) ?></small></h2>
      </div>
      <div class="grid grid-special" id="jyoGrid"></div>
    </section>

    <section class="toolbar" aria-label="<?= e($t('toolbar.aria')) ?>">
      <div class="chip-row" id="slotChips" role="group" aria-label="<?= e($t('chips.slotAria')) ?>"></div>
      <div class="chip-row chip-row-secondary" id="typeChips" role="group" aria-label="<?= e($t('chips.typeAria')) ?>"></div>
      <div class="search-row">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 104.9 9.5l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z"/></svg>
        <input type="search" id="searchInput" placeholder="<?= e($t('search.placeholder')) ?>" autocomplete="off" aria-label="<?= e($t('search.aria')) ?>">
        <span class="result-count" id="resultCount"></span>
      </div>
    </section>

    <section class="grid" id="trackGrid" aria-live="polite" aria-label="<?= e($t('grid.aria')) ?>">
      <div class="loading-state" id="loadingState"><?= e($t('grid.loading')) ?></div>
    </section>

    <noscript>
      <p class="noscript-note"><?= e($t('noscript')) ?></p>
    </noscript>
  </div>

  <aside class="player-col" id="playerCol" aria-label="<?= e($t('player.aria')) ?>">
    <div class="player-card">
      <div class="player-frame" id="playerFrame">
        <div class="player-placeholder" id="playerPlaceholder">
          <span class="player-placeholder-om">ॐ</span>
          <p><?= e($t('player.placeholder')) ?></p>
        </div>
        <div id="ytPlayerHost" hidden></div>
      </div>

      <div class="player-info">
        <span class="now-label"><?= e($t('player.now')) ?></span>
        <h2 id="nowTitle"><?= e($t('player.ready')) ?></h2>
        <p id="nowMeta"><?= e($t('player.pick')) ?></p>
      </div>

      <div class="player-controls">
        <button type="button" class="ctrl-btn" id="btnPrev" aria-label="<?= e($t('player.prev')) ?>">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14L8 12z"/><rect x="5" y="5" width="2.2" height="14" rx="1"/></svg>
        </button>
        <button type="button" class="ctrl-btn ctrl-btn-main" id="btnToggle" aria-label="<?= e($t('player.toggle')) ?>">
          <svg viewBox="0 0 24 24" aria-hidden="true" id="iconPlay"><path d="M8 5v14l11-7z"/></svg>
          <svg viewBox="0 0 24 24" aria-hidden="true" id="iconPause" hidden><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>
        </button>
        <button type="button" class="ctrl-btn" id="btnNext" aria-label="<?= e($t('player.next')) ?>">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14l10-7z"/><rect x="16.8" y="5" width="2.2" height="14" rx="1"/></svg>
        </button>
        <a class="yt-link" id="btnOpenYt" href="https://www.youtube.com/" target="_blank" rel="noopener"><?= e($t('player.openYt')) ?></a>
      </div>

      <div class="queue">
        <div class="queue-head">
          <h3><?= e($t('queue.title')) ?></h3>
          <span class="queue-count" id="queueCount">0</span>
        </div>
        <ol class="queue-list" id="queueList"></ol>
      </div>
    </div>
  </aside>
</main>

<div class="mini-bar" id="miniBar" hidden>
  <button type="button" class="mini-main" id="miniOpen" aria-label="<?= e($t('mini.aria')) ?>">
    <span class="mini-title" id="miniTitle">–</span>
    <span class="mini-sub" id="miniSub"><?= e($t('mini.sub')) ?></span>
  </button>
  <button type="button" class="mini-btn" id="miniPrev" aria-label="<?= e($t('mini.prev')) ?>">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14L8 12z"/></svg>
  </button>
  <button type="button" class="mini-btn" id="miniToggle" aria-label="<?= e($t('mini.toggle')) ?>">
    <svg viewBox="0 0 24 24" aria-hidden="true" id="miniIconPlay"><path d="M8 5v14l11-7z"/></svg>
    <svg viewBox="0 0 24 24" aria-hidden="true" id="miniIconPause" hidden><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>
  </button>
  <button type="button" class="mini-btn" id="miniNext" aria-label="<?= e($t('mini.next')) ?>">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14l10-7z"/><rect x="16.8" y="5" width="2.2" height="14" rx="1"/></svg>
  </button>
</div>

<footer class="site-footer">
  <p><strong>भक्ति सागर</strong> – <?= e($t('footer.about')) ?></p>
  <p><?= e($t('footer.legal')) ?></p>
  <p class="footer-meta" id="footerMeta"></p>
</footer>

<script>window.__ROUTE__ = <?= json_encode($jsRoute, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?>;</script>
<script>window.__I18N__ = <?= json_encode(bs_i18n($lang), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG) ?>;</script>
<script src="<?= e($base) ?>/assets/js/app.js?v=<?= e($assetVer('assets/js/app.js')) ?>" defer></script>
</body>
</html>
