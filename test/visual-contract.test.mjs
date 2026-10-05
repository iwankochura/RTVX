import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RTVX profile has both themes and includes all three links", async () => {
  const [html, css, script] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/assets/css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/assets/js/app.js", import.meta.url), "utf8"),
  ]);

  const profile = html.match(/<section class="profile-panel"[\s\S]*?<\/section>/)?.[0];
  assert.ok(profile);
  assert.match(profile, /assets\/images\/avatar\.png/);
  assert.match(profile, /<h1 id="profile-title">RTVX<\/h1>/);
  assert.match(profile, /@somebodyyy14/);
  assert.match(profile, /class="stats"/);
  assert.match(html, /open\.spotify\.com\/artist\/4z6Gddpc9v2Xrvfk741ldz/);
  assert.match(html, /t\.me\/rtvx929/);
  assert.match(html, /tiktok\.com\/@somebodyyy14/);
  assert.match(html, /id="themeToggle"/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(script, /rtvx-theme/);
  assert.doesNotMatch(script, /yuxia-theme/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
