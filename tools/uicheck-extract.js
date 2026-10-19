(function () {
  var norm = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
  var present = function (id) { var e = document.getElementById(id); return e ? !e.hidden : false; };
  return {
    panchangVisible: present('panchangStrip'),
    panchangText: norm((document.querySelector('#panchangStrip .panchang-items') || {}).textContent),
    festChips: Array.from(document.querySelectorAll('.fest-chip')).map(function (e) { return norm(e.textContent); }),
    specialVisible: present('specialSection'),
    badges: Array.from(document.querySelectorAll('#specialSection .rule-badge')).map(function (e) { return norm(e.textContent); }),
    specialCount: document.querySelectorAll('#specialGrid .track-card').length,
    specialPlayButtons: document.querySelectorAll('#specialGrid [data-splay]').length,
    specialTitles: Array.from(document.querySelectorAll('#specialGrid .track-title')).map(function (c) {
      return norm(c.textContent).slice(0, 70);
    }),
    gridCount: document.querySelectorAll('#trackGrid [data-play]').length,
    gridSpecialTags: document.querySelectorAll('#trackGrid .special-tag').length,
    slotPill: norm((document.getElementById('slotPillText') || {}).textContent),
    nowTitle: norm((document.getElementById('nowTitle') || {}).textContent)
  };
})()
