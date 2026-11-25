const panels = [...document.querySelectorAll(".panel")];
const tickNav = document.querySelector(".ticks");
const tiles = [...document.querySelectorAll(".tile")];
const scrambleEl = document.querySelector(".scramble");
const foam = document.querySelector(".foam");
const eq = document.querySelector(".eq");
const tagEl = document.querySelector("[data-tag]");
const votes = [...document.querySelectorAll(".vote")];

const PALETTES = [
  [
    ["#111111", "#c6ff3a"],
    ["#4d82ff", "#f4f7ff"],
    ["#5b3ae8", "#111111"],
    ["#111111", "#3ad4ff"],
    ["#7dffe8", "#111111"],
    ["#111111", "#f4f7ff"],
    ["#111111", "#3ad4ff"],
    ["#111111", "#f4f7ff"],
    ["#7dffe8", "#111111"],
    ["#ff6a1a", "#111111"]
  ],
  [
    ["#111111", "#3ad4ff"],
    ["#4d82ff", "#111111"],
    ["#111111", "#3ad4ff"],
    ["#111111", "#3ad4ff"],
    ["#7dffe8", "#111111"],
    ["#6b2fd6", "#f4f7ff"],
    ["#111111", "#3ad4ff"],
    ["#4d82ff", "#111111"],
    ["#1a2744", "#ff6a1a"],
    ["#ff6a1a", "#1a2744"]
  ],
  [
    ["#1a2744", "#ff6a1a"],
    ["#ff6a1a", "#111111"],
    ["#111111", "#3ad4ff"],
    ["#111111", "#3ad4ff"],
    ["#7dffe8", "#111111"],
    ["#6b2fd6", "#f4f7ff"],
    ["#111111", "#3ad4ff"],
    ["#4d82ff", "#111111"],
    ["#1a2744", "#ff6a1a"],
    ["#ff6a1a", "#1a2744"]
  ]
];

const ROOMS = [
  { name: "Kitchen", time: "00:42", left: "58%", top: "8%" },
  { name: "Living", time: "00:08", left: "18%", top: "18%" },
  { name: "Bathroom", time: "01:15", left: "58%", top: "38%" },
  { name: "Entry", time: "02:04", left: "48%", top: "68%" }
];

const VOTE_SETS = [
  [14, 12, 12, 11, 4],
  [14, 13, 12, 12, 11],
  [14, 12, 12, 12, 11]
];

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const FOAM = "#%+x=*:z{}[]<>/\\|&$@?;~01";
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

panels.forEach(() => {
  const i = document.createElement("i");
  tickNav.appendChild(i);
});
const ticks = [...tickNav.querySelectorAll("i")];

function paintTiles(palette, breakGrid) {
  tiles.forEach((tile, i) => {
    const [bg, fg] = palette[i];
    tile.style.background = bg;
    tile.style.color = fg;
    if (i === 5 && breakGrid) {
      tile.style.transform = "translate(18px, -8px) rotate(8deg) scale(.86)";
    } else if (!tile.dataset.flying) {
      tile.style.transform = "";
    }
  });
}

let paletteIndex = 0;
paintTiles(PALETTES[0], false);
if (!reduced) {
  setInterval(() => {
    paletteIndex = (paletteIndex + 1) % PALETTES.length;
    paintTiles(PALETTES[paletteIndex], paletteIndex > 0);
  }, 2600);
}

