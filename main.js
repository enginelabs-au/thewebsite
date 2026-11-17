/*
  The Web Page
  Reads the .world blocks in index.html and fuses them. Nothing here names a site:
  to add one, copy an <article class="world"> block in index.html.
*/
(() => {
  const root = document.documentElement;
  const worlds = [...document.querySelectorAll('.world')];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');   // styles.css keeps the first site below the fold until this is set

  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const ease = t => t * t * (3 - 2 * t);
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
  const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // stable pseudo-random, 0 to 1
  const nameOf = site => site.querySelector('.name').textContent.trim();

  const sites = worlds.filter(w => w.matches('article')).filter(w => {
    const ok = w.id && w.querySelector('.name') && w.querySelector('a.go[href]');
    if (!ok) console.warn('The Web Page: skipped a site block. It needs an id, a .name and an a.go link.', w);
    return ok;
  });

  /* ---------- apertures: (t from 0 to 1, width, height) => SVG path ----------
     Each must start small and cover the whole viewport at t = 1. After adding one, open /?check. */

  const n1 = v => v.toFixed(1);
  const rect = (x, y, w, h) => w > 0 && h > 0 ? `M${n1(x)} ${n1(y)}h${n1(w)}v${n1(h)}h${n1(-w)}Z` : '';
  const poly = pts => 'M' + pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join('L') + 'Z';

  const APERTURES = {
    // a dial opening from the centre
    iris(t, w, h) {
      const r = t * Math.hypot(w, h) / 2;
      return `M${n1(w / 2 - r)} ${n1(h / 2)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0Z`;
    },
    // an eight-toothed cog that turns as it grows
    cog(t, w, h) {
      const R = t * Math.hypot(w, h) * .6, pts = [];
      for (let i = 0; i < 32; i++) {
        const a = t * Math.PI / 4 + i / 32 * Math.PI * 2, r = R * (i % 4 < 2 ? 1 : .84);
        pts.push([w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r]);
      }
      return poly(pts);
    },
    // a house rising from the bottom edge
    house(t, w, h) {
      const a = t * w * 1.05, b = t * h * 1.05, c = t * h * 1.1;
      return poly([[w / 2 - a, h], [w / 2 - a, h - b], [w / 2, h - b - c], [w / 2 + a, h - b], [w / 2 + a, h]]);
    },
    // lines filling in from the left, top to bottom, like typing
    rows(t, w, h) {
      const n = 7;
      let d = '';
      for (let i = 0; i < n; i++) d += rect(0, i * h / n, w * clamp((t - .6 * i / (n - 1)) / .4), h / n + .5);
      return d;
    },
    // two halves of a deck interleaving from top and bottom, middle cards first
    riffle(t, w, h) {
      const n = w < 700 ? 6 : 12;
      let d = '';
      for (let i = 0; i < n; i++) {
        const late = (Math.abs(i - (n - 1) / 2) - .5) / (n / 2 - 1);
        const hh = h * ease(clamp((t - .35 * late) / .65));
        d += rect(i * w / n, i % 2 ? h - hh : 0, w / n + .5, hh);
      }
      return d;
    },
    // equaliser bars that rise unevenly, then fatten until they meet
    bars(t, w, h) {
      const n = w < 700 ? 10 : 18, slot = w / n;
      let d = '';
      for (let i = 0; i < n; i++) {
        const hh = h * clamp(t / (.5 + .5 * rnd(i))), bw = slot * (.45 + .55 * clamp((t - .55) / .45)) + .5;
        d += rect(i * slot + (slot - bw) / 2, h - hh, bw, hh);
      }
      return d;
    },
    // a diagonal cut that widens
    slash(t, w, h) {
      return poly([[w * (2 - t), -h], [w * (2 + t), -h], [w * (t - 1), 2 * h], [w * (-1 - t), 2 * h]]);
    },
    // a fresh page laid on from below, straightening as it lands
    sheet(t, w, h) {
      const y = h * (1 - t), tilt = (1 - t) * w * .05;
      return poly([[0, y + tilt], [w, y - tilt], [w, h + 9], [0, h + 9]]);
    },
  };

  // Self-check: /?check reports in the console any aperture that opens with a jump or leaves a gap.
  if (location.search === '?check') {
    const g = document.createElement('canvas').getContext('2d');
    const covered = (d, w, h) => {   // share of a grid of points, plus the four corners, inside the path
      const path = new Path2D(d);
      const pts = Array.from({ length: 400 }, (_, i) => [(i % 20 + .37) / 20 * w, ((i / 20 | 0) + .41) / 20 * h]);
      pts.push([1, 1], [w - 1, 1], [1, h - 1], [w - 1, h - 1]);
      return pts.filter(([x, y]) => g.isPointInPath(path, x, y)).length / pts.length;
    };
    for (const [name, cut] of Object.entries(APERTURES)) for (const [w, h] of [[1440, 900], [390, 844]]) {
      console.assert(covered(cut(.02, w, h), w, h) < .1, `aperture "${name}" opens with a jump at ${w}×${h}`);
      console.assert(covered(cut(1, w, h), w, h) === 1, `aperture "${name}" leaves a gap when open at ${w}×${h}`);
    }
    console.log(`The Web Page: checked ${Object.keys(APERTURES).length} apertures.`);
  }

  /* ---------- motifs: build artwork into a site's .motif. May return draw(time) for a canvas. ---------- */

  const sketch = (host, paint) => {
    const c = host.appendChild(document.createElement('canvas')), g = c.getContext('2d');
    return t => {
      const w = c.clientWidth, h = c.clientHeight, d = Math.min(devicePixelRatio || 1, 2);
      if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); }
      g.setTransform(d, 0, 0, d, 0, 0);
      g.clearRect(0, 0, w, h);
      paint(g, w, h, t);
    };
  };

  const MOTIFS = {
    // Hertz Labs: a Lissajous figure for the two tones, and the beat they make together
    lissajous(host) {
      host.innerHTML = '<p class="read"><span style="color:#f8b820">LEFT 215 Hz</span><span style="color:#53ddff">TARGET 10.00 Hz · ALPHA</span><span style="color:#2ec98c">RIGHT 225 Hz</span></p>';
      return sketch(host, (g, w, h, t) => {
        const R = Math.min(w, h) * .36, ph = t / 2600;
        g.lineWidth = 1.5;
        for (const [colour, shift, alpha] of [['#f8b820', -.14, .6], ['#2ec98c', 0, 1]]) {
          g.beginPath();
          for (let i = 0; i <= 240; i++) {
            const u = i / 240 * Math.PI * 2;
            g.lineTo(w / 2 + R * Math.sin(3 * u + ph + shift), h / 2 + R * Math.sin(2 * u));
          }
          g.strokeStyle = colour;
          g.globalAlpha = alpha;
          g.stroke();
        }
        g.beginPath();
        for (let x = 0; x <= w; x += 3) g.lineTo(x, h * .84 + h * .035 * Math.sin(Math.PI * x / w) * (Math.sin(x / w * 86 + ph * 8) + Math.sin(x / w * 94 + ph * 9)));
        g.strokeStyle = '#53ddff';
        g.globalAlpha = .75;
        g.stroke();
        g.globalAlpha = 1;
      });
    },

    // Engine Labs: the site's .tags set around a slowly turning ring
    ring(host, site) {
      const words = [...site.querySelectorAll('.tags li')].map(li => li.textContent.trim().toUpperCase());
      const ticks = words.map((_, i) => `<path d="M300 14v20" transform="rotate(${i * 360 / words.length} 300 300)"/>`).join('');
      host.innerHTML = `<svg class="ring" viewBox="0 0 600 600">
        <defs><path id="ring-${esc(site.id)}" d="M300 60a240 240 0 1 1-.01 0"/></defs>
        <circle class="hair" cx="300" cy="300" r="272"/><circle class="hair" cx="300" cy="300" r="208"/>
        <g class="turn"><text><textPath href="#ring-${esc(site.id)}" textLength="1500" lengthAdjust="spacing">${esc(words.join(' · '))} · </textPath></text></g>
        <g class="turn back">${ticks}</g>
      </svg>`;
    },

    // Inspected: a floor plan toured room by room, each with its timestamp
    plan(host) {
      const rooms = [['Living', 10, 10, 220, 160, '00:08'], ['Kitchen', 230, 10, 160, 110, '00:42'], ['Bathroom', 230, 120, 160, 50, '01:15'], ['Bedroom', 10, 170, 150, 120, '01:38'], ['Entry', 160, 170, 230, 120, '02:04']];
      host.innerHTML = `<div class="plan"><svg viewBox="0 0 400 300">
        ${rooms.map(([, x, y, w, h], i) => `<rect class="room" style="--i:${i}" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}
        <rect x="10" y="10" width="380" height="280" rx="14"/><path d="M230 10v160M10 170h380M160 170v120M230 120h160"/>
      </svg>${rooms.map(([name, x, y, w, h, at], i) => `<span class="chip" style="--i:${i};left:${(x + w / 2) / 4}%;top:${(y + h / 2) / 3}%">${name}<b>${at}</b></span>`).join('')}</div>`;
    },

    // yournewhandle: a handle that keeps being regenerated
    handle(host, site) {
      host.innerHTML = '<div class="handle"><b>@</b><span></span><i></i></div>';
      const out = host.querySelector('span'), abc = 'abcdefghijklmnopqrstuvwxyz';
      const names = ['lumikoi', 'sylphora', 'zoftkeld', 'noruvi', 'tavomi', 'velqua'];
      let n = 0, f = 99;
      out.textContent = names[0];
      setInterval(() => {
        if (!site.classList.contains('on')) return;
        if (++f > names[n].length + 34) { n = (n + 1) % names.length; f = 0; }   // rest on each handle for about two seconds
        out.textContent = [...names[n]].map((ch, i) => i < f - 3 ? ch : abc[Math.random() * 26 | 0]).join('');
      }, 60);
    },

    // Shuffle: a queue where votes keep reordering what plays next
    queue(host, site) {
      const votes = [14, 11, 9, 6, 4];
      host.innerHTML = '<ol class="queue">' + votes.map((v, i) =>
        `<li style="--slot:${i}"><b>▲ ${v}</b><i style="width:${[62, 48, 70, 40, 56][i]}%"></i><i style="width:${[34, 28, 42, 22, 30][i]}%"></i></li>`).join('') + '</ol>';
      const rows = [...host.querySelectorAll('li')];
      const ranked = () => rows.map((_, r) => r).sort((a, b) => votes[b] - votes[a]);
      setInterval(() => {
        if (!site.classList.contains('on')) return;
        const rank = ranked(), s = 1 + (Math.random() * (rank.length - 1) | 0);
        votes[rank[s]] = votes[rank[s - 1]] + 1;   // one track gets enough votes to pass the one above it
        rows[rank[s]].firstChild.textContent = '▲ ' + votes[rank[s]];
        ranked().forEach((r, slot) => rows[r].style.setProperty('--slot', slot));
      }, 1700);
    },

    // Jingle Labs: an equaliser
    eq(host) {
      host.innerHTML = '<div class="eq">' + Array.from({ length: 30 }, (_, i) => `<i style="--r:${rnd(i).toFixed(2)}"></i>`).join('') + '</div>';
    },

    // z0rb: glyphs adrift in the thoughtspace
    glyphs(host) {
      const set = '#%×=:+*01z';
      return sketch(host, (g, w, h, t) => {
        g.font = '500 13px "JetBrains Mono", monospace';
        g.fillStyle = '#b8ff57';
        for (let i = 0, n = Math.min(90, w * h / 14000); i < n; i++) {   // sparser on small screens
          const speed = .3 + rnd(i + 200), y = ((rnd(i + 100) - t / 120000 * speed) % 1 + 1) % 1;
          g.globalAlpha = .18 + .5 * Math.abs(Math.sin(t / 1600 * speed + i));
          g.fillText(set[i % set.length], rnd(i) * w, y * h);
        }
        g.globalAlpha = 1;
      });
    },
  };

  /* ---------- build everything that depends on the list of sites ---------- */

  const draws = [];   // [site, draw] for each canvas motif

  sites.forEach((site, i) => {
    const name = site.querySelector('.name'), num = site.querySelector('.num');
    const words = name.innerHTML.replace(/<(?!wbr)[^>]*>/g, '').split(/<wbr>|\s+/).filter(Boolean);
    name.style.setProperty('--len', name.textContent.trim().length);         // sizes the name to fill the width
    name.style.setProperty('--word', Math.max(...words.map(w => w.length)));   // on phones, by its longest word
    if (num) num.textContent = `${pad(i + 1)} / ${pad(sites.length)}`;

    const host = site.querySelector('.motif'), kind = site.dataset.motif;
    if (!host || !kind) return;
    if (!MOTIFS[kind]) return console.warn(`The Web Page: no motif called "${kind}".`, site);
    const draw = MOTIFS[kind](host, site);
    if (draw) draws.push([site, draw]);
  });

  worlds.forEach(w => {
    w.querySelector('h1, h2')?.setAttribute('tabindex', '-1');   // lets the index move focus to a world
    if (w.dataset.aperture && !APERTURES[w.dataset.aperture]) console.warn(`The Web Page: no aperture called "${w.dataset.aperture}", using iris.`, w);
  });

  root.style.setProperty('--n', sites.length);   // the side index and closing list size themselves to fit this many

  const spine = document.querySelector('.spine');
  spine.innerHTML = sites.map(s => `<a href="#${esc(s.id)}" aria-label="${esc(nameOf(s))}"><span>${esc(nameOf(s))}</span></a>`).join('');
  const ticks = [...spine.children];

  const count = document.querySelector('.count');
  const numerals = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  if (count && sites.length) count.textContent = `${numerals[sites.length] || sites.length} ${sites.length === 1 ? 'site' : 'sites'}.`;

  // The title is set in tiles, each dressed as one of the sites.
  const title = document.querySelector('.title');
  if (title && sites.length) {
    const text = title.textContent.trim(), look = i => sites[i].getAttribute('style') || '';
    title.innerHTML = `<span class="sr">${esc(text)}</span>` + text.split(/\s+/).map(word =>
      `<span class="row" aria-hidden="true">${[...word].map(ch => `<span class="tile"><b>${esc(ch)}</b></span>`).join('')}</span>`).join('');
    const tiles = [...title.querySelectorAll('.tile')];
    tiles.forEach((tile, i) => {
      tile.style.cssText = `--dx:${Math.round(rnd(i) * 130 - 65)}vw;--dy:${Math.round(rnd(i + 40) * 110 - 80)}vh;--dr:${Math.round(rnd(i + 80) * 120 - 60)}deg`;   // where it flies when the cover breaks up
      tile.firstChild.style.cssText = look(i % sites.length);
    });
    if (!calm) setInterval(() => {   // split-flap: one tile at a time takes on another site's look
      if (!worlds[0].classList.contains('on')) return;
      const face = tiles[Math.random() * tiles.length | 0].firstChild;
      face.classList.add('flip');
      setTimeout(() => {
        face.style.cssText = look(Math.random() * sites.length | 0);
        face.classList.remove('flip');
      }, 250);
    }, 1100);
  }

  const index = document.querySelector('.index');
  if (index) index.innerHTML = sites.map((s, i) => {
    const href = s.querySelector('a.go').href;
    return `<li style="${esc(s.getAttribute('style') || '')}"><a href="${esc(href)}"><i>${pad(i + 1)}</i><b>${esc(nameOf(s))}</b><span>${esc(new URL(href).hostname.replace(/^www\./, ''))}</span></a></li>`;
  }).join('');

  if (calm) {   // reduced motion: nothing pins or moves, so draw each canvas once and stop here
    const still = () => draws.forEach(([, draw]) => draw(0));
    still();
    addEventListener('resize', still);
    return;
  }

  /* ---------- the scroll engine ---------- */

  const seam = document.querySelector('.seam'), cuts = [...seam.children];
  const theme = document.querySelector('meta[name="theme-color"]');
  const probe = document.body.appendChild(document.createElement('i'));   // measures --wipe in pixels
  probe.style.cssText = 'position:fixed;visibility:hidden;height:var(--wipe)';

  const stage = worlds.map(el => {
    const cs = getComputedStyle(el);
    return {
      el, pin: el.firstElementChild, cut: APERTURES[el.dataset.aperture] || APERTURES.iris,
      bg: cs.getPropertyValue('--bg').trim(), accent: cs.getPropertyValue('--accent').trim(),
      top: 0, p: -1, q: -1, d: '',
    };
  });

  let W = 0, H = 0, wipe = 1, prog = [], active = -1, drawn = '', queued = false;

  function measure() {
    W = root.clientWidth;
    H = stage[0].pin.offsetHeight;
    wipe = probe.offsetHeight || innerHeight;
    stage.forEach(s => { s.top = s.el.offsetTop; s.p = -1; });   // p = -1 forces every world to repaint
    frame();
  }

  function frame() {
    queued = false;
    const y = scrollY;
    prog = stage.map((s, i) => i ? clamp((y - s.top + 1) / wipe) : 1);   // how far each world's aperture has opened
    let now = 0, opening = null;

    stage.forEach((s, i) => {
      const p = prog[i], q = prog[i + 1] || 0;   // q: how far the next world has covered this one
      if (p >= .5) now = i;
      if (p > 0 && p < 1) opening = s;
      if (p === s.p && q === s.q) return;
      s.p = p;
      s.q = q;
      s.d = p > 0 && p < 1 ? s.cut(ease(p), W, H) : '';
      s.el.style.setProperty('--in', ease(p).toFixed(4));
      s.el.style.setProperty('--out', ease(q).toFixed(4));
      s.el.classList.toggle('on', p > 0 && q < 1);
      s.pin.style.clipPath = p >= 1 ? '' : s.d ? `path("${s.d}")` : 'inset(50%)';   // unreached worlds stay readable to assistive tech
    });

    const d = opening ? opening.d : '';
    if (d !== drawn) {
      cuts.forEach(c => c.setAttribute('d', drawn = d));
      if (opening) {
        seam.style.color = opening.accent;
        seam.style.opacity = Math.min(1, (1 - opening.p) * 5).toFixed(2);   // fades as the aperture finishes
      }
    }

    if (now !== active) {
      active = now;
      ticks.forEach((a, i) => worlds[now] === sites[i] ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
      if (theme) theme.content = stage[now].bg;
    }
  }

  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', measure);
  measure();

  if (draws.length) requestAnimationFrame(function loop(t) {
    for (const [site, draw] of draws) if (site.classList.contains('on')) draw(t);
    requestAnimationFrame(loop);
  });

  /* ---------- getting around ---------- */

  const rest = i => stage[i].top + (i ? wipe + 1 : 0);   // the scroll position where world i sits fully open
  const go = (i, behavior = 'smooth') => scrollTo({ top: rest(clamp(i, 0, worlds.length - 1)), behavior });
  const byHash = hash => worlds.findIndex(w => w.id && '#' + w.id === hash);

  addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'), i = a ? byHash(a.getAttribute('href')) : -1;
    if (i < 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    go(i);
    worlds[i].querySelector('h1, h2')?.focus({ preventScroll: true });
  });

  // Tabbing to a link in a world that is covered brings that world into view.
  addEventListener('focusin', e => {
    const i = e.target.matches('a') ? worlds.indexOf(e.target.closest('.world')) : -1;
    if (i >= 0 && (prog[i] < 1 || prog[i + 1] > 0)) requestAnimationFrame(() => go(i));   // after the browser's own scroll to the link
  });

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); go(active + step); }
  });

  addEventListener('load', () => {   // a link such as /#z0rb opens on that site; a reload keeps its place instead
    measure();
    const i = byHash(location.hash);
    if (i > 0 && performance.getEntriesByType('navigation')[0]?.type === 'navigate') go(i, 'instant');
  });
})();
