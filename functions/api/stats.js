import worker from "../../src/worker.js";

export async function onRequestGet(context) {
  const response = await worker.fetch(context.request, context.env, context);
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex");
  return new Response(response.body, { status: response.status, headers });
}

export function onRequest() {
  return Response.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } },
  );
}
