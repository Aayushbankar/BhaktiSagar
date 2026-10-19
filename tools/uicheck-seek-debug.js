(async function () {
  var norm = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var now = function () { var e = document.getElementById('nowTitle'); return e ? norm(e.textContent) : ''; };

  var i;
  for (i = 0; i < 60 && !document.querySelector('#trackGrid [data-play]'); i++) { await sleep(250); }
  document.querySelector('#trackGrid [data-play]').click();
  for (i = 0; i < 80 && (!now() || now() === 'प्लेयर तैयार है'); i++) { await sleep(250); }
  var title1 = now();
  await sleep(7000);

  var frame = document.querySelector('iframe[src*="youtube.com/embed"]');
  if (!frame) { return { step: 'no-iframe' }; }

  var seen = [];
  window.addEventListener('message', function (e) {
    if (String(e.origin).indexOf('youtube') < 0) { return; }
    var d = e.data;
    var s = typeof d === 'string' ? d : JSON.stringify(d);
    seen.push(s.slice(0, 400));
  });

  var t0 = Date.now();
  while (Date.now() - t0 < 6000 && seen.length === 0) { await sleep(300); }

  var before = seen.length;
  frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [99999, true] }), '*');
  var afterSeek = [];
  t0 = Date.now();
  while (Date.now() - t0 < 8000) { await sleep(400); }
  afterSeek = seen.slice(before);

  var advanced = false;
  for (i = 0; i < 20; i++) { await sleep(500); if (now() !== title1) { advanced = true; break; } }

  return {
    title1: title1,
    titleNow: now(),
    advanced: advanced,
    msgsSeen: seen.length,
    firstMsgs: seen.slice(0, 4),
    msgsAfterSeek: afterSeek.slice(0, 6)
  };
})()
