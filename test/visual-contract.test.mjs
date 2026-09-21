import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("crystal scene is present and motion respects reduced-motion", async () => {
  const [html, css, script] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/assets/css/styles.css", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  ]);

  assert.match(html, /class="crystal-scene"/);
  assert.match(html, /class="crystal crystal--north"/);
  assert.match(css, /\.crystal-scene/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.crystal/);
  assert.match(script, /const theme = saved \|\| "light";/);
});
