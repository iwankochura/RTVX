const STATS_KEY = "social-stats:v1";
const FRESH_FOR_MS = 2 * 60 * 1000;
const TELEGRAM_URL = "https://t.me/yuxiazx";
const TIKTOK_URL = "https://www.tiktok.com/@yuxiazxc";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      ...extraHeaders,
    },
  });
}

async function fetchProfile(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return response.text();
}

async function getTelegramCount() {
  const html = await fetchProfile(TELEGRAM_URL);
  const extra = html.match(/tgme_page_extra[^>]*>\s*([^<]+)</i)?.[1] || "";
  const count = Number(extra.replace(/[^\d]/g, ""));

  if (!Number.isFinite(count) || count < 0) {
    throw new Error("Telegram subscriber count was not found");
  }

  return count;
}

async function getTikTokStats() {
  const html = await fetchProfile(TIKTOK_URL);
  const followers = html.match(/"followerCount"\s*:\s*"?(\d+)"?/)?.[1];
  const likes = html.match(/"(?:heartCount|heart)"\s*:\s*"?(\d+)"?/)?.[1];

  if (!followers || !likes) {
    throw new Error("TikTok statistics were not found");
  }

  return {
    followers: Number(followers),
    likes: Number(likes),
  };
}

async function readStoredStats(env) {
  return env.STATS_KV.get(STATS_KEY, "json");
}

function isFresh(stats) {
  return Boolean(
    stats?.updatedAt && Date.now() - Date.parse(stats.updatedAt) < FRESH_FOR_MS,
  );
}

async function refreshStats(env) {
  const previous = (await readStoredStats(env)) || {};
  const [telegram, tiktok] = await Promise.allSettled([
    getTelegramCount(),
    getTikTokStats(),
  ]);

  const next = {
    telegram:
      telegram.status === "fulfilled" ? telegram.value : previous.telegram ?? null,
    tiktokFollowers:
      tiktok.status === "fulfilled"
        ? tiktok.value.followers
        : previous.tiktokFollowers ?? null,
    tiktokLikes:
      tiktok.status === "fulfilled"
        ? tiktok.value.likes
        : previous.tiktokLikes ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (![next.telegram, next.tiktokFollowers, next.tiktokLikes].some(Number.isFinite)) {
    throw new Error("No social statistics are available");
  }

  await env.STATS_KV.put(STATS_KEY, JSON.stringify(next));
  return next;
}

async function handleStatsRequest(env, ctx) {
  if (!env.STATS_KV) {
    return json({ error: "Statistics storage is not configured" }, 503);
  }

  const stored = await readStoredStats(env);
  if (stored && isFresh(stored)) {
    return json(stored, 200, { "X-Stats-Cache": "fresh" });
  }

  if (stored) {
    ctx.waitUntil(refreshStats(env).catch((error) => console.error(error.message)));
    return json(stored, 200, { "X-Stats-Cache": "stale" });
  }

  try {
    return json(await refreshStats(env), 200, { "X-Stats-Cache": "miss" });
  } catch (error) {
    console.error(error.message);
    return json({ error: "Statistics are temporarily unavailable" }, 503, {
      "Cache-Control": "no-store",
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stats" && request.method === "GET") {
      return handleStatsRequest(env, ctx);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(refreshStats(env).catch((error) => console.error(error.message)));
  },
};
