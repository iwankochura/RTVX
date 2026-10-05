// ================================================================
// RTVX — page interactions
// ================================================================

const shareButton = document.querySelector("#shareButton");
const copyEmailButton = document.querySelector("#copyEmail");
const contactEmail = document.querySelector("#contactEmail");
const themeToggle = document.querySelector("#themeToggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const toast       = document.querySelector("#toast");
const year        = document.querySelector("#year");

const numberFormatter  = new Intl.NumberFormat("ru-RU");
const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

if (year) year.textContent = String(new Date().getFullYear());

function setTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (themeColor) themeColor.content = dark ? "#0b1117" : "#e8edef";
  if (themeToggle) {
    const label = dark ? "Включить светлую тему" : "Включить тёмную тему";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-pressed", String(dark));
  }
}

setTheme(document.documentElement.dataset.theme);
themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  try { localStorage.setItem("rtvx-theme", nextTheme); } catch { /* Theme still changes. */ }
});

// ── 1. Russian Pluralisation ─────────────────────────────────────
function getRussianPlural(number, [one, few, many]) {
  const abs    = Math.abs(Math.floor(number));
  const mod10  = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1)                  return one;
  if (mod10 >= 2 && mod10 <= 4)    return few;
  return many;
}

const PLURAL_DICTIONARY = {
  "telegram":        ["подписчик",       "подписчика",       "подписчиков"],
  "tiktok-followers":["подписчик",       "подписчика",       "подписчиков"],
  "tiktok-likes":    ["лайк",            "лайка",            "лайков"],
};

// ── 2. Toast / Link Copy ─────────────────────────────────────────
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

async function copyText(text, successMessage) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    try { copied = document.execCommand("copy"); }
    catch { copied = false; }
    finally { ta.remove(); }
  }
  showToast(copied ? successMessage : "Не удалось скопировать");
}
shareButton?.addEventListener("click", () => copyText(location.href.split("#")[0], "Ссылка на сайт скопирована ✨"));
copyEmailButton?.addEventListener("click", () => copyText(contactEmail.textContent.trim(), "Адрес почты скопирован"));

// ── 3. Live Social Stats ─────────────────────────────────────────
function updateStat(name, value, fmt = numberFormatter) {
  if (!Number.isFinite(value)) return;
  const str = fmt.format(value);
  document.querySelectorAll(`[data-stat="${name}"]`).forEach(el => (el.textContent = str));
  if (PLURAL_DICTIONARY[name]) {
    const label = getRussianPlural(value, PLURAL_DICTIONARY[name]);
    document.querySelectorAll(`[data-stat-label="${name}"]`).forEach(el => (el.textContent = label));
  }
}

async function loadSocialStats() {
  try {
    const res = await fetch("/api/stats", { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return;
    const s = await res.json();
    updateStat("telegram",         s.telegram);
    updateStat("tiktok-followers", s.tiktokFollowers);
    updateStat("tiktok-likes",     s.tiktokLikes, compactFormatter);
  } catch {}
}
loadSocialStats();
setInterval(loadSocialStats, 2 * 60 * 1000);

// ── 4. Ambient Fog Particles ──────────────────────────────────────
function createStardust() {
  const container    = document.querySelector("#stardust");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!container || reduceMotion) return;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "dust";
    p.style.left = `${(Math.random() * 98).toFixed(1)}%`;
    p.style.setProperty("--size",     `${(Math.random() * 3 + 2).toFixed(1)}px`);
    p.style.setProperty("--drift",    `${(Math.random() * 54 - 27).toFixed(0)}px`);
    p.style.setProperty("--duration", `${(Math.random() * 8 + 12).toFixed(1)}s`);
    p.style.setProperty("--delay",    `${(Math.random() * -18).toFixed(1)}s`);
    frag.appendChild(p);
  }
  container.appendChild(frag);
}
createStardust();

