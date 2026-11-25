const panels = [...document.querySelectorAll(".panel")];
const ticks = [...document.querySelectorAll(".ticks i")];
const counter = document.getElementById("counter");
const tags = document.getElementById("tags");
const chrome = document.getElementById("chrome");
const inspected = document.querySelector(".inspected");
const scramble = document.getElementById("scramble");
const foam = document.getElementById("foam");

const TAGS = [
  "",
  "IPHONE  MAC  ANDROID",
  "OFFICE · OUTREACH · SALES",
  "IOS  ANDROID  WEB",
  "CHECK  GENERATE  API",
  "SUGGEST  VOTE  SYNC",
  "RADIO  PODCASTS  DIGITAL",
  "OPEN SOURCE  AGENTS  HUMANS",
  ""
];

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789_";
const FOAM_GLYPHS = "{}[]<>/\\|=+*#@$%&?;:~";

function pad(n) {
  return String(n).padStart(2, "0");
}

function setActive(index) {
  ticks.forEach((tick, i) => tick.classList.toggle("on", i === index));
  if (index === 0 || index === panels.length - 1) {
    chrome.hidden = true;
    return;
  }
  chrome.hidden = false;
  counter.textContent = pad(index);
  tags.textContent = TAGS[index] || "";
}

function nearestPanel() {
  const mid = window.scrollY + window.innerHeight * 0.45;
  let best = 0;
  let dist = Infinity;
  panels.forEach((panel, i) => {
    const top = panel.offsetTop;
    const d = Math.abs(mid - top);
    if (d < dist) {
      dist = d;
      best = i;
    }
  });
  return best;
}

let last = -1;
function onScroll() {
  const index = nearestPanel();
  if (index !== last) {
    last = index;
    setActive(index);
  }
  if (inspected) {
    inspected.classList.toggle("swap", index === 3 && window.scrollY > inspected.offsetTop + 40);
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

if (scramble) {
  const words = ["cam", "zorb", "hertz", "jingle", "engine", "shuffle"];
  let i = 0;
  setInterval(() => {
    const next = words[i % words.length];
    i += 1;
    let ticksLeft = 8;
    const timer = setInterval(() => {
      scramble.textContent = Array.from(next, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
      ticksLeft -= 1;
      if (ticksLeft <= 0) {
        clearInterval(timer);
        scramble.textContent = next;
      }
    }, 40);
  }, 2200);
}

if (foam) {
  const count = 28;
  for (let i = 0; i < count; i += 1) {
    const span = document.createElement("span");
    span.textContent = FOAM_GLYPHS[i % FOAM_GLYPHS.length];
    span.style.left = `${(i * 37) % 100}%`;
    span.style.top = `${(i * 53) % 100}%`;
    span.style.opacity = String(0.18 + (i % 5) * 0.08);
    foam.appendChild(span);
  }
}

document.querySelectorAll(".eq b").forEach((bar, i) => {
  bar.style.animationDelay = `${i * 0.08}s`;
  bar.style.height = `${30 + ((i * 17) % 70)}%`;
});
