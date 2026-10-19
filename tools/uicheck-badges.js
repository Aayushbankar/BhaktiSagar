(async function () {
  var dates = ['2026-11-24', '2026-11-08', '2026-02-15'];
  var out = {};
  for (var i = 0; i < dates.length; i++) {
    var r = await fetch('/bhakti-sagar/api/?action=suggest&date=' + dates[i]);
    var j = await r.json();
    out[dates[i]] = {
      chips: (j.panchang && j.panchang.festivals || []).map(function (f) { return f.hi || f.name; }),
      badges: (j.day_matches || []).map(function (m) { return m.badge_hi; }),
      specialCount: (j.special_tracks || j.tracks || []).length
    };
  }
  return out;
})()
