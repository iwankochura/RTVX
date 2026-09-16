import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicDir = join(root, "public");
const outputDir = join(root, "dist");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else files.push(path);
  }

  return files;
}

const assets = {};

for (const file of await collectFiles(publicDir)) {
  const route = `/${relative(publicDir, file).split(sep).join("/")}`;
  const content = await readFile(file);
  assets[route] = {
    body: content.toString("base64"),
    type: contentTypes[extname(file)] || "application/octet-stream",
  };
}

assets["/"] = assets["/index.html"];

const source = await readFile(join(root, "src", "worker.js"), "utf8");
const worker = `${String.raw`
const INLINE_ASSETS = ${JSON.stringify(assets)};

function decodeAsset(body) {
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function serveAsset(pathname) {
  const asset = INLINE_ASSETS[pathname];
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(decodeAsset(asset.body), {
    headers: {
      "Content-Type": asset.type,
      "Cache-Control": pathname === "/" || pathname.endsWith(".html")
        ? "public, max-age=60"
        : "public, max-age=31536000, immutable",
    },
  });
}
`}
${source.replace("return env.ASSETS.fetch(request);", "return serveAsset(url.pathname);")}`;

await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, "worker.js"), worker);
console.log(`Built dist/worker.js with ${Object.keys(assets).length - 1} static assets.`);