// ================================================================
// 5. LIQUID GLASS 3-D TILT ENGINE — PORTAL & CARD UNIFIED 3D PHYSICS
// Zero jitter, window-tracked active card, independent CSS tokens
// ================================================================
function initLiquidTilt() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (isMobile) return;

  const portal = document.querySelector(".portal");
  const PORTAL_MAX_TILT = 5.0;
  let portalCurX = 0, portalCurY = 0;
  let portalTarX = 0, portalTarY = 0;

  // 1. Whole portal follows cursor smoothly across the page
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (portal) {
      const pNormX = (e.clientX / window.innerWidth) - 0.5;
      const pNormY = (e.clientY / window.innerHeight) - 0.5;
      portalTarX = -pNormY * PORTAL_MAX_TILT * 2;
      portalTarY =  pNormX * PORTAL_MAX_TILT * 2;
    }
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    portalTarX = 0;
    portalTarY = 0;
  }, { passive: true });

  // 2. Individual cards with stable non-rotating wrappers for 100% jitter-free 3D tilt
  const cardItems = [];
  const wrappers = document.querySelectorAll(".channel-card-wrap, .stat-card-wrap");

  wrappers.forEach(wrap => {
    const cardEl = wrap.querySelector(".glass-liquid");
    if (!cardEl) return;

    const isChannel = cardEl.classList.contains("channel-card");
    const item = {
      wrap,
      cardEl,
      isChannel,
      maxTilt: isChannel ? 11.5 : 3.5,
      curX: 0,
      curY: 0,
      tarX: 0,
      tarY: 0,
      mouseX: 0,
      mouseY: 0,
      tarMouseX: 0,
      tarMouseY: 0,
      hovering: false,
    };
    cardItems.push(item);

    wrap.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      item.hovering = true;
      const rect = wrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      // Instant Glare Seeding: place specular glare directly under cursor immediately
      item.mouseX = x;
      item.mouseY = y;
      item.tarMouseX = x;
      item.tarMouseY = y;
      cardEl.style.setProperty("--mouse-x", `${x.toFixed(1)}px`);
      cardEl.style.setProperty("--mouse-y", `${y.toFixed(1)}px`);

      const normX = Math.max(-0.5, Math.min(0.5, (x / rect.width) - 0.5));
      const normY = Math.max(-0.5, Math.min(0.5, (y / rect.height) - 0.5));
      item.tarX = -normY * item.maxTilt * 2;
      item.tarY =  normX * item.maxTilt * 2;
    }, { passive: true });

    wrap.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      item.hovering = true;
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = Math.max(-0.5, Math.min(0.5, (x / rect.width) - 0.5));
      const normY = Math.max(-0.5, Math.min(0.5, (y / rect.height) - 0.5));

      // Physical 3D tilt: side under cursor sinks deepest into the screen
      item.tarX = -normY * item.maxTilt * 2;
      item.tarY =  normX * item.maxTilt * 2;

      item.tarMouseX = Math.max(0, Math.min(rect.width, x));
      item.tarMouseY = Math.max(0, Math.min(rect.height, y));
    }, { passive: true });

    wrap.addEventListener("pointerleave", () => {
      item.hovering = false;
      item.tarX = 0;
      item.tarY = 0;
    }, { passive: true });
  });

  const LERP_PORTAL = 0.08;
  const LERP_CARD   = 0.14;
  const LERP_GLARE  = 0.18;

  function tick() {
    // Animate Portal tilt
    if (portal) {
      portalCurX += (portalTarX - portalCurX) * LERP_PORTAL;
      portalCurY += (portalTarY - portalCurY) * LERP_PORTAL;
      portal.style.setProperty("--portal-tilt-x", `${portalCurX.toFixed(2)}deg`);
      portal.style.setProperty("--portal-tilt-y", `${portalCurY.toFixed(2)}deg`);
    }

    // Animate Cards tilt
    cardItems.forEach(item => {
      const { cardEl } = item;

      item.curX += (item.tarX - item.curX) * LERP_CARD;
      item.curY += (item.tarY - item.curY) * LERP_CARD;

      item.mouseX += (item.tarMouseX - item.mouseX) * LERP_GLARE;
      item.mouseY += (item.tarMouseY - item.mouseY) * LERP_GLARE;

      const atRest = !item.hovering && Math.abs(item.curX) < 0.02 && Math.abs(item.curY) < 0.02;
      const finalX = atRest ? 0 : item.curX;
      const finalY = atRest ? 0 : item.curY;

      cardEl.style.setProperty("--card-tilt-x", `${finalX.toFixed(2)}deg`);
      cardEl.style.setProperty("--card-tilt-y", `${finalY.toFixed(2)}deg`);
      cardEl.style.setProperty("--mouse-x", `${item.mouseX.toFixed(1)}px`);
      cardEl.style.setProperty("--mouse-y", `${item.mouseY.toFixed(1)}px`);
    });

    rafId = requestAnimationFrame(tick);
  }

  let rafId = requestAnimationFrame(tick);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  });
}

initLiquidTilt();

