<?php
declare(strict_types=1);

/*
 * Domain-expert verification report generator.
 *
 * Usage:  php tools/generate-report.php
 * Output: docs/bhakti-sagar-domain-verification.html  (print-ready A4)
 * Then:   headless Edge --print-to-pdf  →  docs/bhakti-sagar-domain-verification.pdf
 *
 * Sections: daily shlokas, tracks by type (श्लोक/भजन/आरती), day-wise rules
 * (वार / तिथि-व्रत / त्योहार with real 2026-27 dates), time-slot list.
 * Every row ends with an empty box (☐) for the expert to tick.
 */

$root = dirname(__DIR__);

ob_start();
include $root . '/data/catalog.php';
ob_end_clean();

ob_start();
include $root . '/data/day_rules.php';
ob_end_clean();

$panchang = json_decode((string)file_get_contents($root . '/data/panchang.json'), true);
$days = $panchang['days'] ?? [];
$festCatalog = $panchang['festivals'] ?? [];

$slotByLabel = [];
foreach ($slots as $s) {
    $slotByLabel[$s['key']] = $s;
}

$trackBySlug = [];
foreach ($tracks as $t) {
    $trackBySlug[$t['slug']] = $t;
}

$typeHi = ['shloka' => 'श्लोक', 'bhajan' => 'भजन', 'aarti' => 'आरती'];
$varHi = ['sun' => 'रविवार', 'mon' => 'सोमवार', 'tue' => 'मंगलवार', 'wed' => 'बुधवार', 'thu' => 'गुरुवार', 'fri' => 'शुक्रवार', 'sat' => 'शनिवार'];
$tithiHi = [
    'ekadashi' => 'एकादशी', 'dwadashi' => 'द्वादशी', 'pradosh' => 'प्रदोष', 'shivaratri' => 'शिवरात्रि',
    'chaturthi' => 'चतुर्थी', 'ashtami' => 'अष्टमी', 'navami' => 'नवमी', 'purnima' => 'पूर्णिमा', 'amavasya' => 'अमावस्या',
];

