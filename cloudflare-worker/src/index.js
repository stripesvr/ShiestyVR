// Shiesty VR view counter – Cloudflare Worker + Durable Object.
//   POST /hit   -> adds one view, returns {"count": n}
//   GET  /count -> returns {"count": n} without adding
// A single Durable Object holds the total, so counts are exact (no lost writes).
import { DurableObject } from "cloudflare:workers";

export class ViewCounter extends DurableObject {
  async hit() {
    const count = ((await this.ctx.storage.get("count")) || 0) + 1;
    await this.ctx.storage.put("count", count);
    return count;
  }
  async read() {
    return (await this.ctx.storage.get("count")) || 0;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const origin = request.headers.get("Origin") || "";
    const originOk = allowed.includes(origin);

    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": originOk ? origin : allowed[0] || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Vary": "Origin",
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    const counter = env.COUNTER.get(env.COUNTER.idFromName("shiestyvr.com"));

    if (url.pathname === "/hit") {
      if (request.method !== "POST") return json({ error: "use POST" }, 405);
      // Only count views coming from the real site, so other pages can't inflate it.
      if (!originOk) return json({ error: "origin not allowed" }, 403);
      return json({ count: await counter.hit() });
    }

    if (url.pathname === "/count" || url.pathname === "/") {
      return json({ count: await counter.read() });
    }

    return json({ error: "not found" }, 404);
  },
};
