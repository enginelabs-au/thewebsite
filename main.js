/*
  thewebsite.com.au
  Ten scroll modes live on the dial. Turn the dial, then press refresh
  to turn that mode on or off. Edit PROJECTS below to add a site.
*/
(() => {
  const PROJECTS = [
    { name: 'z0rb', url: 'z0rb.ai', shot: 'shots/z0rb.jpg', embed: true },
    { name: 'yournewhandle', url: 'yournewhandle.com', shot: 'shots/yournewhandle.jpg', embed: true },
    { name: 'Hertz Labs', url: 'hertzlabs.com.au', shot: 'shots/hertzlabs.jpg', embed: true },
    { name: 'Cam Douglas', url: 'camdouglas.com', shot: 'shots/camdouglas.jpg', embed: true },
    { name: 'Jingle Labs', url: 'jinglelabs.com.au', shot: 'shots/jinglelabs.jpg', embed: true },
    { name: 'inspected', url: 'inspected-app.com', shot: 'shots/inspected.jpg', embed: true },
    { name: 'Engine Labs', url: 'enginelabs.com.au', shot: 'shots/enginelabs.jpg', embed: true },
    { name: 'PuffPuffStop', url: 'puffpuffstop.com', shot: 'shots/puffpuffstop.jpg', embed: true },
  ];

  const MODES = [
    { id: 'sideways', name: 'Sideways', hint: 'scroll the page · flick sideways to change site', tip: 'Sideways. Scroll up and down to move through the site. Flick sideways, or swipe left and right, to zoom one site and lock.' },
    { id: 'overscroll', name: 'Overscroll', hint: 'scroll the site · at the top or bottom edge, keep scrolling', tip: 'Overscroll. Scroll the site normally. On the strip at the very top or bottom, keep scrolling and the next site zooms in and locks.' },
    { id: 'armed', name: 'Armed', hint: 'press Next site, then scroll once', tip: 'Armed. Press Next site. The following scroll zooms one site to full screen, then scrolling belongs to the page again.' },
    { id: 'hold', name: 'Hold', hint: 'hold space or the Hold pad, then scroll once', tip: 'Hold. Hold the spacebar, or hold the Hold pad, then scroll once. That zoom fills the screen. Release and the page scrolls.' },
    { id: 'rail', name: 'Rail', hint: 'scroll the page · scroll the right edge to change site', tip: 'Rail. Scroll the website to read it. Scroll the strip down the right edge to zoom exactly one site.' },
    { id: 'stills', name: 'Stills', hint: 'scroll the stills · press Leave when a live site locks', tip: 'Stills. Scroll to move through pictures of each site. When a live site fills the screen, press Leave to move on.' },
    { id: 'flick', name: 'Flick', hint: 'a fast flick changes site · a slow scroll moves the page', tip: 'Flick. A fast flick jumps one site and locks. A slow scroll moves the page. On a live site, flick the frame around it.' },
    { id: 'seam', name: 'Seam', hint: 'scroll the site · scroll the bottom bar to go on', tip: 'Seam. Scroll the website. The bar along the bottom belongs to this page: scroll that bar to open the next site.' },
    { id: 'pinch', name: 'Pinch', hint: 'scroll the page · pinch or hold Ctrl and scroll to zoom', tip: 'Pinch. A normal scroll moves the page. Pinch, or hold Ctrl and scroll, to zoom one site full screen.' },
    { id: 'bay', name: 'Bay', hint: 'scroll the site · move into the bay and scroll once', tip: 'Bay. Scroll the site while the cursor is on it. Move the cursor into the bay and scroll once to change site. Leave the bay and come back to do it again.' },
  ];

  const TILT = true;
  const PERIOD = PROJECTS.length + 1;
  const RING_COUNT = 32;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.querySelector('[data-w3="root"]');
  const stage = document.querySelector('[data-w3="stage"]');
  const zoom = document.querySelector('[data-w3="zoom"]');
  const portal = document.querySelector('[data-w3="portal"]');
  const page = document.querySelector('[data-w3="page"]');
  const frame = document.querySelector('[data-w3="frame"]');
  const pageshot = document.querySelector('[data-w3="pageshot"]');
  const live = document.querySelector('[data-w3="live"]');
  const trailEl = document.querySelector('[data-w3="trail"]');
  const hintEl = document.querySelector('[data-w3="hint"]');
  const currentEl = document.querySelector('[data-w3="current"]');
  const homeBtn = document.querySelector('[data-w3="home"]');
  const autoBtn = document.querySelector('[data-w3="auto"]');
  const dialEl = document.querySelector('[data-w3="dial"]');
  const dialNum = document.querySelector('[data-w3="dial-num"]');
  const applyBtn = document.querySelector('[data-w3="apply"]');
  const tipEl = document.querySelector('[data-w3="tip"]');
  const modesEl = document.querySelector('[data-w3="modes"]');
  const catchEl = document.querySelector('[data-w3="catch"]');
  const chipBtn = document.querySelector('[data-w3="chip"]');
  const leaveBtn = document.querySelector('[data-w3="leave"]');
  const holdPad = document.querySelector('[data-w3="hold"]');
  const bayEl = document.querySelector('[data-w3="bay"]');

  root.style.setProperty('--period', PERIOD);

  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
  const slotOf = d => ((Math.round(d) % PERIOD) + PERIOD) % PERIOD;

  if (location.search === '?check') {
    console.assert(PERIOD === PROJECTS.length + 1, 'period should be sites + home');
    PROJECTS.forEach(p => {
      console.assert(p.shot && p.url && p.name, `${p.name || '?'} incomplete`);
    });
    console.assert(zoom && page && frame && portal && dialEl, 'latch UI missing');
    console.assert(MODES.length === 10, 'ten scroll modes');
    console.log(`thewebsite.com.au: checked ${PROJECTS.length} sites, latch UI ok.`);
  }

  function build() {
    const list = [];
    for (let n = RING_COUNT - 1; n >= 0; n--) {
      const t = n % PERIOD;
      const cls = `n${n} ty${t}`;
      if (t === 0) {
        list.push(`<div class="w3-r ${cls}" data-home="1" data-n="${n}"><div class="w3-band"></div></div>`);
      } else {
        const p = PROJECTS[t - 1];
        list.push(`<div class="w3-r ${cls}" data-n="${n}" data-slot="${t}">
          <div class="w3-shot" style="background-image:url('${esc(p.shot)}')"></div>
          <div class="w3-band"></div>
        </div>`);
      }
    }
    stage.innerHTML = list.join('');
  }

  let depth = PERIOD * 2; // start latched on home
  let shift = 0;
  let abs0 = null;
  let abs = null;
  let latched = true;
  let latchTimer = 0;
  let autoOn = false;
  let autoRaf = 0;
  let tiltRaf = 0;
  let liveSlot = -1; // which site is loaded in the iframe (-1 = none)
  let snapGen = 0;
  let latchDir = 1;
  let zoomArmed = true;
  let mustLeave = false;
  let zoomCap = null;

  const unit = () => Math.max(160, root.clientHeight * 0.28);

  function wrapDepth(d) {
    let D = d;
    while (D > PERIOD * 3) { D -= PERIOD * 2; shift += PERIOD * 2; }
    while (D < PERIOD) { D += PERIOD * 2; shift -= PERIOD * 2; }
    return D;
  }

  function sync() {
    depth = wrapDepth(depth);
    stage.style.setProperty('--D', depth.toFixed(4));
    const dist = Math.abs(depth - Math.round(depth));
    root.style.setProperty('--latch', latched ? '1' : Math.max(0, 1 - dist * 2.4).toFixed(3));

    const next = Math.round(depth) + shift;
    if (abs0 === null) abs0 = next;
    if (next !== abs) {
      abs = next;
      paintUI();
    }
  }

  function paintUI() {
    const i = slotOf(depth);
    root.dataset.home = i === 0 ? '1' : '0';
    const name = i === 0 ? 'thewebsite.com.au' : PROJECTS[i - 1].name;
    const num = pad(i);

    live.textContent = latched
      ? `Latched on ${num}, ${name}.`
      : `Zooming · ${num}, ${name}.`;

    if (!latched) hintEl.textContent = 'zooming to full screen';
    else if (!modeOn) hintEl.textContent = 'pick a mode on the dial, then press refresh';
    else hintEl.textContent = MODES[appliedIndex].hint;

    const passed = abs - abs0;
    let trail = '/';
    if (passed <= 0) trail = i === 0 ? '/' : `/${num}`;
    else {
      const parts = [];
      for (let j = Math.max(1, passed - 2); j <= passed; j++) {
        parts.push(pad((((abs0 + j) % PERIOD) + PERIOD) % PERIOD));
      }
      trail = (passed > 3 ? '/…/' : '/') + parts.join('/');
    }
    trailEl.textContent = trail;

    if (i === 0) {
      currentEl.innerHTML = `<span class="w3-btn" style="cursor:default"><span>00</span><span>thewebsite.com.au</span></span>`;
    } else {
      const p = PROJECTS[i - 1];
      currentEl.innerHTML = `<a class="w3-btn is-ink" href="https://${esc(p.url)}" target="_blank" rel="noopener"><span style="color:var(--muted)">${esc(num)}</span><span>${esc(p.name)} ↗</span></a>`;
    }
  }

  function showLive(slot) {
    if (slot === 0) {
      page.hidden = true;
      frame.removeAttribute('src');
      frame.hidden = true;
      pageshot.hidden = true;
      liveSlot = -1;
      return;
    }
    const p = PROJECTS[slot - 1];
    page.hidden = false;
    // shot sits under the iframe and can scroll on its own until the live page is ready
    pageshot.hidden = false;
    pageshot.innerHTML = `<img alt="" src="${esc(p.shot)}">`;
    pageshot.scrollTop = 0;
    if (p.embed !== false && p.framed !== false) {
      frame.hidden = false;
      if (liveSlot !== slot) {
        frame.classList.remove('is-live');
        frame.style.opacity = '0';
        frame.src = `https://${p.url}`;
        liveSlot = slot;
      } else if (frame.classList.contains('is-live')) {
        frame.style.opacity = '1';
      } else {
        frame.style.opacity = '0';
      }
    } else {
      frame.classList.remove('is-live');
      frame.hidden = true;
      frame.removeAttribute('src');
      liveSlot = slot;
    }
  }

  function latch() {
    depth = Math.round(depth);
    depth = wrapDepth(depth);
    latched = true;
    root.classList.add('is-latched');
    zoomArmed = false;
    mustLeave = true;
    zoomCap = null;
    sync();
    showLive(slotOf(depth));
    paintUI();
  }

  function noteLeftZone() {
    if (!latched || !mustLeave) return;
    mustLeave = false;
  }

  function noteReturned() {
    if (!latched || mustLeave) return;
    zoomArmed = true;
  }

  function unlatch() {
    if (!latched) return;
    latched = false;
    root.classList.remove('is-latched');
    // keep the page visible but non-interactive while zooming (css handles opacity)
    paintUI();
  }

  // finish on the one full page this visit is allowed to reach
  function scheduleLatch() {
    const target = zoomCap != null ? zoomCap : Math.round(depth);
    if (calm) {
      depth = target;
      latch();
      return;
    }
    const gen = ++snapGen;
    clearTimeout(latchTimer);
    latchTimer = setTimeout(() => {
      if (gen !== snapGen) return;
      if (Math.abs(depth - target) < 0.004) { latch(); return; }
      const start = depth;
      const t0 = performance.now();
      const dur = Math.min(900, Math.max(420, Math.abs(target - start) * 800));
      const step = now => {
        if (gen !== snapGen) return;
        const u = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - u, 3);
        depth = start + (target - start) * e;
        sync();
        if (u < 1) requestAnimationFrame(step);
        else latch();
      };
      requestAnimationFrame(step);
    }, 160);
  }

  function wheelPixels(e) {
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 40;
    else if (e.deltaMode === 2) dy *= root.clientHeight;
    return dy;
  }

  function onPortal(e) {
    const el = e.target instanceof Element ? e.target : null;
    return !!(el && el.closest('[data-w3="portal"]'));
  }

  // one visit to the zone can reach the next full page and no further
  function zoomBy(pixels) {
    if (!pixels) return;
    const dir = Math.sign(pixels);
    if (zoomCap == null) {
      latchDir = dir > 0 ? 1 : -1;
      zoomCap = Math.round(depth) + latchDir;
      zoomArmed = false;
      mustLeave = true;
      armed = false;
      holding = false;
      paintMode();
    } else if (dir !== latchDir) {
      return;
    }
    if (latchDir > 0 ? depth >= zoomCap - 1e-4 : depth <= zoomCap + 1e-4) return;
    unlatch();
    const next = depth + pixels / unit();
    depth = latchDir > 0 ? Math.min(zoomCap, next) : Math.max(zoomCap, next);
    sync();
    scheduleLatch();
  }

  function goToSlot(slot, behavior) {
    const gen = ++snapGen;
    clearTimeout(latchTimer);
    autoOn = false;
    autoBtn.classList.remove('is-pressed');
    const cur = Math.round(depth);
    const curSlot = slotOf(depth);
    let delta = slot - curSlot;
    // shortest way around the period
    if (delta > PERIOD / 2) delta -= PERIOD;
    if (delta < -PERIOD / 2) delta += PERIOD;
    const target = cur + delta;
    if (calm || behavior === 'instant') {
      depth = target;
      latch();
      return;
    }
    unlatch();
    const start = depth;
    const t0 = performance.now();
    const dur = 480;
    const tick = now => {
      if (gen !== snapGen) return;
      const u = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - u, 3);
      depth = start + (target - start) * e;
      sync();
      if (u < 1) requestAnimationFrame(tick);
      else latch();
    };
    requestAnimationFrame(tick);
  }

  function toggleAuto() {
    if (calm) return;
    if (autoOn) {
      autoOn = false;
      if (autoRaf) cancelAnimationFrame(autoRaf);
      autoBtn.classList.remove('is-pressed');
      autoBtn.setAttribute('aria-pressed', 'false');
      scheduleLatch();
      return;
    }
    autoOn = true;
    snapGen++;
    clearTimeout(latchTimer);
    unlatch();
    autoBtn.classList.add('is-pressed');
    autoBtn.setAttribute('aria-pressed', 'true');
    let last = 0;
    const tick = now => {
      if (!autoOn) return;
      if (last) {
        depth += Math.min(48, now - last) / 3200;
        sync();
      }
      last = now;
      autoRaf = requestAnimationFrame(tick);
    };
    autoRaf = requestAnimationFrame(tick);
  }

  function onMove(e) {
    if (!TILT || calm || latched || tiltRaf) return;
    const x = e.clientX, y = e.clientY;
    tiltRaf = requestAnimationFrame(() => {
      tiltRaf = 0;
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      stage.style.setProperty('--vx', (50 + ((x - r.left) / r.width - 0.5) * 12).toFixed(2));
      stage.style.setProperty('--vy', (50 + ((y - r.top) / r.height - 0.5) * 12).toFixed(2));
    });
  }

  function onLeave() {
    stage.style.setProperty('--vx', '50');
    stage.style.setProperty('--vy', '50');
  }

  let dialIndex = 0;
  let appliedIndex = 0;
  let modeOn = false;
  let armed = false;
  let holding = false;
  let bayOpen = false;
  let flickT = [];

  function activeMode() {
    return modeOn ? MODES[appliedIndex].id : null;
  }

  function paintMode() {
    const mode = activeMode();
    root.dataset.mode = mode || '';
    root.dataset.on = mode ? '1' : '0';
    root.classList.toggle('is-armed', mode === 'armed' && armed);
    root.classList.toggle('is-holding', mode === 'hold' && holding);
    catchEl.hidden = !(root.classList.contains('is-armed') || root.classList.contains('is-holding'));
    const selectedOn = modeOn && appliedIndex === dialIndex;
    applyBtn.setAttribute('aria-pressed', selectedOn ? 'true' : 'false');
    applyBtn.classList.toggle('is-pressed', selectedOn);
    dialEl.classList.toggle('is-applied', selectedOn);
    dialEl.style.setProperty('--dial', String(dialIndex + 1));
    dialEl.setAttribute('aria-valuenow', String(dialIndex + 1));
    dialNum.textContent = String(dialIndex + 1);
    const picked = MODES[dialIndex];
    const state = selectedOn ? 'On. ' : modeOn ? 'Not applied yet. ' : 'Off. ';
    tipEl.textContent = state + picked.tip;
    paintUI();
    try {
      sessionStorage.setItem('w3dial', String(dialIndex));
      sessionStorage.setItem('w3applied', String(appliedIndex));
      sessionStorage.setItem('w3on', modeOn ? '1' : '0');
    } catch (err) { /* private mode */ }
  }

  function resetGesture() {
    zoomCap = null;
    zoomArmed = true;
    mustLeave = false;
    armed = false;
    holding = false;
    bayOpen = false;
    flickT = [];
  }

  function onZone(e, name) {
    const el = e.target instanceof Element ? e.target : null;
    return !!(el && el.closest(`[data-w3="${name}"]`));
  }

  function wheelAxis(e, axis) {
    let d = axis === 'x' ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 40;
    else if (e.deltaMode === 2) d *= axis === 'x' ? root.clientWidth : root.clientHeight;
    return d;
  }

  function shotPastEnd(e, dy) {
    const el = e.target instanceof Element ? e.target : null;
    const scroller = el && el.closest('.w3-page-shot');
    if (!scroller) return false;
    const atBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
    const atTop = scroller.scrollTop <= 0;
    return (dy > 0 && atBottom) || (dy < 0 && atTop);
  }

  function isFlick(dy) {
    const now = performance.now();
    flickT.push({ now, dy });
    flickT = flickT.filter(s => now - s.now < 160);
    const total = flickT.reduce((sum, s) => sum + Math.abs(s.dy), 0);
    const peak = flickT.reduce((max, s) => Math.max(max, Math.abs(s.dy)), 0);
    return peak > 70 || total > 220;
  }

  function shouldZoom(e, mode, dy, dx) {
    if (mode === 'sideways') return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8;
    if (mode === 'overscroll') return onZone(e, 'edge') || shotPastEnd(e, dy);
    if (mode === 'armed') return armed;
    if (mode === 'hold') return holding;
    if (mode === 'rail') return onZone(e, 'rail');
    if (mode === 'stills') return page.hidden;
    if (mode === 'flick') return isFlick(dy);
    if (mode === 'seam') return onZone(e, 'seam');
    if (mode === 'pinch') return e.ctrlKey && !!dy;
    if (mode === 'bay') return bayOpen && zoomArmed && onZone(e, 'bay');
    return false;
  }

  function setDial(index) {
    dialIndex = (index + MODES.length) % MODES.length;
    paintMode();
  }

  function applyDial() {
    if (modeOn && appliedIndex === dialIndex) modeOn = false;
    else {
      modeOn = true;
      appliedIndex = dialIndex;
    }
    resetGesture();
    paintMode();
  }

  function dialFromPointer(e) {
    const r = dialEl.getBoundingClientRect();
    const ang = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    const deg = (ang * 180 / Math.PI + 90 + 360) % 360;
    setDial(Math.round(deg / 36) % MODES.length);
  }

  build();
  sync();
  try {
    const saved = Number(sessionStorage.getItem('w3dial'));
    const savedApplied = Number(sessionStorage.getItem('w3applied'));
    if (saved >= 0 && saved < MODES.length) dialIndex = saved;
    if (savedApplied >= 0 && savedApplied < MODES.length) appliedIndex = savedApplied;
    modeOn = sessionStorage.getItem('w3on') === '1';
  } catch (err) { /* private mode */ }
  latch();
  resetGesture();
  paintMode();

  addEventListener('wheel', e => {
    const el = e.target instanceof Element ? e.target : null;
    if (el && el.closest('.w3-ui')) return;
    const mode = activeMode();
    if (!mode || autoOn) return;
    if (e.ctrlKey && mode !== 'pinch') return;
    const dy = wheelAxis(e, 'y');
    const dx = wheelAxis(e, 'x');
    if (!dy && !dx) return;
    if (!latched) {
      e.preventDefault();
      zoomBy(mode === 'sideways' && Math.abs(dx) > Math.abs(dy) ? dx : (dy || dx));
      return;
    }
    if (!shouldZoom(e, mode, dy, dx)) return;
    e.preventDefault();
    zoomBy(mode === 'sideways' ? dx : (dy || dx));
  }, { passive: false, capture: true });

  bayEl.addEventListener('pointerenter', () => {
    if (activeMode() !== 'bay') return;
    noteReturned();
    bayOpen = zoomArmed;
  });
  bayEl.addEventListener('pointerleave', e => {
    const to = e.relatedTarget;
    if (to instanceof Element && bayEl.contains(to)) return;
    noteLeftZone();
    bayOpen = false;
  });

  let touchX = 0, touchY = 0, touchZoom = false, touchMode = '', touchStamp = 0;
  addEventListener('touchstart', e => {
    const mode = activeMode();
    touchMode = mode || '';
    touchX = e.changedTouches[0].clientX;
    touchY = e.changedTouches[0].clientY;
    touchStamp = performance.now();
    if (!mode) { touchZoom = false; return; }
    if (!latched) { touchZoom = true; return; }
    if (mode === 'bay' && onZone(e, 'bay')) noteReturned();
    touchZoom = shouldZoom(e, mode, 1, 0) || (mode === 'sideways') || (mode === 'flick') || (mode === 'pinch' && e.touches.length > 1);
    if (mode === 'bay') touchZoom = bayOpen && zoomArmed && onZone(e, 'bay');
  }, { passive: true });
  addEventListener('touchmove', e => {
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    const dx = touchX - x;
    const dy = touchY - y;
    const mode = touchMode;
    if (!mode) { touchX = x; touchY = y; return; }
    if (mode === 'sideways' && latched) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
        e.preventDefault();
        zoomBy(dx);
      }
    } else if (mode === 'flick' && latched) {
      const speed = Math.abs(dy) / Math.max(16, performance.now() - touchStamp);
      if (speed > 0.85) {
        e.preventDefault();
        zoomBy(dy);
      }
    } else if (touchZoom || !latched) {
      if (!latched || touchZoom) {
        e.preventDefault();
        zoomBy(mode === 'pinch' && e.touches.length > 1 ? dy : dy);
      }
    }
    touchX = x;
    touchY = y;
  }, { passive: false });
  addEventListener('touchend', () => { touchZoom = false; });
  addEventListener('touchcancel', () => { touchZoom = false; });

  dialEl.addEventListener('pointerdown', e => {
    dialEl.setPointerCapture(e.pointerId);
    modesEl.classList.add('is-open');
    dialFromPointer(e);
  });
  dialEl.addEventListener('pointermove', e => {
    if (!dialEl.hasPointerCapture(e.pointerId)) return;
    dialFromPointer(e);
  });
  dialEl.addEventListener('pointerup', () => modesEl.classList.remove('is-open'));
  dialEl.addEventListener('pointercancel', () => modesEl.classList.remove('is-open'));
  dialEl.addEventListener('wheel', e => {
    e.preventDefault();
    setDial(dialIndex + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });
  dialEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); setDial(dialIndex + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); setDial(dialIndex - 1); }
  });
  applyBtn.addEventListener('click', applyDial);
  chipBtn.addEventListener('click', () => { armed = true; paintMode(); });
  leaveBtn.addEventListener('click', () => goToSlot(slotOf(Math.round(depth) + 1)));
  holdPad.addEventListener('pointerdown', e => {
    holding = true;
    paintMode();
    holdPad.setPointerCapture(e.pointerId);
  });
  holdPad.addEventListener('pointerup', () => { holding = false; paintMode(); });
  holdPad.addEventListener('pointercancel', () => { holding = false; paintMode(); });
  addEventListener('keydown', e => {
    if (e.code !== 'Space' || e.repeat || activeMode() !== 'hold') return;
    const typing = e.target instanceof Element && e.target.closest('button, a, [data-w3="dial"]');
    if (typing) return;
    e.preventDefault();
    holding = true;
    paintMode();
  });
  addEventListener('keyup', e => {
    if (e.code !== 'Space' || !holding) return;
    holding = false;
    paintMode();
  });

  addEventListener('resize', () => sync());

  homeBtn.addEventListener('click', () => goToSlot(0));
  autoBtn.addEventListener('click', toggleAuto);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerleave', onLeave);

  root.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    // when focus is inside the iframe, let the page keep the keys
    if (latched && document.activeElement === frame) return;
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    goToSlot(slotOf(depth + step));
  });

  frame.addEventListener('load', () => {
    if (frame.hidden || !frame.src) return;
    // a blocked frame stays on about:blank; a real cross-origin page throws on access
    let blocked = false;
    try {
      const doc = frame.contentDocument;
      // cross-origin success throws or has no document. X-Frame-Options leaves about:blank
      blocked = !!doc && doc.URL === 'about:blank';
    } catch (err) {
      blocked = false;
    }
    if (blocked) {
      frame.classList.remove('is-live');
      frame.style.opacity = '0';
      return;
    }
    frame.classList.add('is-live');
    frame.style.opacity = '1';
  });

  if (location.search === '?check') {
    console.assert(MODES.length === 10 && dialEl && applyBtn && tipEl, 'mode dial ready');
    console.assert(PROJECTS.some(p => p.url === 'puffpuffstop.com' && p.shot), 'puffpuffstop wired');
    console.assert(PROJECTS.find(p => p.url === 'jinglelabs.com.au').embed !== false, 'jinglelabs requests the live site');
  }
})();