function nearestPanel() {
  const mid = window.scrollY + window.innerHeight * 0.42;
  let best = 0;
  let dist = Infinity;
  panels.forEach((panel, i) => {
    const d = Math.abs(mid - panel.offsetTop);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

function setTicks(index) {
  const color = panels[index].dataset.tick || "#f4f7ff";
  ticks.forEach((tick, i) => {
    tick.classList.toggle("on", i === index);
    tick.style.background = color;
  });
}

function scatterTiles() {
  const hero = panels[0];
  const next = panels[1];
  const progress = Math.min(1, Math.max(0, (window.scrollY - hero.offsetTop) / (next.offsetTop - hero.offsetTop || 1)));
  tiles.forEach((tile, i) => {
    const col = i === 9 ? 3 : i % 3;
    const row = i < 3 ? 0 : i < 6 ? 1 : 2;
    const dx = (col - 1.2) * 140 * progress;
    const dy = (row - 1) * 90 * progress - progress * 40;
    const rot = (i - 4.5) * 18 * progress;
    tile.dataset.flying = progress > 0.04 ? "1" : "";
    if (progress > 0.02) {
      tile.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
      tile.style.opacity = String(1 - progress * 0.85);
    } else if (i === 5 && paletteIndex > 0) {
      tile.style.opacity = "1";
    } else {
      tile.style.opacity = "1";
    }
  });
}

function onScroll() {
  setTicks(nearestPanel());
  scatterTiles();
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

if (eq) {
  for (let i = 0; i < 22; i += 1) {
    const bar = document.createElement("b");
    bar.style.height = `${28 + ((i * 37) % 72)}%`;
    bar.style.animationDelay = `${(i * 0.11) % 1.6}s`;
    eq.appendChild(bar);
  }
}

if (foam) {
  for (let i = 0; i < 36; i += 1) {
    const span = document.createElement("span");
    span.textContent = FOAM[i % FOAM.length];
    span.style.left = `${(i * 29) % 100}%`;
    span.style.top = `${(i * 47) % 100}%`;
    span.style.opacity = String(0.18 + (i % 6) * 0.08);
    span.style.transform = `rotate(${(i * 23) % 50 - 25}deg)`;
    foam.appendChild(span);
  }
}

if (scrambleEl && !reduced) {
  const words = ["cam", "zorb", "hertz", "jingle", "engine", "shuffle", "norwi"];
  let i = 0;
  const run = () => {
    const next = words[i % words.length];
    i += 1;
    let left = 10;
    const timer = setInterval(() => {
      const n = 4 + (i % 5);
      scrambleEl.textContent = Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
      left -= 1;
      if (left <= 0) {
        clearInterval(timer);
        scrambleEl.textContent = next;
      }
    }, 45);
  };
  run();
  setInterval(run, 2200);
} else if (scrambleEl) {
  scrambleEl.textContent = "cam";
}

if (tagEl) {
  let room = 0;
  const place = () => {
    const item = ROOMS[room % ROOMS.length];
    tagEl.innerHTML = `${item.name} <b>${item.time}</b>`;
    tagEl.style.left = item.left;
    tagEl.style.top = item.top;
    room += 1;
  };
  place();
  if (!reduced) setInterval(place, 2200);
}

if (votes.length && !reduced) {
  let set = 0;
  setInterval(() => {
    set = (set + 1) % VOTE_SETS.length;
    votes.forEach((el, i) => {
      el.textContent = `▲ ${VOTE_SETS[set][i]}`;
    });
  }, 2400);
}

function initHertz() {
  const canvas = document.querySelector(".hertz canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let t = 0;
  let raf = 0;

  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.52;
    const cy = h * 0.36;
    const R = Math.min(w, h) * 0.26;

    ctx.strokeStyle = "rgba(62, 200, 232, 0.16)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i += 1) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * i) / 2.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(62, 200, 232, 0.4)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.95, 0, Math.PI * 2);
    ctx.stroke();

    const ribbons = [
      { color: "#3dff7a", tilt: -0.62 },
      { color: "#e39a2a", tilt: 0.62 }
    ];
    ribbons.forEach((rb) => {
      for (let k = -5; k <= 5; k += 1) {
        ctx.beginPath();
        const rx = R * 1.22;
        const ry = R * 0.34 + k * 2.4;
        const rot = rb.tilt + t * 0.22;
        for (let i = 0; i <= 180; i += 1) {
          const a = (i / 180) * Math.PI * 2;
          const x0 = Math.cos(a) * rx;
          const y0 = Math.sin(a) * ry;
          const x = cx + x0 * Math.cos(rot) - y0 * Math.sin(rot);
          const y = cy + x0 * Math.sin(rot) + y0 * Math.cos(rot);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rb.color;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.62;
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    ctx.beginPath();
    const sy = h * 0.545;
    for (let x = 0; x <= w; x += 2) {
      const y = sy + Math.sin(x * 0.03 + t * 2.4) * 14 + Math.sin(x * 0.08 + t) * 5;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#5ee4ff";
    ctx.lineWidth = 3;
    ctx.stroke();

    t += reduced ? 0 : 0.016;
    raf = requestAnimationFrame(draw);
  }

  size();
  window.addEventListener("resize", size);
  cancelAnimationFrame(raf);
  draw();
}

initHertz();
