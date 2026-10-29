/* David Gooding Inc. Christmas board.
   One interval and one watchdog timeout for the life of the page.
   Photos, snow, and type are a fixed set of elements. Motion is CSS.
   Nothing grows the DOM. Images and fonts are local. */
(function () {
  var params = new URLSearchParams(location.search);

  function num(key, fallback, min, max) {
    if (!params.has(key)) return fallback;
    var n = Number(params.get(key));
    if (!isFinite(n)) return fallback;
    if (n < min) return min;
    if (max != null && n > max) return max;
    return n;
  }

  var sceneMs = num('sceneMs', 15000, 400, 120000);
  var reloadHours = num('reload', 6, 0, 168);
  var hold = params.get('hold') === '1';
  var debug = params.get('debug') === '1';
  var TICK_MS = 100;
  var WATCH_PAD_MS = 8000;
  var HARD_EXTRA_MS = 15 * 60 * 1000;
  var MAX_FLAKES = 22;
  var DAY_MS = 86400000;

  var board = document.getElementById('board');
  var countdown = document.getElementById('countdown');
  var bar = document.getElementById('bar');
  var scenes = document.querySelectorAll('.scene');
  var store = {
    get: function (k) {
      try { return localStorage.getItem(k); } catch (e) { return null; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, v); } catch (e) {}
    }
  };

  var index = 0;
  var sceneStarted = Date.now();
  var booted = Date.now();
  var reloadDue = false;
  var pendingReload = '';
  var reloading = false;
  var shownCountdown = '';
  var clock = 0;
  var watchTimer = 0;
  var wakeLock = null;
  var wakePending = false;
  var lastWake = 0;
  var fitW = 0;
  var fitH = 0;
  var debugEl = null;
  var lastDebug = 0;
  var flakeCount = 0;
  var showDepth = 0;
  var preloaded = Object.create(null);

  var api = {
    index: 0,
    count: scenes.length,
    id: 'greet',
    countdown: '',
    flakes: 0,
    nodes: 0,
    message: countdownMessage,
    christmasStart: christmasStart,
    wallClockUtc: wallClockUtc
  };
  window.__board = api;

  function note(msg) {
    try { localStorage.setItem('dgi_err', String(msg).slice(0, 300)); } catch (e) {}
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function part(bits, type) {
    var i;
    for (i = 0; i < bits.length; i++) {
      if (bits[i].type === type) return Number(bits[i].value);
    }
    return 0;
  }

  // One formatter for the life of the page. America/New_York, calendar and clock.
  var nyFmt = null;
  var nyFmtFailed = false;
  function clockFmt() {
    if (nyFmt || nyFmtFailed) return nyFmt;
    try {
      nyFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      nyFmtFailed = true;
      nyFmt = null;
    }
    return nyFmt;
  }

  function nyParts(date) {
    var fmt = clockFmt();
    if (!fmt) return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
    try {
      var bits = fmt.formatToParts(date);
      return { y: part(bits, 'year'), m: part(bits, 'month'), d: part(bits, 'day') };
    } catch (e) {
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
    }
  }

  // 12:00 AM America/New_York on a civil date, as a UTC instant.
  // Resolved from the timezone database so the TV's own zone does not matter.
  function wallClockUtc(y, m, d, h, mi, s) {
    var want = Date.UTC(y, m - 1, d, h, mi, s);
    var utc = want;
    var fmt = clockFmt();
    if (!fmt) return Date.UTC(y, m - 1, d, h + 5, mi, s);
    try {
      var n;
      for (n = 0; n < 4; n++) {
        var bits = fmt.formatToParts(new Date(utc));
        var hour = part(bits, 'hour');
        if (hour === 24) hour = 0;
        var got = Date.UTC(
          part(bits, 'year'),
          part(bits, 'month') - 1,
          part(bits, 'day'),
          hour,
          part(bits, 'minute'),
          part(bits, 'second')
        );
        var delta = got - want;
        if (delta === 0) return utc;
        utc -= delta;
      }
    } catch (e2) {
      return Date.UTC(y, m - 1, d, h + 5, mi, s);
    }
    return utc;
  }

  var christmasStartCache = Object.create(null);
  function christmasStart(year) {
    var key = String(year);
    if (christmasStartCache[key] == null) {
      christmasStartCache[key] = wallClockUtc(year, 12, 25, 0, 0, 0);
    }
    return christmasStartCache[key];
  }

  function frozenNow() {
    var raw = params.get('date');
    if (!raw) return 0;
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return 0;
    return wallClockUtc(Number(match[1]), Number(match[2]), Number(match[3]), 0, 0, 0);
  }

  var FROZEN_NOW = frozenNow();
  function clockNow() {
    return FROZEN_NOW || Date.now();
  }

  function countdownMessage(ms) {
    var parts = nyParts(new Date(ms));
    var year = parts.y;
    var target = christmasStart(year);
    // Christmas day runs from midnight to the next midnight in New York.
    // After that, including across New Year, count to the next December 25.
    if ((parts.m === 12 && parts.d === 25) || (ms >= target && ms < target + DAY_MS)) {
      return 'Merry Christmas from DGI!';
    }
    if (ms >= target) {
      year += 1;
      target = christmasStart(year);
    }
    var left = target - ms;
    if (left < 0) left = 0;
    var total = Math.floor(left / 1000);
    var days = Math.floor(total / 86400);
    var hours = Math.floor((total % 86400) / 3600);
    var mins = Math.floor((total % 3600) / 60);
    var secs = total % 60;
    return days + 'd ' + pad2(hours) + 'h ' + pad2(mins) + 'm ' + pad2(secs) + 's until Christmas';
  }

  function paintCountdown() {
    var text = countdownMessage(clockNow());
    if (text === shownCountdown) return;
    shownCountdown = text;
    countdown.textContent = text;
    api.countdown = text;
  }

  function publish() {
    api.index = index;
    api.count = scenes.length;
    api.id = scenes[index] ? scenes[index].getAttribute('data-scene') : '';
    api.countdown = countdown.textContent;
    api.flakes = flakeCount;
  }

  function sceneAlive(scene) {
    return scene && scene.getAttribute('data-dead') !== '1';
  }

  function livingCount() {
    var n = 0;
    var i;
    for (i = 0; i < scenes.length; i++) if (sceneAlive(scenes[i])) n++;
    return n;
  }

  function clearWatchdog() {
    if (!watchTimer) return;
    clearTimeout(watchTimer);
    watchTimer = 0;
  }

  function onWatchdog() {
    watchTimer = 0;
    if (reloading || hold) return;
    note('watchdog');
    if (!clock) startClock();
    if (reloadDue && tryReload('scheduled')) return;
    show(index + 1);
  }

  function armWatchdog() {
    clearWatchdog();
    if (hold || reloading || !scenes.length) return;
    var delay = sceneStarted + sceneMs + WATCH_PAD_MS - Date.now();
    if (delay < 500) delay = 500;
    watchTimer = setTimeout(onWatchdog, delay);
  }

  function show(n, dir) {
    if (!scenes.length || showDepth > scenes.length) return;
    showDepth += 1;
    try {
      var count = scenes.length;
      var step = dir === -1 ? -1 : 1;
      var start = ((n % count) + count) % count;
      var i = start;
      var guard = 0;
      var living = livingCount();
      if (living > 0) {
        while (!sceneAlive(scenes[i]) && guard < count) {
          i = (i + step + count) % count;
          guard += 1;
        }
      }
      index = i;
      var s;
      for (s = 0; s < count; s++) {
        if (s === index) scenes[s].classList.add('is-active');
        else scenes[s].classList.remove('is-active');
      }
      board.setAttribute('data-scene', scenes[index].getAttribute('data-scene') || 'greet');
      sceneStarted = Date.now();
      bar.style.transform = 'scaleX(0)';
      publish();
      armWatchdog();
    } finally {
      showDepth -= 1;
    }
  }

  function startIndex() {
    if (!params.has('r') && params.has('scene')) {
      var q = Number(params.get('scene'));
      if (isFinite(q)) return Math.floor(q);
    }
    var raw = store.get('dgi_next');
    if (raw) {
      store.set('dgi_next', '');
      var saved = Number(raw);
      if (isFinite(saved)) return saved;
    }
    return 0;
  }

  function clearTimers() {
    if (clock) {
      clearInterval(clock);
      clock = 0;
    }
    clearWatchdog();
  }

  function tryReload(reason) {
    if (reloading) return true;
    if (navigator.onLine === false) {
      pendingReload = reason;
      note('offline defer ' + reason);
      return false;
    }
    var last = Number(store.get('dgi_reload_at')) || 0;
    if (Date.now() - last < 60000) {
      note('reload held ' + reason);
      return false;
    }
    reloading = true;
    pendingReload = '';
    clearTimers();
    store.set('dgi_reload_at', String(Date.now()));
    store.set('dgi_reason', reason);
    if (scenes.length) store.set('dgi_next', String((index + 1) % scenes.length));
    var url = new URL(location.href);
    url.searchParams.set('r', String(Date.now()));
    try {
      location.replace(url.toString());
    } catch (e) {
      reloading = false;
      note(e && e.message ? e.message : e);
      startClock();
      armWatchdog();
      return false;
    }
    return true;
  }

  function fit() {
    var w = window.innerWidth || 1920;
    var h = window.innerHeight || 1080;
    if (w === fitW && h === fitH) return;
    fitW = w;
    fitH = h;
    var s = Math.min(w / 1920, h / 1080);
    board.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }

  function pokeWake(now) {
    if (wakePending || now - lastWake < 60000) return;
    lastWake = now;
    try {
      if (!navigator.wakeLock || document.hidden) return;
      if (wakeLock && wakeLock.released === false) return;
      wakePending = true;
      navigator.wakeLock.request('screen').then(function (lock) {
        wakeLock = lock;
        wakePending = false;
      }).catch(function () {
        wakePending = false;
      });
    } catch (e) {
      wakePending = false;
    }
  }

  function paintDebug(now) {
    if (!debugEl || now - lastDebug < 1000) return;
    lastDebug = now;
    var up = Math.round((now - booted) / 60000);
    debugEl.textContent = 'scene: ' + (index + 1) + '/' + scenes.length + '  ' + api.id
      + '\nrunning: ' + up + ' min'
      + '\ncountdown: ' + (countdown.textContent || '')
      + '\nlast problem: ' + (store.get('dgi_err') || 'none');
  }

  function tick() {
    if (reloading) return;
    var now;
    try {
      now = Date.now();
      fit();
      paintCountdown();
      pokeWake(now);
      if (debug) paintDebug(now);
      if (reloadHours > 0 && !reloadDue && now - booted >= reloadHours * 3600000) reloadDue = true;
      if (pendingReload && navigator.onLine !== false) tryReload(pendingReload);
      if (reloadHours > 0 && now - booted >= reloadHours * 3600000 + HARD_EXTRA_MS) tryReload('hard');
      if (hold) return;
      var p = (now - sceneStarted) / sceneMs;
      if (p < 0) p = 0;
      if (p > 1) p = 1;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (now - sceneStarted >= sceneMs) {
        if (reloadDue && tryReload('scheduled')) return;
        show(index + 1);
      }
    } catch (err) {
      note(err && err.message ? err.message : err);
    }
  }

  function buildSnow() {
    var root = document.getElementById('snow');
    var have, i, el, size;
    if (!root) return;
    while (root.children.length > MAX_FLAKES) root.removeChild(root.lastChild);
    have = root.children.length;
    for (i = have; i < MAX_FLAKES; i++) {
      el = document.createElement('i');
      el.className = 'flake';
      size = 4 + (i % 4) * 2;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.left = ((i * 29) % 100) + '%';
      el.style.animationDuration = (16 + (i % 8)) + 's';
      el.style.animationDelay = (-i * 1.15) + 's';
      el.style.opacity = String(0.35 + (i % 4) * 0.12);
      el.style.setProperty('--drift', ((i % 5) - 2) * 14 + 'px');
      root.appendChild(el);
    }
    flakeCount = root.children.length;
  }

  function onImageError(img) {
    var badge, plate, photo, scene;
    if (!img || img.getAttribute('data-failed') === '1') return;
    img.setAttribute('data-failed', '1');
    img.classList.add('is-broken');
    if (!img.closest) return;
    badge = img.closest('.badge');
    if (badge) badge.classList.add('is-broken');
    plate = img.closest('.logo-plate');
    if (plate) plate.classList.add('is-broken');
    photo = img.closest('.photo');
    scene = img.closest ? img.closest('.scene') : null;
    if (!photo || !scene) return;
    scene.setAttribute('data-dead', '1');
    photo.classList.add('is-fallback');
    if (scene.classList.contains('is-active') && livingCount() > 0) show(index + 1);
  }

  function watchImage(img) {
    var src, raster;
    if (!img || img.getAttribute('data-watch') === '1') return;
    img.setAttribute('data-watch', '1');
    src = img.getAttribute('src') || '';
    if (src && !preloaded[src]) {
      preloaded[src] = 1;
      if (img.decode) {
        try {
          var decoded = img.decode();
          if (decoded && decoded.catch) decoded.catch(function () {});
        } catch (e) {}
      }
    }
    function onError() {
      img.removeEventListener('error', onError);
      img.removeEventListener('load', onLoad);
      onImageError(img);
    }
    function onLoad() {
      img.removeEventListener('error', onError);
      img.removeEventListener('load', onLoad);
    }
    img.addEventListener('error', onError);
    img.addEventListener('load', onLoad);
    if (!img.complete) return;
    img.removeEventListener('error', onError);
    img.removeEventListener('load', onLoad);
    raster = !/\.svg($|\?)/i.test(src);
    if (raster && !(img.naturalWidth > 0)) onImageError(img);
  }

  function preloadImages() {
    var imgs = document.getElementsByTagName('img');
    var i;
    for (i = 0; i < imgs.length; i++) watchImage(imgs[i]);
  }

  function startClock() {
    if (clock) return;
    clock = setInterval(tick, TICK_MS);
  }

  window.onerror = function (msg, src, line) {
    note('error: ' + msg + ' @' + line);
  };
  window.onunhandledrejection = function (ev) {
    var reason = ev && ev.reason;
    note('rejection: ' + (reason && reason.message ? reason.message : reason));
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    lastWake = 0;
    wakePending = false;
    paintCountdown();
  });

  document.addEventListener('keydown', function (e) {
    var key = e.key || '';
    if (key === 'ArrowRight' || key === ' ') {
      e.preventDefault();
      show(index + 1);
    } else if (key === 'ArrowLeft') {
      e.preventDefault();
      show(index - 1, -1);
    }
  });

  window.addEventListener('online', function () {
    if (pendingReload) tryReload(pendingReload);
  });

  window.addEventListener('pagehide', clearTimers);
  window.addEventListener('pageshow', function (ev) {
    if (!ev.persisted || reloading) return;
    startClock();
    armWatchdog();
  });

  if (!store.get('dgi_since')) store.set('dgi_since', String(Date.now()));
  store.set('dgi_loads', String((Number(store.get('dgi_loads')) || 0) + 1));

  if (debug) {
    debugEl = document.createElement('div');
    debugEl.id = 'debug';
    board.appendChild(debugEl);
  }

  try { buildSnow(); } catch (e2) { note(e2); }
  try { preloadImages(); } catch (eImg) { note(eImg); }
  try {
    show(startIndex());
    paintCountdown();
  } catch (e3) { note(e3); }
  api.nodes = document.getElementsByTagName('*').length;
  fit();
  startClock();
})();
