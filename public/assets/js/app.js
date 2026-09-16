const shareButton = document.querySelector("#shareButton");
const toast = document.querySelector("#toast");
const year = document.querySelector("#year");
const numberFormatter = new Intl.NumberFormat("ru-RU");
const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// После публикации вставьте сюда полный адрес, например: "https://yuxia.me"
const SITE_URL = "";

if (year) {
  year.textContent = String(new Date().getFullYear());
}

let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2400);
}

async function copySiteLink() {
  const linkToCopy = SITE_URL.trim() || window.location.href;
  try {
    await navigator.clipboard.writeText(linkToCopy);
    showToast("Ссылка на сайт скопирована ✨");
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = linkToCopy;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();
    showToast(copied ? "Ссылка на сайт скопирована ✨" : "Не удалось скопировать ссылку");
  }
}

shareButton?.addEventListener("click", copySiteLink);

function updateStat(name, value, formatter = numberFormatter) {
  if (!Number.isFinite(value)) return;
  const formattedValue = formatter.format(value);
  document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
    element.textContent = formattedValue;
  });
}

async function loadSocialStats() {
  try {
    const response = await fetch("/api/stats", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return;

    const stats = await response.json();
    updateStat("telegram", stats.telegram);
    updateStat("tiktok-followers", stats.tiktokFollowers);
    updateStat("tiktok-likes", stats.tiktokLikes, compactFormatter);
  } catch {
    // Сохраняем резервные значения из HTML, если API временно недоступен.
  }
}

loadSocialStats();

function createStardust() {
  const container = document.querySelector("#stardust");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!container || reduceMotion) return;

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 18; index += 1) {
    const particle = document.createElement("span");
    const size = (Math.random() * 3 + 2).toFixed(1);
    const drift = (Math.random() * 54 - 27).toFixed(0);
    particle.className = "dust";
    particle.style.left = `${(Math.random() * 98).toFixed(1)}%`;
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--drift", `${drift}px`);
    particle.style.setProperty("--duration", `${(Math.random() * 8 + 12).toFixed(1)}s`);
    particle.style.setProperty("--delay", `${(Math.random() * -18).toFixed(1)}s`);
    fragment.appendChild(particle);
  }

  container.appendChild(fragment);
}

createStardust();
