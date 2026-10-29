// Bhakti Sagar — Static API Shim for GitHub Pages
// Loads catalog.json, panchang, locations, computes suggest client-side

(function () {
  'use strict';

  window.__BS_STATIC_API__ = true;

  // Cache for loaded data
  var _catalog = null;
  var _locations = null;
  var _panchangCache = {};

  // --- small helpers ---
  function fetchJSON(url) {
    return fetch(url, { headers: { 'Accept': 'application/json' } })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); });
  }

  function basePath() {
    // GitHub Pages project site: /BhaktiSagar/
    var p = location.pathname;
    if (p.indexOf('/BhaktiSagar/') === 0) return '/BhaktiSagar';
    return '';
  }

  function loadCatalog() {
    if (_catalog) return Promise.resolve(_catalog);
    var url = basePath() + '/data/catalog.json';
    return fetchJSON(url).then(function (data) { _catalog = data; return data; });
  }

  function loadLocations() {
    if (_locations) return Promise.resolve(_locations);
    var url = basePath() + '/data/locations.json';
    return fetchJSON(url).then(function (data) { _locations = data; return data; });
  }

  function loadPanchang(cityKey) {
    cityKey = cityKey || 'new-delhi';
    if (_panchangCache[cityKey]) return Promise.resolve(_panchangCache[cityKey]);
    var url = (cityKey === 'new-delhi')
      ? basePath() + '/data/panchang.json'
      : basePath() + '/data/panchang/' + cityKey + '.json';
    return fetchJSON(url).then(function (data) {
      _panchangCache[cityKey] = data;
      return data;
    });
  }

  // --- logic ported from PHP API ---

  // slot_at: find current slot from minutes since midnight
  function slotAt(slots, minutes) {
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      var from = s.from | 0, to = s.to | 0;
      if (from <= to) {
        if (minutes >= from && minutes < to) return s;
      } else if (minutes >= from || minutes < to) {
        return s;
      }
    }
    return slots[0] || { key: 'brahma', label_hi: 'ब्रह्म मुहूर्त', label_en: 'Brahma Muhurta' };
  }

  // normalize shloka from catalog
  function pickShloka(shlokas, dayOfYear) {
    if (!shlokas || !shlokas.length) return null;
    return shlokas[dayOfYear % shlokas.length];
  }

  // day_matches logic (ported from PHP day_matches)
  function computeDayMatches(rules, panchang, tithiGroups, weekdayKey) {
    var festKeys = [];
    var tithi = null;
    var varKey = weekdayKey;
    if (panchang) {
      (panchang.festivals || []).forEach(function (f) { festKeys.push(f.key); });
      tithi = panchang.tithi | 0;
      varKey = panchang.var_key || weekdayKey;
    }
    var matches = [];
    rules.forEach(function (rule) {
      var hit = false;
      if (rule.rule_type === 'var') hit = rule.match_val === varKey;
      else if (rule.rule_type === 'tithi') {
        var group = tithiGroups[rule.match_val] || [];
        hit = tithi !== null && group.indexOf(tithi) !== -1;
      } else if (rule.rule_type === 'festival') {
        for (var i = 0; i < festKeys.length; i++) {
          if (rule.match_val && festKeys[i].indexOf(rule.match_val) !== -1) { hit = true; break; }
        }
      }
      if (!hit) return;
      var slugs = (rule.track_slugs || '').split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s; });
      if (!slugs.length) return;
      matches.push({
        type: rule.rule_type,
        badge_hi: rule.badge_hi,
        note_hi: rule.note_hi,
        priority: rule.priority | 0,
        tracks: slugs
      });
    });
    matches.sort(function (a, b) { return b.priority - a.priority; });
    return matches;
  }

  // normalize track (mirrors PHP normalize_track)
  function normalizeTrack(t) {
    return {
      slug: t.slug,
      title_hi: t.title_hi,
      title_en: t.title_en,
      title_gu: t.title_gu,
      type: t.type,
      deity: t.deity,
      singer: t.singer,
      youtube_id: t.youtube_id,
      slots: t.slots,
      tags: t.tags,
      blurb: t.blurb,
      sort_order: t.sort_order | 0,
      lyrics: t.lyrics | 0
    };
  }

  // --- main suggest function ---
  function suggest(cityKey, pinnedDate) {
    return Promise.all([
      loadCatalog(),
      loadLocations(),
      loadPanchang(cityKey)
    ]).then(function (results) {
      var catalog = results[0];
      var locations = results[1];
      var panchangData = results[2];

      var now = new Date();
      var istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
      var istNow = new Date(now.getTime() + istOffset);
      var minutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
      var dayOfYear = Math.floor((istNow - new Date(istNow.getUTCFullYear(), 0, 0)) / 86400000);

      // pick city
      var loc = null;
      var defaultKey = locations.default || 'new-delhi';
      if (cityKey) {
        loc = locations.locations.find(function (l) { return l.key === cityKey; });
      }
      if (!loc) loc = locations.locations.find(function (l) { return l.key === defaultKey; });
      if (!loc) loc = locations.locations[0];

      // panchang for date
      var dateKey = pinnedDate || istNow.toISOString().slice(0, 10);
      var panchangDay = (panchangData.days && panchangData.days[dateKey]) || null;
      var panchang = null;
      if (panchangDay) {
        var maps = { // from PHP hi_maps()
          vara_key: ['sun','mon','tue','wed','thu','fri','sat'],
          vara_hi: ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'],
          tithi_hi: ['प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','पूर्णिमा','प्रतिपदा','द्वितीया','तृतीया','चतुर्थी','पंचमी','षष्ठी','सप्तमी','अष्टमी','नवमी','दशमी','एकादशी','द्वादशी','त्रयोदशी','चतुर्दशी','अमावस्या'],
          nakshatra_hi: ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वाफाल्गुनी','उत्तराफाल्गुनी','हस्त','चित्रा','स्वाति','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती']
        };
        var varNum = panchangDay.var | 0;
        var tithi = panchangDay.tithi | 0;
        var nak = panchangDay.nakshatra | 0;
        panchang = {
          date: dateKey,
          var_num: varNum,
          var_key: maps.vara_key[varNum],
          var_hi: maps.vara_hi[varNum],
          tithi: tithi,
          tithi_hi: maps.tithi_hi[tithi - 1],
          paksha: panchangDay.paksha,
          paksha_hi: panchangDay.paksha === 'krishna' ? 'कृष्ण पक्ष' : 'शुक्ल पक्ष',
          nakshatra: nak,
          nakshatra_hi: maps.nakshatra_hi[nak],
          sunrise: panchangDay.sunrise,
          sunset: panchangDay.sunset,
          festivals: (panchangDay.festivals || []).map(function (slug) {
            var f = (panchangData.festivals || {})[slug];
            return { key: slug, hi: f?.hi || '', name: f?.name || '', cat: f?.cat || 'major' };
          }),
          source: 'json'
        };
      }

      var weekdayKey = (panchang && panchang.var_key) || maps.vara_key[(new Date(dateKey).getDay())];
      var dayMatches = computeDayMatches(catalog.day_rules, panchang, catalog.tithi_groups, weekdayKey);
      var currentSlotObj = slotAt(catalog.slots, minutes);

      return {
        ok: true,
        source: 'static',
        generated_at: new Date().toISOString(),
        now_ist: {
          date: istNow.toISOString().slice(0, 10),
          time: (istNow.getUTCHours() < 10 ? '0' : '') + istNow.getUTCHours() + ':' +
                (istNow.getUTCMinutes() < 10 ? '0' : '') + istNow.getUTCMinutes() + ':' +
                (istNow.getUTCSeconds() < 10 ? '0' : '') + istNow.getUTCSeconds(),
          weekday: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][istNow.getUTCDay()],
          day_of_year: dayOfYear
        },
        current_slot: currentSlotObj,
        slots: catalog.slots,
        shloka: pickShloka(catalog.shlokas, dayOfYear),
        locations: locations.locations.map(function (l) {
          return { key: l.key, name_hi: l.name_hi, name_en: l.name_en, country_hi: l.country_hi, country_en: l.country_en, timezone: l.timezone, is_default: l.key === defaultKey };
        }),
        location: { key: loc.key, name_hi: loc.name_hi, name_en: loc.name_en, country_hi: loc.country_hi, country_en: loc.country_en, timezone: loc.timezone },
        panchang: panchang,
        day_matches: dayMatches,
        jyotirlingas: catalog.jyotirlingas,
        tracks: catalog.tracks.map(normalizeTrack)
      };
    });
  }

  // Expose for app.js
  window.__bsStaticSuggest__ = suggest;

})();