const CACHE_TTL_SECONDS = 10 * 60;
const TELEGRAM_URL = "https://t.me/yuxiazx";
const TIKTOK_URL = "https://www.tiktok.com/@yuxiazxc";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=60, s-maxage=${CACHE_TTL_SECONDS}`,
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

async function collectStats() {
  const [telegram, tiktok] = await Promise.all([
    getTelegramCount(),
    getTikTokStats(),
  ]);

  return {
    telegram,
    tiktokFollowers: tiktok.followers,
    tiktokLikes: tiktok.likes,
    updatedAt: new Date().toISOString(),
  };
}

async function handleStatsRequest(request, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);

  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set("X-Stats-Cache", "hit");
    return response;
  }

  try {
    const response = json(await collectStats(), 200, {
      "X-Stats-Cache": "miss",
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
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
      return handleStatsRequest(request, ctx);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found" }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
