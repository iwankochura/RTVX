import assert from "node:assert/strict";
import test from "node:test";

const worker = (await import("../src/worker.js")).default;

test("refreshes social statistics when the cached value is older than two minutes", async () => {
  const staleStats = {
    telegram: 32,
    tiktokFollowers: 2825,
    tiktokLikes: 21500,
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  };
  let stored = staleStats;
  const env = {
    STATS_KV: {
      async get() {
        return stored;
      },
      async put(_key, value) {
        stored = JSON.parse(value);
      },
    },
  };
  const pending = [];
  const ctx = { waitUntil(promise) { pending.push(promise); } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url === "https://t.me/yuxiazx") {
      return new Response('<div class="tgme_page_extra">33 subscribers</div>');
    }
    if (url === "https://www.tiktok.com/@yuxiazxc") {
      return new Response('{"followerCount":2835,"heartCount":21900}');
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const response = await worker.fetch(new Request("https://site.test/api/stats"), env, ctx);
    assert.equal(response.headers.get("X-Stats-Cache"), "stale");
    await Promise.all(pending);
    assert.deepEqual(
      {
        telegram: stored.telegram,
        tiktokFollowers: stored.tiktokFollowers,
        tiktokLikes: stored.tiktokLikes,
      },
      { telegram: 33, tiktokFollowers: 2835, tiktokLikes: 21900 },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
