const STATS_ENDPOINT =
  "https://yuxia-bio-link.ivankochura0929.workers.dev/api/stats";

export async function onRequestGet() {
  try {
    const upstream = await fetch(STATS_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    const headers = new Headers(upstream.headers);
    headers.set("Cache-Control", "public, max-age=60");
    headers.set("X-Robots-Tag", "noindex");

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error(error.message);
    return Response.json(
      { error: "Statistics are temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export function onRequest() {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}
