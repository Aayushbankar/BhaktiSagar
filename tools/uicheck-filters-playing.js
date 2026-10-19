(async function () {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var out = {};
  var chips = function () {
    return Array.prototype.map.call(
      document.querySelectorAll('#typeChips [data-type]'),
      function (c) { return c.textContent; }
    );
  };

  for (var i = 0; i < 40 && !document.querySelector('#typeChips [data-type]'); i++) { await sleep(250); }
  out.chipsAtBoot = chips();

  var slotAarti = document.querySelector('[data-slot="aarti"]');
  if (slotAarti) { slotAarti.click(); await sleep(300); }
  out.chipsAfterAartiSlot = chips();

  document.querySelector('[data-type="shloka"]').click();
  await sleep(300);
  out.chipsAfterShlokaType = chips();
  out.gridCardCount = document.querySelectorAll('#trackGrid .track-card').length;
  var es = document.querySelector('#trackGrid .empty-state');
  out.emptyState = es ? es.textContent : null;
  out.resultCount = document.getElementById('resultCount').textContent;

  var shChip = document.querySelector('[data-type="shloka"]').textContent;
  var m = shChip.match(/\((\d+)\)/);
  out.shlokaChipCount = m ? parseInt(m[1], 10) : null;
  out.countMatchesList = out.shlokaChipCount === out.gridCardCount;

  document.querySelector('[data-type="all"]').click();
  await sleep(300);
  out.allChipAtAarti = document.querySelector('[data-type="all"]').textContent;
  out.gridAtAarti = document.querySelectorAll('#trackGrid .track-card').length;

  var playBtn = document.querySelector('#trackGrid [data-play]');
  if (playBtn) { playBtn.click(); await sleep(4000); }
  var card = document.querySelector('#trackGrid .track-card.is-playing');
  out.hasPlayingCard = !!card;
  if (card) {
    var fab = card.querySelector('.play-fab');
    out.fabBg = getComputedStyle(fab).backgroundColor;
    out.fabIsPause = !!fab.querySelector('path[d^="M6 5h4"]');
    out.fabAria = fab.getAttribute('aria-label');
    out.cardBorder = getComputedStyle(card).borderTopColor;
  }
  out.saffronVar = getComputedStyle(document.documentElement).getPropertyValue('--saffron').trim();
  out.nowTitle = document.getElementById('nowTitle').textContent;
  out.iconPlayHidden = document.getElementById('iconPlay').hasAttribute('hidden');
  out.iconPauseHidden = document.getElementById('iconPause').hasAttribute('hidden');
  out.queueActive = !!document.querySelector('#queueList .queue-item.active');
  return out;
})()