// ================================================================
// 6. INTERACTIVE FOG BACKGROUND CANVAS
// Fluid multi-harmonic sine waves + cursor disturbance + idle wander
// ================================================================
function initLiquidCanvas() {
  const canvas = document.querySelector("#liquidCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, dpr = 1;
  let time = 0;
  let rafId = null;
  let lastInteraction = performance.now();

  const ptr = { x: -2000, y: -2000, tx: -2000, ty: -2000, active: false };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W   = innerWidth;
    H   = innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduceMotion) draw();
  }

  function onPointer(cx, cy) {
    ptr.tx = cx; ptr.ty = cy;
    ptr.active = true;
    lastInteraction = performance.now();
  }

  window.addEventListener("resize",       resize,                             { passive: true });
  window.addEventListener("pointermove",  e => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener("touchstart",   e => e.touches[0] && onPointer(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener("touchmove",    e => e.touches[0] && onPointer(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener("pointerleave", () => (ptr.active = false),          { passive: true });
  resize();

  function getLayers(dark) {
    if (dark) return [
      { by: 0.42, a1: 44, f1: 0.0015, a2: 24, f2: 0.0032, spd:  0.014, stops: [[0,"rgba(124,148,158,.10)"],[.5,"rgba(61,83,94,.08)"],[1,"rgba(11,17,23,0)"]] },
      { by: 0.57, a1: 54, f1: 0.002,  a2: 28, f2: 0.0042, spd: -0.018, stops: [[0,"rgba(145,160,167,.08)"],[.5,"rgba(57,74,82,.07)"],[1,"rgba(11,17,23,0)"]] },
      { by: 0.72, a1: 64, f1: 0.0012, a2: 32, f2: 0.0026, spd:  0.010, stops: [[0,"rgba(204,54,66,.055)"],[.6,"rgba(91,111,119,.06)"],[1,"rgba(11,17,23,0)"]] },
    ];
    return [
      { by: 0.42, a1: 44, f1: 0.0015, a2: 24, f2: 0.0032, spd:  0.014, stops: [[0,"rgba(180,194,201,.23)"],[.5,"rgba(230,235,238,.19)"],[1,"rgba(255,255,255,0)"]] },
      { by: 0.57, a1: 54, f1: 0.002,  a2: 28, f2: 0.0042, spd: -0.018, stops: [[0,"rgba(117,137,148,.15)"],[.5,"rgba(201,211,215,.17)"],[1,"rgba(255,255,255,0)"]] },
      { by: 0.72, a1: 64, f1: 0.0012, a2: 32, f2: 0.0026, spd:  0.010, stops: [[0,"rgba(181,49,58,.06)"],[.6,"rgba(103,120,129,.11)"],[1,"rgba(255,255,255,0)"]] },
    ];
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const layers = getLayers(document.documentElement.dataset.theme === "dark");
    const idle   = performance.now() - lastInteraction > 1800;

    // Smooth pointer lerp / idle wander
    if (idle) {
      const wx = W * (0.5 + 0.32 * Math.sin(time * 0.013));
      const wy = H * (0.55 + 0.14 * Math.cos(time * 0.017));
      ptr.x += (wx - ptr.x) * 0.035;
      ptr.y += (wy - ptr.y) * 0.035;
    } else if (ptr.active) {
      ptr.x += (ptr.tx - ptr.x) * 0.09;
      ptr.y += (ptr.ty - ptr.y) * 0.09;
    }

    layers.forEach(l => {
      const baseY = H * l.by;
      ctx.beginPath();
      ctx.moveTo(0, H);

      for (let x = 0; x <= W + 8; x += 8) {
        const w1 = Math.sin(x * l.f1 + time * l.spd)           * l.a1;
        const w2 = Math.cos(x * l.f2 - time * l.spd * 0.7)     * l.a2;

        // Cursor / wander ripple disturbance
        let dist = 0;
        const dx = x - ptr.x;
        const dy = baseY - ptr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 200000) {
          const infl = Math.exp(-d2 / 50000);
          dist = Math.sin(infl * Math.PI * 2 + time * 0.11) * (idle ? 14 : 22) * infl;
        }

        x === 0
          ? ctx.lineTo(0, baseY + w1 + w2 + dist)
          : ctx.lineTo(x, baseY + w1 + w2 + dist);
      }

      ctx.lineTo(W, H);
      ctx.closePath();

      const g = ctx.createLinearGradient(0, baseY - l.a1 - 30, 0, H);
      l.stops.forEach(([pos, col]) => g.addColorStop(pos, col));
      ctx.fillStyle = g;
      ctx.fill();
    });
  }

  function loop() {
    time++;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  if (!reduceMotion) {
    rafId = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else                 { rafId = requestAnimationFrame(loop); }
    });
  } else {
    draw();
  }
}

initLiquidCanvas();
