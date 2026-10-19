(async function () {
  var norm = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var now = function () { var e = document.getElementById('nowTitle'); return e ? norm(e.textContent) : ''; };

  var i;
  for (i = 0; i < 60 && !document.querySelector('#trackGrid [data-play]'); i++) { await sleep(250); }
  document.querySelector('#trackGrid [data-play]').click();
  for (i = 0; i < 80 && (!now() || now() === 'प्लेयर तैयार है'); i++) { await sleep(250); }
  var title1 = now();
  await sleep(6000);

  var frame = document.querySelector('iframe[src*="youtube.com/embed"]');
  if (!frame) { return { step: 'no-iframe', ok: false }; }

  var msgs = [];
  window.addEventListener('message', function (e) {
    if (String(e.origin).indexOf('youtube') < 0) { return; }
    var d = e.data;
    msgs.push(typeof d === 'string' ? d : JSON.stringify(d));
  });

  var duration = 0;
  for (i = 0; i < 40 && !duration; i++) {
    await sleep(300);
    for (var m = 0; m < msgs.length; m++) {
      var dm = msgs[m].match(/"duration":([\d.]+)/);
      if (dm) { duration = parseFloat(dm[1]); break; }
    }
  }
  if (!duration) { return { step: 'no-duration', ok: false, title1: title1 }; }

  var target = Math.max(1, duration - 1);
  var seen0 = msgs.length;
  frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true] }), '*');

  var jumped = false;
  for (i = 0; i < 30; i++) {
    await sleep(500);
    for (var k = seen0; k < msgs.length; k++) {
      var cm = msgs[k].match(/"currentTime":([\d.]+)/);
      if (cm && parseFloat(cm[1]) > duration - 15) { jumped = true; }
    }
    if (jumped) { break; }
  }
  if (!jumped) {
    frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true], id: 1, channel: 'widget' }), '*');
    for (i = 0; i < 30; i++) {
      await sleep(500);
      for (var k2 = seen0; k2 < msgs.length; k2++) {
        var cm2 = msgs[k2].match(/"currentTime":([\d.]+)/);
        if (cm2 && parseFloat(cm2[1]) > duration - 15) { jumped = true; }
      }
      if (jumped) { break; }
    }
  }

  var advanced = false;
  for (i = 0; i < 60; i++) {
    await sleep(500);
    if (now() && now() !== title1) { advanced = true; break; }
  }
  if (advanced) { await sleep(7000); }

  var title2 = now();
  var playIcon = document.getElementById('iconPlay');
  return {
    ok: advanced && title2 !== title1,
    duration: duration,
    seekJumped: jumped,
    firstTrack: title1,
    afterEnd: title2,
    advanced: advanced,
    newTrackPlaying: !!playIcon && !playIcon.hasAttribute('hidden'),
    queueCount: document.querySelectorAll('#queueList [data-q]').length
  };
})()