function h(?string $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

function slotNames(string $slotCsv, array $slotByLabel): string {
    $out = [];
    foreach (explode(',', $slotCsv) as $k) {
        $k = trim($k);
        if ($k !== '' && isset($slotByLabel[$k])) {
            $out[] = $slotByLabel[$k]['label_hi'] . ' (' . $slotByLabel[$k]['range'] . ')';
        }
    }
    return implode(' · ', $out);
}

function trackTitleLine(string $slug, array $trackBySlug, array $typeHi): string {
    $t = $trackBySlug[$slug] ?? null;
    if (!$t) {
        return '<span class="missing">' . h($slug) . ' — कैटलॉग में नहीं मिला</span>';
    }
    return h($t['title_hi']) . ' <span class="tag type-' . h($t['type']) . '">' . $typeHi[$t['type']] . '</span>';
}

/* festival dates 2026-2027 for a rule match (substring match like the API) */
function festDates(string $match, array $days, array $festCatalog): string {
    $found = [];
    foreach ($days as $date => $d) {
        if ($date < '2026-01-01' || $date > '2027-12-31') { continue; }
        foreach (($d['festivals'] ?? []) as $fs) {
            if (strpos($fs, $match) !== false) {
                $found[$date] = true;
                break;
            }
        }
    }
    $out = [];
    foreach (array_keys($found) as $date) {
        $ts = strtotime($date);
        $out[] = date('d M Y', $ts) . ' (' . date('D', $ts) . ')';
    }
    return $out ? implode(', ', $out) : '—';
}

$counts = ['shloka' => 0, 'bhajan' => 0, 'aarti' => 0];
foreach ($tracks as $t) { $counts[$t['type']] = ($counts[$t['type']] ?? 0) + 1; }

$ruleGroups = [
    'var' => ['title' => 'वार (हर सप्ताह दोहराया जाता है)', 'rules' => []],
    'tithi' => ['title' => 'तिथि / व्रत (हर माह दोहराया जाता है)', 'rules' => []],
    'festival' => ['title' => 'त्योहार (तिथि के अनुसार)', 'rules' => []],
];
foreach ($rules as $r) {
    $ruleGroups[$r['type']]['rules'][] = $r;
}
$groupOrder = ['var', 'tithi', 'festival'];

/* ---------------- HTML ---------------- */

$css = <<<CSS
@page { size: A4; margin: 13mm 11mm; }
* { box-sizing: border-box; }
body {
  font-family: "Nirmala UI", "Mangal", "Noto Sans Devanagari", sans-serif;
  font-size: 10.5pt; color: #1a1a1a; margin: 0;
}
header { border-bottom: 3px solid #e8871e; padding-bottom: 8px; margin-bottom: 14px; }
h1 { font-size: 17pt; margin: 0 0 4px; color: #7b1e2b; }
.sub { font-size: 9.5pt; color: #444; }
h2 {
  font-size: 13pt; color: #7b1e2b; border-bottom: 2px solid #e8a94e;
  padding-bottom: 3px; margin: 22px 0 8px;
}
h2 .cnt { font-size: 10pt; color: #666; font-weight: normal; }
h3 { font-size: 11.5pt; margin: 14px 0 6px; color: #333; }
p.note { font-size: 9pt; color: #444; background: #fdf3e7; border: 1px solid #f0d6b0; padding: 6px 9px; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
thead { display: table-header-group; }
th, td { border: 1px solid #b9b9b9; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #f4e3d2; font-size: 9.5pt; }
tbody tr:nth-child(even) td { background: #fbfaf8; }
tr { page-break-inside: avoid; }
.num { width: 26px; text-align: center; color: #666; }
.box { display: inline-block; width: 13px; height: 13px; border: 1.5px solid #555; vertical-align: -2px; }
.ok { width: 30px; text-align: center; }
.tag {
  display: inline-block; font-size: 8.5pt; padding: 0 5px; border-radius: 8px;
  color: #fff; white-space: nowrap;
}
.type-shloka { background: #2f6f4f; }
.type-bhajan { background: #b3541e; }
.type-aarti { background: #7b1e2b; }
.rule-badge { font-weight: bold; color: #7b1e2b; }
.rule-note { display: block; font-size: 9pt; color: #444; margin-top: 2px; }
.tech { font-size: 8.5pt; color: #777; font-family: Consolas, monospace; }
.missing { color: #c00; }
.tcount { font-size: 9pt; color: #555; }
ol.tr { margin: 2px 0 0 16px; padding: 0; }
ol.tr li { margin: 1px 0; }
a { color: #1a4f8a; text-decoration: none; word-break: break-all; }
.small { font-size: 9pt; color: #555; }
.pagebreak { page-break-before: always; }
.gengrid { display: flex; gap: 10px; margin: 8px 0 4px; }
.gengrid div { border: 1px solid #ccc; padding: 5px 9px; background: #fafafa; font-size: 9.5pt; }
strong.big { font-size: 12pt; color: #7b1e2b; }
CSS;

$html = [];
$html[] = '<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8">';
$html[] = '<title>भक्ति सागर – डोमेन विशेषज्ञ सत्यापन रिपोर्ट</title>';
$html[] = '<style>' . $css . '</style></head><body>';

/* header */
$html[] = '<header>';
$html[] = '<h1>भक्ति सागर – गीत/श्लोक/आरती सूची: डोमेन विशेषज्ञ सत्यापन रिपोर्ट</h1>';
$html[] = '<div class="sub">Bhakti Sagar – Day-wise &amp; Category-wise Catalogue for Expert Verification &nbsp;|&nbsp; '
    . h(date('d M Y, H:i')) . '</div>';
$html[] = '<div class="gengrid">';
$html[] = '<div><strong class="big">कुल गीत: ' . count($tracks) . '</strong><br>'
    . 'श्लोक ' . $counts['shloka'] . ' · भजन ' . $counts['bhajan'] . ' · आरती ' . $counts['aarti'] . '</div>';
$html[] = '<div>नियम: <strong>' . count($rules) . '</strong> (वार ' . count($ruleGroups['var']['rules'])
    . ' · तिथि ' . count($ruleGroups['tithi']['rules']) . ' · त्योहार ' . count($ruleGroups['festival']['rules']) . ')</div>';
$html[] = '<div>दैनिक श्लोक: ' . count($daily_shlokas) . '<br>पंचांग दिन: ' . count($days) . ' (2026–2028)</div>';
$html[] = '<div>सभी YouTube वीडियो:<br>oEmbed + प्लेबैक परीक्षण से सत्यापित</div>';
$html[] = '</div>';
$html[] = '<p class="note">उपयोग विधि: प्रत्येक पंक्ति के अंत में ☐ बॉक्स में निशान लगाएँ। किसी भी नियम/गीत पर आपत्ति हो तो बॉक्स के बगल में टिप्पणी लिखें। '
    . '"स्रोत" कॉलम में दी गई संख्या ऐप में दिखने वाले श्लोक से मिलाई जा सकती है। YouTube लिंक पर क्लिक करके वीडियो चलाकर देखा जा सकता है।</p>';
$html[] = '</header>';

/* I. daily shlokas */
$html[] = '<h2>I. दैनिक श्लोक (रोटेशन में) <span class="cnt">— कुल ' . count($daily_shlokas) . '</span></h2>';
$html[] = '<table><thead><tr><th class="num">#</th><th>संस्कृत पाठ</th><th>स्रोत</th><th>भावार्थ</th><th class="ok">✓</th></tr></thead><tbody>';
foreach ($daily_shlokas as $i => $s) {
    $html[] = '<tr><td class="num">' . ($i + 1) . '</td>'
        . '<td>' . h($s['sanskrit']) . '<div class="small">' . h($s['translit']) . '</div></td>'
        . '<td>' . h($s['source']) . '</td>'
        . '<td>' . h($s['meaning_hi']) . '</td>'
        . '<td class="ok"><span class="box"></span></td></tr>';
}
$html[] = '</tbody></table>';

/* II. tracks by type */
$html[] = '<h2>II. गीत सूची – प्रकार अनुसार (Type-wise)</h2>';
foreach (['shloka', 'bhajan', 'aarti'] as $type) {
    $list = array_values(array_filter($tracks, fn($t) => $t['type'] === $type));
    $html[] = '<h3>' . $typeHi[$type] . ' <span class="cnt">(' . count($list) . ')</span></h3>';
    $html[] = '<table><thead><tr><th class="num">#</th><th>शीर्षक</th><th>English</th><th>देवता</th><th>गायक</th>'
        . '<th>समय-स्लॉट</th><th>YouTube</th><th class="ok">✓</th></tr></thead><tbody>';
    foreach ($list as $i => $t) {
        $html[] = '<tr><td class="num">' . ($i + 1) . '</td>'
            . '<td>' . h($t['title_hi']) . '<div class="tech">' . h($t['slug']) . '</div></td>'
            . '<td class="small">' . h($t['title_en']) . '</td>'
            . '<td>' . h($t['deity']) . '</td>'
            . '<td>' . h((string)$t['singer']) . '</td>'
            . '<td class="small">' . h(slotNames($t['slots'], $slotByLabel)) . '</td>'
            . '<td><a href="https://youtu.be/' . h($t['youtube_id']) . '">youtu.be/' . h($t['youtube_id']) . '</a></td>'
            . '<td class="ok"><span class="box"></span></td></tr>';
    }
    $html[] = '</tbody></table>';
}

/* III–V. rules */
$html[] = '<div class="pagebreak"></div>';
$html[] = '<h2>III. दिन-नियम – वार / तिथि-व्रत / त्योहार (Day-wise Rules)</h2>';
$html[] = '<p class="note">ये नियम बताते हैं कि किस दिन "आज विशेष" में कौन-से गीत दिखेंगे। त्योहार की तिथियाँ '
    . 'पंचांग-डेटा (2026–2027) से स्वतः निकाली गई हैं – कृपया दिनांक एवं वार का मिलान करें।</p>';

$sIdx = 0;
foreach ($groupOrder as $gtype) {
    $g = $ruleGroups[$gtype];
    $gLabel = ['var' => 'A. वार', 'tithi' => 'B. तिथि / व्रत', 'festival' => 'C. त्योहार'][$gtype];
    $html[] = '<h3>' . $gLabel . ' <span class="cnt">(' . count($g['rules']) . ' नियम)</span></h3>';
    $html[] = '<table><thead><tr><th class="num">#</th><th>नियम</th><th>टिप्पणी</th><th>चुने गए गीत (प्रकार सहित)</th>';
    if ($gtype === 'festival') { $html[] = '<th>2026–27 तिथियाँ</th>'; }
    if ($gtype === 'tithi') { $html[] = '<th>तिथि संख्या</th>'; }
    $html[] = '<th class="ok">✓</th></tr></thead><tbody>';
    foreach ($g['rules'] as $r) {
        $sIdx++;
        $matchLabel = $gtype === 'var'
            ? ($varHi[$r['match']] ?? $r['match'])
            : ($gtype === 'tithi' ? ($tithiHi[$r['match']] ?? $r['match']) : $r['match']);
        $html[] = '<tr><td class="num">' . $sIdx . '</td>';
        $html[] = '<td><span class="rule-badge">' . h($r['badge_hi']) . '</span>'
            . '<div class="tech">' . h($gtype . ':' . $r['match'])
            . ($gtype === 'var' ? ' → ' . h((string)($varHi[$r['match']] ?? '')) : '')
            . '</div></td>';
        $html[] = '<td class="small">' . h($r['note_hi']) . '</td>';
        $html[] = '<td><ol class="tr">';
        foreach ($r['tracks'] as $slug) {
            $html[] = '<li>' . trackTitleLine($slug, $trackBySlug, $typeHi) . '</li>';
        }
        $html[] = '</ol><div class="tcount">कुल ' . count($r['tracks']) . ' गीत</div></td>';
        if ($gtype === 'festival') {
            $html[] = '<td class="small">' . h(festDates($r['match'], $days, $festCatalog)) . '</td>';
        }
        if ($gtype === 'tithi') {
            $nums = $tithi_groups[$r['match']] ?? [];
            $html[] = '<td class="small">' . h(implode(', ', $nums)) . '</td>';
        }
        $html[] = '<td class="ok"><span class="box"></span></td></tr>';
    }
    $html[] = '</tbody></table>';
}

/* VI. time slots */
$html[] = '<div class="pagebreak"></div>';
$html[] = '<h2>IV. समय-स्लॉट अनुसार (Time-slot wise)</h2>';
$html[] = '<table><thead><tr><th class="num">#</th><th>स्लॉट</th><th>समय</th><th>इस समय चलने वाले गीत</th><th class="ok">✓</th></tr></thead><tbody>';
foreach ($slots as $i => $s) {
    $list = array_values(array_filter($tracks, fn($t) => in_array($s['key'], explode(',', $t['slots']), true)));
    $html[] = '<tr><td class="num">' . ($i + 1) . '</td>'
        . '<td><strong>' . h($s['label_hi']) . '</strong><div class="small">' . h($s['label_en']) . '</div></td>'
        . '<td>' . h($s['range']) . '</td>'
        . '<td><ol class="tr">';
    foreach ($list as $t) {
        $html[] = '<li>' . h($t['title_hi']) . ' <span class="tag type-' . h($t['type']) . '">' . $typeHi[$t['type']] . '</span></li>';
    }
    $html[] = '</ol><div class="tcount">कुल ' . count($list) . '</div></td>'
        . '<td class="ok"><span class="box"></span></td></tr>';
}
$html[] = '</tbody></table>';

$html[] = '<p class="note">हस्ताक्षर: ______________________ &nbsp;&nbsp; दिनांक: ____________ &nbsp;&nbsp; '
    . 'आपत्तियाँ/सुझाव (आवश्यक हो तो): ______________________________________________________</p>';
$html[] = '</body></html>';

$outDir = $root . '/docs';
if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}
$file = $outDir . '/bhakti-sagar-domain-verification.html';
file_put_contents($file, implode("\n", $html));
echo 'HTML written: ' . $file . ' (' . number_format(filesize($file)) . " bytes)\n";
