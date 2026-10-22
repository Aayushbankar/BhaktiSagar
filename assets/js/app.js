/* =========================================================
   भक्ति सागर — front-end
   vanilla JS, no build step, mobile first
   ========================================================= */
(function () {
  'use strict';

  var CITY_KEY = 'bs.city';
  var CITY_KEY_AUTO = 'bs.cityAuto';

  // Reading preferences for the /track/{slug} lyrics panel (localStorage only).
  var LYRIC_TRANSLIT_KEY = 'bs.lyrics.translit';
  var LYRIC_MEANING_KEY = 'bs.lyrics.meaning';
  var LYRIC_SIZE_KEY = 'bs.lyrics.size';
  var LYRIC_SIZES = [0.95, 1.1, 1.3, 1.5];   // rem
  var LYRIC_SIZE_DEFAULT = 1;

  // Route handed over by index.php: {kind, lang, path, track, festival, date, notFound}.
  var route = window.__ROUTE__ || {};
  var routeTrack = route.track || '';
  var routeNotFound = !!route.notFound;
  var routeScrolled = false;

  // UI language: the chrome strings are embedded by index.php (lib/i18n.php).
  var lang = (route.lang === 'en' || route.lang === 'sa') ? route.lang : 'hi';
  var strings = window.__I18N__ || {};

  // Note: deliberately not named `t` — every card loop uses `t` for the track.
  function str(key, vars) {
    var s = strings[key];
    if (typeof s !== 'string') { s = key; }
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  /** Catalogue payloads only carry hi/en names; Sanskrit falls back to hi. */
  function locLang() { return lang === 'en' ? 'en' : 'hi'; }

  function trackTitle(tr) {
    if (!tr) { return ''; }
    if (lang === 'en' && tr.title_en) { return tr.title_en; }
    return tr.title_hi || tr.title_en || '';
  }

  function slotLabel(s) {
    if (!s) { return ''; }
    if (lang === 'en' && s.label_en) { return s.label_en; }
    return s.label_hi || s.label_en || s.key || '';
  }

  function festName(f) {
    if (!f) { return ''; }
    if (lang === 'en' && f.name) { return f.name; }
    return f.hi || f.name || f.key || '';
  }

  // optional ?date=YYYY-MM-DD preview (pin the panchang day, used for testing)
  // optional ?city=<key>      (pin the location, used for sharing/testing)
  var pinnedDate = '';
  var pinnedCity = '';
  try {
    var qs = new URLSearchParams(window.location.search);
    var pin = qs.get('date') || route.date || '';
    if (pin && /^\d{4}-\d{2}-\d{2}$/.test(pin)) { pinnedDate = pin; }
    var pc = qs.get('city');
    if (pc && /^[a-z0-9\-]{1,40}$/.test(pc)) { pinnedCity = pc; }
  } catch (e) { /* old browser – ignore */ }

  function apiUrl(city) {
    var q = ['action=suggest'];
    if (pinnedDate) { q.push('date=' + encodeURIComponent(pinnedDate)); }
    if (city) { q.push('city=' + encodeURIComponent(city)); }
    // Pretty URLs (/track/x) change the document base, so always ask from the
    // site root that index.php hands us in window.__ROUTE__.base.
    return (route.base || '') + '/api/?' + q.join('&');
  }

  var state = {
    slots: [],
    tracks: [],
    shloka: null,
    panchang: null,
    locations: [],
    location: null,
    city: '',
    cityAuto: false,
    dayMatches: [],
    specialTracks: [],
    specialSet: {},
    jyotirlingas: [],
    jyoLive: [],
    jyoRenderedKey: '',
    currentSlot: null,
    slotFilter: 'auto',
    typeFilter: 'all',
    query: '',
    queue: [],
    queueIndex: -1,
    filtered: [],
    ytReady: false,
    ytPlayer: null,
    pendingVideoId: null,
    playing: false,
    muted: false,
    errorStreak: 0,
    booted: false
  };

  var el = {};

  /* ---------------- helpers ---------------- */

  function $(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function ytThumb(id) {
    return 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
  }

  function ytWatchUrl(id) {
    return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
  }

  function ytSearchUrl(title) {
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(title + ' bhajan aarti');
  }

  function fmtTime(timeZone, seconds) {
    var opts = { timeZone: timeZone, hour: '2-digit', minute: '2-digit', hour12: false };
    if (seconds) { opts.second = '2-digit'; }
    try { return new Intl.DateTimeFormat('en-GB', opts).format(new Date()); }
    catch (e) { return '--:--'; }
  }

  function istMinutes() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === 'hour') { h = parseInt(p.value, 10) % 24; }
        if (p.type === 'minute') { m = parseInt(p.value, 10); }
      });
      return h * 60 + m;
    } catch (e) {
      var d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    }
  }

  function slotAtMinutes(mins) {
    for (var i = 0; i < state.slots.length; i++) {
      var s = state.slots[i];
      var from = s.from, to = s.to;
      if (typeof from !== 'number') { continue; }
      if (from <= to) {
        if (mins >= from && mins < to) { return s.key; }
      } else if (mins >= from || mins < to) {
        return s.key;
      }
    }
    return state.slots.length ? state.slots[0].key : null;
  }

  function slotByKey(key) {
    for (var i = 0; i < state.slots.length; i++) {
      if (state.slots[i].key === key) { return state.slots[i]; }
    }
    return null;
  }

  function typeLabel(type) {
    if (type === 'live') { return str('type.live'); }
    var known = (type === 'shloka' || type === 'bhajan' || type === 'aarti') ? type : 'bhajan';
    return str('type.' + known);
  }

  function playGlyph(isPlaying) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      (isPlaying
        ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>') +
      '</svg>';
  }

  /* ---------------- city / location (location-aware panchang) ---------------- */

  function storeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function storeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function validCity(key) {
    if (!key) { return false; }
    for (var i = 0; i < state.locations.length; i++) {
      if (state.locations[i].key === key) { return true; }
    }
    return false;
  }

  function defaultCityKey() {
    for (var i = 0; i < state.locations.length; i++) {
      if (state.locations[i].is_default) { return state.locations[i].key; }
    }
    return state.locations.length ? state.locations[0].key : '';
  }

  /**
   * Pick the starting city: an explicit stored choice wins, otherwise the
   * first catalogue city sharing the browser's IANA timezone, otherwise the
   * default (New Delhi).
   */
  function pickInitialCity() {
    var stored = storeGet(CITY_KEY);
    if (validCity(stored)) { return { key: stored, auto: false }; }

    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    if (tz) {
      for (var i = 0; i < state.locations.length; i++) {
        if (state.locations[i].timezone === tz) {
          return { key: state.locations[i].key, auto: true };
        }
      }
    }
    return { key: defaultCityKey(), auto: false };
  }

  function cityByKey(key) {
    for (var i = 0; i < state.locations.length; i++) {
      if (state.locations[i].key === key) { return state.locations[i]; }
    }
    return null;
  }

  function cityLabel(loc, lang) {
    if (!loc) { return ''; }
    var name = (lang === 'en' && loc.name_en) ? loc.name_en : (loc.name_hi || loc.name_en);
    var country = (lang === 'en' && loc.country_en) ? loc.country_en : (loc.country_hi || loc.country_en || '');
    return country ? name + ', ' + country : name;
  }

  function renderCityPicker() {
    if (!el.citySelect) { return; }
    var html = '';
    state.locations.forEach(function (loc) {
      html += '<option value="' + esc(loc.key) + '"' +
        (loc.key === state.city ? ' selected' : '') + '>' +
        esc(cityLabel(loc, locLang())) + '</option>';
    });
    el.citySelect.innerHTML = html;
    el.citySelect.disabled = !state.locations.length;
  }

  function setCity(key) {
    if (!validCity(key) || key === state.city) { return; }
    pinnedCity = '';          // an explicit choice beats a ?city= pin
    state.city = key;
    state.cityAuto = false;
    storeSet(CITY_KEY, key);
    storeSet(CITY_KEY_AUTO, '0');
    renderCityPicker();
    loadSuggest();
  }

  /* ---------------- clock & dates ---------------- */

  function renderClock() {
    el.clockIst.textContent = fmtTime('Asia/Kolkata', true);
    el.clockLocal.textContent = fmtTime(Intl.DateTimeFormat().resolvedOptions().timeZone || 'local', false);
  }

  function renderDates() {
    var now = new Date();
    var hiLine = '';
    var enLine = '';
    try {
      hiLine = new Intl.DateTimeFormat('hi-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
    } catch (e) { hiLine = now.toDateString(); }
    try {
      var saka = new Intl.DateTimeFormat('hi-IN-u-ca-indian', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
      hiLine += ' · ' + saka + ' ' + str('dateline.saka');
    } catch (e) { /* calendar not supported */ }
    try {
      enLine = new Intl.DateTimeFormat('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
    } catch (e) { enLine = now.toDateString(); }
    try {
      var sakaEn = new Intl.DateTimeFormat('en-IN-u-ca-indian', {
        day: 'numeric', month: 'long', year: 'numeric'
      }).format(now);
      enLine += ' · Saka ' + sakaEn;
    } catch (e) { /* ignore */ }

    // The big line is the page language; the other one stays as a second line.
    el.dateHi.textContent = lang === 'en' ? enLine : hiLine;
    el.dateEn.textContent = lang === 'en' ? hiLine : enLine;
  }

  function updateCurrentSlot() {
    state.currentSlot = slotAtMinutes(istMinutes());
    var slot = slotByKey(state.currentSlot);
    if (slot) {
      el.slotPillText.textContent = slotLabel(slot) + ' · ' + slot.range;
    }
    if (state.booted) {
      applyFilters();
    }
  }

  /* ---------------- shloka ---------------- */

  function renderShloka() {
    var s = state.shloka;
    if (!s) { return; }
    el.shlokaText.textContent = s.sanskrit || '';
    el.shlokaTranslit.textContent = s.translit || '';
    el.shlokaMeaning.textContent = s.meaning_hi || '';
    el.shlokaSource.textContent = s.source || '';
  }

  /* ---------------- panchang strip ---------------- */

  function renderPanchang() {
    var p = state.panchang;
    if (!p) {
      el.panchangStrip.hidden = true;
      syncNav();
      return;
    }
    el.panchangStrip.hidden = false;
    syncNav();
    el.pcVar.textContent = p.var_hi || '–';
    el.pcTithi.textContent = ((p.paksha_hi ? p.paksha_hi + ' ' : '') + (p.tithi_hi || '')).trim() || '–';
    el.pcNak.textContent = p.nakshatra_hi || '–';
    el.pcRise.textContent = p.sunrise || '–';
    el.pcSet.textContent = p.sunset || '–';

    var fests = p.festivals || [];
    if (fests.length) {
      el.festRow.hidden = false;
      var html = '<span class="fest-label">' + esc(str('panchang.festLabel')) + '</span>';
      fests.forEach(function (f) {
        var name = festName(f);
        html += '<span class="fest-chip cat-' + esc(f.cat || 'major') + '">' + esc(name) + '</span>';
      });
      el.festRow.innerHTML = html;
    } else {
      el.festRow.hidden = true;
      el.festRow.innerHTML = '';
    }

    // the location note must survive a festival-free day
    renderPanchangNote();
  }

  function renderPanchangNote() {
    if (!el.panchangNote) { return; }
    var loc = state.location;
    if (!loc) { el.panchangNote.hidden = true; return; }
    var txt = str('panchang.note', { city: cityLabel(loc, locLang()) });
    if (state.cityAuto) {
      txt += str('panchang.noteAuto');
    }
    el.panchangNote.textContent = txt;
    el.panchangNote.hidden = false;
  }

  /* ---------------- आज विशेष (panchang suggestions) ---------------- */

  function resolveSpecial() {
    var bySlug = {};
    state.tracks.forEach(function (t) { bySlug[t.slug] = t; });

    var seen = {};
    state.specialTracks = [];
    state.specialSet = {};
    state.dayMatches.forEach(function (m) {
      m.tracks.forEach(function (slug) {
        var t = bySlug[slug];
        if (t && !seen[slug]) {
          seen[slug] = true;
          state.specialTracks.push(t);
          state.specialSet[slug] = true;
        }
      });
    });
  }

  function renderSpecial() {
    var matches = state.dayMatches || [];
    if (!matches.length || !state.specialTracks.length) {
      el.specialSection.hidden = true;
      syncNav();
      return;
    }
    el.specialSection.hidden = false;
    syncNav();

    var ruleHtml = '';
    matches.forEach(function (m) {
      ruleHtml += '<li class="rule-item rule-' + esc(m.type) + '">' +
        '<span class="rule-badge">' + esc(m.badge_hi) + '</span>' +
        (m.note_hi ? '<span class="rule-note">' + esc(m.note_hi) + '</span>' : '') +
      '</li>';
    });
    el.ruleList.innerHTML = ruleHtml;

    var html = '';
    state.specialTracks.forEach(function (t, i) {
      var playing = state.playing && state.queueIndex >= 0 && state.queue[state.queueIndex] &&
        state.queue[state.queueIndex].slug === t.slug;
      html += '<article class="track-card is-special' + (playing ? ' is-playing' : '') + '" data-sindex="' + i + '">' +
        '<div class="thumb">' +
          '<span class="badge badge-special">' + esc(str('grid.specialTag')) + '</span>' +
          '<span class="badge badge-' + esc(t.type) + '">' + esc(typeLabel(t.type)) + '</span>' +
          (t.youtube_id
            ? '<img src="' + esc(ytThumb(t.youtube_id)) + '" alt="' + esc(trackTitle(t)) + '" loading="lazy" decoding="async">'
            : '') +
          '<button type="button" class="play-fab" data-splay="' + i + '" aria-label="' +
            esc(playing ? str('card.pause') : str('card.play')) + esc(trackTitle(t)) + '">' +
            playGlyph(playing) +
          '</button>' +
        '</div>' +
        '<div class="track-body">' +
          '<h3 class="track-title">' + esc(trackTitle(t)) + '</h3>' +
          '<p class="track-blurb">' + esc(t.blurb) + '</p>' +
          '<div class="track-meta">' +
            '<span class="deity">' + esc(t.deity) + (t.singer ? ' · ' + esc(t.singer) : '') + '</span>' +
            '<span class="now-tag">' + esc(str('special.nowTag')) + '</span>' +
            (t.lyrics ? '<a class="card-lyrics" href="' + esc(trackHref(t.slug)) + '">' +
              esc(str('track.lyrics')) + '</a>' : '') +
          '</div>' +
        '</div>' +
      '</article>';
    });
    el.specialGrid.innerHTML = html;
  }

  /* ---------------- ज्योतिर्लिंग लाइव दर्शन ---------------- */

  function jyoName(j) {
    if (lang === 'en' && j.name_en) { return j.name_en; }
    return j.name_hi || j.name_en || '';
  }

  function jyoPlace(j) {
    if (lang === 'en' && j.place_en) { return j.place_en; }
    return j.place_hi || j.place_en || '';
  }

  /** The player only ever knows catalogue slugs, so a darshan gets its own. */
  function jyoTrack(j) {
    var name = jyoName(j);
    return {
      slug: 'live-' + j.slug,
      title_hi: (j.name_hi || name) + ' · ' + str('type.live'),
      title_en: (j.name_en || name) + ' · ' + str('type.live'),
      type: 'live',
      deity: jyoPlace(j),
      singer: j.channel || '',
      youtube_id: j.youtube_id,
      slots: [],
      tags: '',
      blurb: '',
      lyrics: 0
    };
  }

  function jyoCardHtml(j, i) {
    var name = jyoName(j);
    var place = jyoPlace(j);
    return '<article class="track-card is-jyo" data-jindex="' + i + '">' +
      '<div class="thumb">' +
        '<span class="badge badge-live">' + esc(str('jyo.live')) + '</span>' +
        '<img src="' + esc(ytThumb(j.youtube_id)) + '" alt="' + esc(name) + '" loading="lazy" decoding="async">' +
        '<div class="jyo-preview" data-preview="' + esc(j.youtube_id) + '" data-name="' + esc(name) + '"></div>' +
        '<button type="button" class="play-fab" data-jplay="' + i + '" aria-label="' +
          esc(str('jyo.play', { name: name })) + '">' +
          playGlyph(false) +
        '</button>' +
      '</div>' +
      '<div class="track-body">' +
        '<h3 class="track-title">' + esc(name) + '</h3>' +
        '<div class="track-meta">' +
          '<span class="deity">' + esc(place) + (j.channel ? ' · ' + esc(j.channel) : '') + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  /** Every live card carries its own muted, autoplaying stream from page load. */
  function mountJyoPreview(box) {
    if (!box || box.getAttribute('data-mounted') === '1') { return; }
    var id = box.getAttribute('data-preview') || '';
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) { return; }
    box.setAttribute('data-mounted', '1');
    var frame = document.createElement('iframe');
    frame.title = box.getAttribute('data-name') || 'Live darshan';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.src = 'https://www.youtube.com/embed/' + id +
      '?autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1&rel=0&enablejsapi=1&origin=' +
      encodeURIComponent(window.location.origin);
    box.appendChild(frame);
  }

  function mountJyoPreviews() {
    if (!el.jyoGrid) { return; }
    el.jyoGrid.querySelectorAll('.jyo-preview').forEach(mountJyoPreview);
  }

  /** Muted previews pause with the tab so background streams don't burn data. */
  function jyoPreviewCommand(func) {
    var frames = document.querySelectorAll('.jyo-preview iframe');
    for (var i = 0; i < frames.length; i += 1) {
      try {
        frames[i].contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: func, args: [] }), '*');
      } catch (e) { /* cross-origin frame – ignore */ }
    }
  }

  function updateJyoPlaying() {
    if (!el.jyoGrid) { return; }
    el.jyoGrid.querySelectorAll('.track-card').forEach(function (card) {
      var i = parseInt(card.getAttribute('data-jindex'), 10);
      var t = state.jyoLive[i];
      var playing = !!(t && state.playing && state.queueIndex >= 0 &&
        state.queue[state.queueIndex] &&
        state.queue[state.queueIndex].slug === jyoTrack(t).slug);
      card.classList.toggle('is-playing', playing);
      var btn = card.querySelector('.play-fab');
      if (!btn) { return; }
      var name = jyoName(t);
      btn.innerHTML = playGlyph(playing);
      btn.setAttribute('aria-label',
        playing ? str('card.pause') + name : str('jyo.play', { name: name }));
    });
  }

  function renderJyo() {
    if (!el.jyoSection || !el.jyoGrid) { return; }
    var items = (state.jyotirlingas || []).filter(function (j) { return !!j.youtube_id; });
    state.jyoLive = items;
    if (!items.length) { el.jyoSection.hidden = true; syncNav(); return; }
    el.jyoSection.hidden = false;
    syncNav();

    // the live set rarely changes, but renderJyo also runs on every play-state
    // flip — rebuilding the grid then would restart all six preview streams
    var key = items.map(function (j) { return j.youtube_id; }).join(',');
    if (state.jyoRenderedKey !== key) {
      state.jyoRenderedKey = key;
      var html = '';
      items.forEach(function (j, i) { html += jyoCardHtml(j, i); });
      el.jyoGrid.innerHTML = html;
      mountJyoPreviews();
    }
    updateJyoPlaying();
  }

  /* ---------------- chips ---------------- */

  function renderChips() {
    var slotHtml = '';
    slotHtml += '<button type="button" class="chip' + (state.slotFilter === 'auto' ? ' active' : '') +
      '" data-slot="auto" aria-pressed="' + (state.slotFilter === 'auto') + '">' +
      esc(str('chips.now')) + '<small>' + esc(str('chips.nowSub')) + '</small></button>';
    slotHtml += '<button type="button" class="chip' + (state.slotFilter === 'all' ? ' active' : '') +
      '" data-slot="all" aria-pressed="' + (state.slotFilter === 'all') + '">' +
      esc(str('chips.allDay')) + '<small>' + esc(str('chips.allDaySub')) + '</small></button>';

    state.slots.forEach(function (s) {
      var active = state.slotFilter === s.key;
      slotHtml += '<button type="button" class="chip' + (active ? ' active' : '') +
        '" data-slot="' + esc(s.key) + '" aria-pressed="' + active + '">' +
        esc(slotLabel(s)) + '<small>' + esc(s.range) + '</small></button>';
    });
    el.slotChips.innerHTML = slotHtml;

    var counts = { all: 0, shloka: 0, bhajan: 0, aarti: 0 };
    state.tracks.forEach(function (t) {
      if (passesBase(t)) {
        counts.all++;
        counts[t.type] = (counts[t.type] || 0) + 1;
      }
    });

    var types = [
      { key: 'all', label: str('chips.all') },
      { key: 'shloka', label: str('type.shloka') },
      { key: 'bhajan', label: str('type.bhajan') },
      { key: 'aarti', label: str('type.aarti') }
    ];
    var typeHtml = '';
    types.forEach(function (t) {
      var active = state.typeFilter === t.key;
      typeHtml += '<button type="button" class="chip' + (active ? ' active' : '') +
        '" data-type="' + t.key + '" aria-pressed="' + active + '">' +
        t.label + ' (' + (counts[t.key] || 0) + ')</button>';
    });
    el.typeChips.innerHTML = typeHtml;
  }

  /* ---------------- filtering ---------------- */

  function activeSlotKey() {
    return state.slotFilter === 'auto' ? state.currentSlot : state.slotFilter;
  }

  function activeSlotLabel() {
    var key = activeSlotKey();
    var found = null;
    (state.slots || []).forEach(function (s) { if (s.key === key) { found = s; } });
    return found ? slotLabel(found) : '';
  }

  /* everything except the type chip: slot + search (shared by chips count & grid) */
  function passesBase(t) {
    if (state.slotFilter !== 'all') {
      var slots = t.slots || [];
      if (slots.indexOf(activeSlotKey()) === -1) { return false; }
    }
    var q = state.query.trim().toLowerCase();
    if (q) {
      var hay = [t.title_hi, t.title_en, t.deity, t.singer, t.tags, t.blurb].join(' ').toLowerCase();
      if (hay.indexOf(q) === -1) { return false; }
    }
    return true;
  }

  function applyFilters() {
    renderChips();

    state.filtered = state.tracks.filter(function (t) {
      if (state.typeFilter !== 'all' && t.type !== state.typeFilter) { return false; }
      return passesBase(t);
    });

    renderGrid();
    el.resultCount.textContent = str('search.results', { n: state.filtered.length });
  }

  /* ---------------- grid ---------------- */

  function renderGrid() {
    if (!state.filtered.length) {
      var notFound = {
        shloka: str('empty.shloka'),
        bhajan: str('empty.bhajan'),
        aarti: str('empty.aarti'),
        all: str('empty.all')
      };
      var what = notFound[state.typeFilter] || notFound.all;
      var msg = state.query.trim()
        ? str('empty.query', { q: esc(state.query.trim()) })
        : (state.slotFilter === 'all'
          ? str('empty.slotAll', { what: what })
          : str('empty.slot', { slot: esc(activeSlotLabel()), what: what }));
      el.trackGrid.innerHTML = '<div class="empty-state">' + msg + '</div>';
      return;
    }

    var html = '';
    state.filtered.forEach(function (t, i) {
      var slotKey = activeSlotKey();
      var inSlot = (t.slots || []).indexOf(slotKey) !== -1;
      var playing = state.playing && state.queueIndex >= 0 && state.queue[state.queueIndex] &&
        state.queue[state.queueIndex].slug === t.slug;

      html += '<article class="track-card' + (playing ? ' is-playing' : '') +
        (routeTrack && t.slug === routeTrack ? ' is-focused' : '') +
        '" data-index="' + i + '">' +
        '<div class="thumb">' +
          '<span class="badge badge-' + esc(t.type) + '">' + esc(typeLabel(t.type)) + '</span>' +
          (t.youtube_id
            ? '<img src="' + esc(ytThumb(t.youtube_id)) + '" alt="' + esc(trackTitle(t)) + '" loading="lazy" decoding="async">'
            : '') +
          '<button type="button" class="play-fab" data-play="' + i + '" aria-label="' +
            esc(playing ? str('card.pause') : str('card.play')) + esc(trackTitle(t)) + '">' +
            playGlyph(playing) +
          '</button>' +
        '</div>' +
        '<div class="track-body">' +
          '<h3 class="track-title">' + esc(trackTitle(t)) + '</h3>' +
          '<p class="track-blurb">' + esc(t.blurb) + '</p>' +
          '<div class="track-meta">' +
            '<span class="deity">' + esc(t.deity) + (t.singer ? ' · ' + esc(t.singer) : '') + '</span>' +
            (state.specialSet[t.slug] ? '<span class="special-tag">' + esc(str('grid.specialTag')) + '</span>' : '') +
            (inSlot && state.slotFilter !== 'all'
              ? '<span class="now-tag">' + esc(str('grid.nowTag')) + '</span>'
              : '<span>' + esc(typeLabel(t.type)) + '</span>') +
            (t.lyrics ? '<a class="card-lyrics" href="' + esc(trackHref(t.slug)) + '">' +
              esc(str('track.lyrics')) + '</a>' : '') +
          '</div>' +
        '</div>' +
      '</article>';
    });
    el.trackGrid.innerHTML = html;
  }

  /* ---------------- queue ---------------- */

  function buildQueue(startIndex) {
    state.queue = state.filtered.slice();
    state.queueIndex = startIndex;
    renderQueue();
  }

  function renderQueue() {
    if (!state.queue.length) {
      el.queueList.innerHTML = '<li class="queue-empty">' + esc(str('queue.empty')) + '</li>';
      el.queueCount.textContent = '0';
      return;
    }
    el.queueCount.textContent = state.queue.length;
    var html = '';
    state.queue.forEach(function (t, i) {
      html += '<li class="queue-item' + (i === state.queueIndex ? ' active' : '') + '" data-q="' + i + '">' +
        '<span class="q-index">' + (i + 1) + '</span>' +
        '<span class="q-title">' + esc(trackTitle(t)) + '</span>' +
      '</li>';
    });
    el.queueList.innerHTML = html;
  }

  /* ---------------- YouTube player ---------------- */

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) { state.ytReady = true; return; }
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    var first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);
  }

  window.onYouTubeIframeAPIReady = function () {
    state.ytReady = true;
    if (state.pendingVideoId) {
      var vid = state.pendingVideoId;
      state.pendingVideoId = null;
      playVideoId(vid, true);
    }
  };

  function playVideoId(videoId, autoplay) {
    if (!state.ytReady || !window.YT || !window.YT.Player) {
      state.pendingVideoId = videoId;
      loadYouTubeApi();
      return;
    }

    if (state.ytPlayer && typeof state.ytPlayer.loadVideoById === 'function') {
      if (autoplay) { state.ytPlayer.loadVideoById(videoId); }
      else { state.ytPlayer.cueVideoById(videoId); }
      return;
    }

    el.playerPlaceholder.hidden = true;
    el.ytPlayerHost.hidden = false;
    el.ytPlayerHost.innerHTML = '<div id="ytPlayerBox"></div>';

    state.ytPlayer = new window.YT.Player('ytPlayerBox', {
      videoId: videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        autoplay: autoplay ? 1 : 0,
        mute: state.muted ? 1 : 0,
        origin: window.location.origin
      },
      events: {
        onReady: function () {
          if (state.muted && typeof state.ytPlayer.mute === 'function') { state.ytPlayer.mute(); }
          applyMuteUI();
          setPlaying(true);
        },
        onStateChange: function (event) {
          var YT = window.YT;
          if (!YT) { return; }
          if (event.data === YT.PlayerState.PLAYING) { state.errorStreak = 0; setPlaying(true); }
          if (event.data === YT.PlayerState.PAUSED) { setPlaying(false); }
          if (event.data === YT.PlayerState.ENDED) { state.errorStreak = 0; nextTrack(); }
        },
        onError: function () {
          setPlaying(false);
          state.errorStreak += 1;
          if (state.queue.length && state.errorStreak < state.queue.length) {
            el.nowMeta.textContent = str('player.errorSkip');
            setTimeout(nextTrack, 900);
          } else {
            state.errorStreak = 0;
            el.nowMeta.textContent = str('player.errorNone');
          }
        }
      }
    });
  }

  function setHidden(node, flag) {
    if (!node) { return; }
    if (flag) { node.setAttribute('hidden', ''); } else { node.removeAttribute('hidden'); }
  }

  function applyMuteUI() {
    setHidden(el.iconSoundOn, state.muted);
    setHidden(el.iconSoundOff, !state.muted);
    setHidden(el.miniIconSoundOn, state.muted);
    setHidden(el.miniIconSoundOff, !state.muted);
    var label = str(state.muted ? 'player.unmute' : 'player.mute');
    [el.btnSound, el.miniSound].forEach(function (btn) {
      if (!btn) { return; }
      btn.setAttribute('data-muted', state.muted ? '1' : '0');
      btn.classList.toggle('is-muted', state.muted);
      btn.setAttribute('aria-pressed', state.muted ? 'true' : 'false');
      btn.setAttribute('aria-label', label);
    });
  }

  function setMuted(muted) {
    state.muted = !!muted;
    if (state.ytPlayer) {
      if (state.muted && typeof state.ytPlayer.mute === 'function') { state.ytPlayer.mute(); }
      else if (!state.muted && typeof state.ytPlayer.unMute === 'function') { state.ytPlayer.unMute(); }
    }
    applyMuteUI();
  }

  /** Quick-links/footer anchors only point at sections that are actually shown. */
  function syncNav() {
    if (!el.navBits || !el.navBits.length) { return; }
    el.navBits.forEach(function (link) {
      var target = document.getElementById(link.getAttribute('data-nav'));
      if (!target) { return; }
      if (target.hidden) { link.setAttribute('hidden', ''); } else { link.removeAttribute('hidden'); }
    });
  }

  /** The quick-nav sticks right below the top bar, whose height wraps on mobile. */
  function updateTopbarH() {
    if (!el.topbar) { return; }
    document.documentElement.style.setProperty('--topbar-h', el.topbar.offsetHeight + 'px');
  }

  function setPlaying(flag) {
    state.playing = flag;
    // muted card previews yield bandwidth to whatever the main player plays
    jyoPreviewCommand(flag ? 'pauseVideo' : 'playVideo');
    setHidden(el.iconPlay, flag);
    setHidden(el.iconPause, !flag);
    setHidden(el.miniIconPlay, flag);
    setHidden(el.miniIconPause, !flag);
    renderGrid();
    renderSpecial();
    renderJyo();
    renderTrackDetail();
  }

  function playAt(index, autoplay) {
    if (index < 0 || index >= state.queue.length) { return; }
    var track = state.queue[index];
    state.queueIndex = index;

    el.nowTitle.textContent = trackTitle(track);
    el.nowMeta.textContent = [track.deity, track.singer, typeLabel(track.type)].filter(Boolean).join(' · ');
    el.miniTitle.textContent = trackTitle(track);
    el.miniSub.textContent = track.deity || str('mini.sub');
    el.miniBar.hidden = false;
    document.body.classList.add('has-mini-bar');

    if (track.youtube_id) {
      el.btnOpenYt.href = ytWatchUrl(track.youtube_id);
      // Live temple streams always come in muted (browser autoplay policy +
      // no surprise audio); the sound button unmutes them in one tap.
      if (track.type === 'live') { setMuted(true); }
      playVideoId(track.youtube_id, autoplay !== false);
    } else {
      window.open(ytSearchUrl(track.title_en || track.title_hi), '_blank', 'noopener');
    }

    renderQueue();
    renderGrid();
    renderSpecial();
    renderJyo();
  }

  function togglePlay() {
    if (state.queueIndex < 0) {
      if (state.filtered.length) { buildQueue(0); playAt(0, true); }
      return;
    }
    if (!state.ytPlayer) {
      playAt(state.queueIndex, true);
      return;
    }
    var YT = window.YT;
    if (state.playing) {
      state.ytPlayer.pauseVideo();
      if (YT) { setPlaying(false); }
    } else {
      state.ytPlayer.playVideo();
    }
  }

  function nextTrack() {
    if (!state.queue.length) { return; }
    playAt((state.queueIndex + 1) % state.queue.length, true);
  }

  function prevTrack() {
    if (!state.queue.length) { return; }
    playAt((state.queueIndex - 1 + state.queue.length) % state.queue.length, true);
  }

  /* ---------------- track detail (/track/{slug}) ---------------- */

  function lyricPrefs() {
    var n = parseInt(storeGet(LYRIC_SIZE_KEY), 10);
    if (isNaN(n) || n < 0 || n >= LYRIC_SIZES.length) { n = LYRIC_SIZE_DEFAULT; }
    return {
      translit: storeGet(LYRIC_TRANSLIT_KEY) === '1',
      meaning: storeGet(LYRIC_MEANING_KEY) === '1',
      size: n
    };
  }

  function applyLyricPrefs() {
    if (!el.lyricsBody) { return; }
    var p = lyricPrefs();
    el.lyricsBody.classList.toggle('show-translit', p.translit);
    el.lyricsBody.classList.toggle('show-meaning', p.meaning);
    el.lyricsBody.style.setProperty('--lyric-size', LYRIC_SIZES[p.size] + 'rem');
    if (el.tgTranslit) { el.tgTranslit.setAttribute('aria-pressed', p.translit ? 'true' : 'false'); }
    if (el.tgMeaning) { el.tgMeaning.setAttribute('aria-pressed', p.meaning ? 'true' : 'false'); }
  }

  function stepLyricSize(delta) {
    var p = lyricPrefs();
    var next = Math.min(LYRIC_SIZES.length - 1, Math.max(0, p.size + delta));
    if (next === p.size) { return; }
    storeSet(LYRIC_SIZE_KEY, String(next));
    applyLyricPrefs();
  }

  function initLyrics() {
    if (!el.lyricsBody) { return; }
    applyLyricPrefs();

    if (el.tgTranslit) {
      el.tgTranslit.addEventListener('click', function () {
        storeSet(LYRIC_TRANSLIT_KEY, lyricPrefs().translit ? '0' : '1');
        applyLyricPrefs();
      });
    }
    if (el.tgMeaning) {
      el.tgMeaning.addEventListener('click', function () {
        storeSet(LYRIC_MEANING_KEY, lyricPrefs().meaning ? '0' : '1');
        applyLyricPrefs();
      });
    }
    if (el.fontDec) { el.fontDec.addEventListener('click', function () { stepLyricSize(-1); }); }
    if (el.fontInc) { el.fontInc.addEventListener('click', function () { stepLyricSize(1); }); }
  }

  /** Keep the track page's play button in step with the player. */
  function renderTrackDetail() {
    if (!routeTrack || !el.trackPlayBtn) { return; }
    var current = state.queueIndex >= 0 ? state.queue[state.queueIndex] : null;
    var playing = !!(current && current.slug === routeTrack && state.playing);
    el.trackPlayBtn.classList.toggle('is-playing', playing);
    var label = el.trackPlayBtn.querySelector('span');
    if (label) { label.textContent = playing ? str('card.pause').trim() : str('track.play'); }
  }

  /** Play the track this page is about: focus it in the grid, then queue it. */
  function playRouteTrack() {
    if (!routeTrack) { return; }
    applyRoute();
    var target = null;
    state.tracks.forEach(function (t) { if (t.slug === routeTrack) { target = t; } });
    if (!target) { return; }
    var pos = state.filtered.indexOf(target);
    if (pos === -1) { return; }
    state.errorStreak = 0;
    buildQueue(pos);
    playAt(pos, true);
    if (window.innerWidth < 1024 && el.playerCol) {
      el.playerCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function trackHref(slug) {
    return (route.base || '') + '/track/' + slug;
  }

  /* ---------------- events ---------------- */

  function bindEvents() {
    el.slotChips.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-slot]');
      if (!btn) { return; }
      state.slotFilter = btn.getAttribute('data-slot');
      applyFilters();
    });

    el.typeChips.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-type]');
      if (!btn) { return; }
      state.typeFilter = btn.getAttribute('data-type');
      applyFilters();
    });

    var debounce;
    el.searchInput.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(function () {
        state.query = el.searchInput.value;
        applyFilters();
      }, 140);
    });

    el.trackGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-play]');
      if (!btn) { return; }
      var index = parseInt(btn.getAttribute('data-play'), 10);
      state.errorStreak = 0;
      buildQueue(index);
      playAt(index, true);
      if (window.innerWidth < 1024) {
        el.playerCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    el.specialGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-splay]');
      if (!btn) { return; }
      var index = parseInt(btn.getAttribute('data-splay'), 10);
      state.errorStreak = 0;
      state.queue = state.specialTracks.slice();
      state.queueIndex = index;
      renderQueue();
      playAt(index, true);
      if (window.innerWidth < 1024) {
        el.playerCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    el.jyoGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-jplay]');
      if (!btn) { return; }
      var index = parseInt(btn.getAttribute('data-jplay'), 10);
      state.errorStreak = 0;
      state.queue = state.jyoLive.map(jyoTrack);
      state.queueIndex = index;
      renderQueue();
      playAt(index, true);
      if (window.innerWidth < 1024) {
        el.playerCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    el.queueList.addEventListener('click', function (e) {
      var item = e.target.closest('[data-q]');
      if (!item) { return; }
      state.errorStreak = 0;
      playAt(parseInt(item.getAttribute('data-q'), 10), true);
    });

    el.btnToggle.addEventListener('click', togglePlay);
    el.btnNext.addEventListener('click', nextTrack);
    el.btnPrev.addEventListener('click', prevTrack);

    function toggleSound(e) {
      e.preventDefault();
      setMuted(!state.muted);
    }
    if (el.btnSound) { el.btnSound.addEventListener('click', toggleSound); }
    if (el.miniSound) { el.miniSound.addEventListener('click', toggleSound); }

    if (el.citySelect) {
      el.citySelect.addEventListener('change', function () {
        setCity(el.citySelect.value);
      });
    }

    el.miniToggle.addEventListener('click', togglePlay);
    el.miniNext.addEventListener('click', nextTrack);
    el.miniPrev.addEventListener('click', prevTrack);

    if (el.trackPlayBtn) {
      el.trackPlayBtn.addEventListener('click', function () {
        var current = state.queueIndex >= 0 ? state.queue[state.queueIndex] : null;
        if (current && current.slug === routeTrack) { togglePlay(); return; }
        playRouteTrack();
      });
    }

    el.miniOpen.addEventListener('click', function () {
      el.playerCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) { return; }
      if (e.code === 'Space' && state.queueIndex >= 0) { e.preventDefault(); togglePlay(); }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { jyoPreviewCommand('pauseVideo'); }
      else if (!state.playing) { jyoPreviewCommand('playVideo'); }
    });
  }

  /* ---------------- boot ---------------- */

  function cacheEls() {
    el.clockIst = $('clockIst');
    el.clockLocal = $('clockLocal');
    el.dateHi = $('dateHi');
    el.dateEn = $('dateEn');
    el.slotPillText = $('slotPillText');
    el.shlokaText = $('shlokaText');
    el.shlokaTranslit = $('shlokaTranslit');
    el.shlokaMeaning = $('shlokaMeaning');
    el.shlokaSource = $('shlokaSource');
    el.panchangStrip = $('panchangStrip');
    el.citySelect = $('citySelect');
    el.cityLabel = $('cityLabel');
    el.panchangNote = $('panchangNote');
    el.pcVar = $('pcVar');
    el.pcTithi = $('pcTithi');
    el.pcNak = $('pcNak');
    el.pcRise = $('pcRise');
    el.pcSet = $('pcSet');
    el.festRow = $('festRow');
    el.specialSection = $('specialSection');
    el.ruleList = $('ruleList');
    el.specialGrid = $('specialGrid');
    el.jyoSection = $('jyoSection');
    el.jyoGrid = $('jyoGrid');
    el.slotChips = $('slotChips');
    el.typeChips = $('typeChips');
    el.searchInput = $('searchInput');
    el.resultCount = $('resultCount');
    el.trackGrid = $('trackGrid');
    el.trackDetail = $('trackDetail');
    el.trackPlayBtn = $('trackPlayBtn');
    el.lyricsBody = $('lyricsBody');
    el.tgTranslit = $('tgTranslit');
    el.tgMeaning = $('tgMeaning');
    el.fontDec = $('fontDec');
    el.fontInc = $('fontInc');
    el.queueList = $('queueList');
    el.queueCount = $('queueCount');
    el.nowTitle = $('nowTitle');
    el.nowMeta = $('nowMeta');
    el.btnToggle = $('btnToggle');
    el.btnNext = $('btnNext');
    el.btnPrev = $('btnPrev');
    el.btnSound = $('btnSound');
    el.btnOpenYt = $('btnOpenYt');
    el.iconPlay = $('iconPlay');
    el.iconPause = $('iconPause');
    el.iconSoundOn = $('iconSoundOn');
    el.iconSoundOff = $('iconSoundOff');
    el.playerPlaceholder = $('playerPlaceholder');
    el.ytPlayerHost = $('ytPlayerHost');
    el.playerCol = $('playerCol');
    el.miniBar = $('miniBar');
    el.miniTitle = $('miniTitle');
    el.miniSub = $('miniSub');
    el.miniToggle = $('miniToggle');
    el.miniNext = $('miniNext');
    el.miniPrev = $('miniPrev');
    el.miniSound = $('miniSound');
    el.miniOpen = $('miniOpen');
    el.miniIconPlay = $('miniIconPlay');
    el.miniIconPause = $('miniIconPause');
    el.miniIconSoundOn = $('miniIconSoundOn');
    el.miniIconSoundOff = $('miniIconSoundOff');
    el.footerMeta = $('footerMeta');
    el.topbar = document.querySelector('.topbar');
    el.navBits = document.querySelectorAll('[data-nav]');
  }

  function normalizeSlot(slot, index, all) {
    // slots come from the API with from/to minutes included (server strips them,
    // so rebuild ranges from the label when missing)
    if (typeof slot.from === 'number' && typeof slot.to === 'number') { return slot; }
    var ranges = {
      brahma: [240, 360], pratah: [360, 660], divas: [660, 960],
      sandhya: [960, 1140], aarti: [1140, 1260], ratri: [1260, 240]
    };
    var r = ranges[slot.key];
    if (r) { slot.from = r[0]; slot.to = r[1]; }
    return slot;
  }

  /**
   * After every payload: make sure state.city is a city the server actually
   * knows about. Returns true when the key had to be resolved from scratch,
   * which means the caller should re-fetch if it differs from the served one.
   */
  function ensureCity(payload) {
    var requested = pinnedCity || state.city;
    if (requested && validCity(requested)) {
      state.city = requested;
      if (pinnedCity) { state.cityAuto = false; }
      return false;
    }
    var pick = pickInitialCity();
    state.city = pick.key;
    state.cityAuto = pick.auto;
    storeSet(CITY_KEY, pick.key);
    storeSet(CITY_KEY_AUTO, pick.auto ? '1' : '0');
    return payload.location ? (payload.location.key !== pick.key) : true;
  }

  /**
   * /track/{slug} was requested: clear the filters that would hide the card,
   * bring it into view once, and mark it as the target of this visit.
   */
  function applyRoute() {
    if (!routeTrack) { return; }
    var target = null;
    state.tracks.forEach(function (t) { if (t.slug === routeTrack) { target = t; } });
    if (!target) { return; }

    if (state.slotFilter !== 'all') { state.slotFilter = 'all'; }
    if (state.typeFilter !== 'all' && state.typeFilter !== target.type) { state.typeFilter = 'all'; }
    if (state.query) { state.query = ''; el.searchInput.value = ''; }
    applyFilters();

    var pos = state.filtered.indexOf(target);
    if (pos === -1) { return; }
    var card = el.trackGrid.querySelector('[data-index="' + pos + '"]');
    if (!card) { return; }
    card.classList.add('is-focused');
    // On a track page the lyrics sit at the top - never scroll past them.
    if (!routeScrolled && !el.trackDetail) {
      routeScrolled = true;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function applySuggest(data) {
    state.slots = (data.slots || []).map(normalizeSlot);
    state.tracks = data.tracks || [];
    state.shloka = data.shloka;
    state.currentSlot = data.current_slot;
    state.panchang = data.panchang || null;
    state.locations = data.locations || [];
    state.location = data.location || null;
    state.dayMatches = data.day_matches || [];
    state.jyotirlingas = data.jyotirlingas || [];

    if (ensureCity(data)) {
      loadSuggest();
      return;
    }

    resolveSpecial();
    renderCityPicker();
    renderShloka();
    renderPanchang();
    renderSpecial();
    renderJyo();
    updateCurrentSlot();
    applyFilters();
    applyRoute();
    renderQueue();
    state.booted = true;

    var locName = state.location ? cityLabel(state.location, locLang()) : '';
    var srcLabel = data.source === 'mysql' ? str('footer.mysql') : str('footer.catalog');
    var panchangSrc = state.panchang
      ? ' · ' + str('footer.panchang') + ': ' +
        (state.panchang.source === 'mysql' ? str('footer.mysql') : str('footer.dataset'))
      : '';
    el.footerMeta.textContent =
      str('footer.source') + ': ' + srcLabel +
      ' · ' + state.tracks.length + ' ' + str('footer.tracks') +
      panchangSrc +
      (locName ? ' · ' + str('footer.location') + ': ' + locName : '') +
      ' · ' + str('footer.updated') + ': ' +
      (data.generated_at
        ? new Date(data.generated_at).toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN')
        : '–');
  }

  function loadSuggest() {
    fetch(apiUrl(state.city), { headers: { 'Accept': 'application/json' } })
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (data) {
        if (!data.ok) { throw new Error(data.error || 'bad payload'); }
        applySuggest(data);
      })
      .catch(function (err) {
        el.trackGrid.innerHTML = '<div class="empty-state">' +
          esc(str('load.error', { err: err.message })) +
          '<br><br><button type="button" class="chip active" id="retryBtn">' +
          esc(str('load.retry')) + '</button></div>';
        var retry = $('retryBtn');
        if (retry) { retry.addEventListener('click', function () { window.location.reload(); }); }
        el.footerMeta.textContent = str('api.unavailable');
      });
  }

  function boot() {
    cacheEls();
    renderClock();
    renderDates();
    bindEvents();
    initLyrics();
    loadYouTubeApi();
    updateTopbarH();
    syncNav();
    applyMuteUI();

    setInterval(renderClock, 1000);
    setInterval(renderDates, 60 * 1000);
    setInterval(updateCurrentSlot, 30 * 1000);
    window.addEventListener('resize', updateTopbarH);

    // a ?city= pin wins, then a stored choice; the list itself only arrives
    // with the payload, so everything is validated in ensureCity()
    state.city = pinnedCity || storeGet(CITY_KEY) || '';
    state.cityAuto = !pinnedCity && storeGet(CITY_KEY_AUTO) === '1';
    loadSuggest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
