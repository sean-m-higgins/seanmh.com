import type { APIRoute } from "astro";

// On-demand route: runs in the Cloudflare Worker, not prerendered.
export const prerender = false;

interface AskEnv {
  ANTHROPIC_API_KEY?: string;
  ASK_SECRET?: string;
  ASK_MODEL?: string;
}

const MAX_QUESTION = 500;
const MAX_CONTEXT = 6000;
const MAX_TOKENS = 600;
const DEFAULT_MODEL = "claude-sonnet-5";

// Length-independent comparison so we don't leak the secret via response timing.
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = (locals as { runtime?: { env?: AskEnv } }).runtime?.env;

  if (!env?.ANTHROPIC_API_KEY || !env?.ASK_SECRET) {
    return jsonError("ask service is not configured", 503);
  }

  let body: { question?: unknown; context?: unknown; secret?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("invalid request body", 400);
  }

  // Secret gate — no valid secret means we never call the paid model.
  const secret = typeof body.secret === "string" ? body.secret : "";
  if (!secret || !timingSafeEqual(secret, env.ASK_SECRET)) {
    return jsonError("invalid secret", 401);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return jsonError("question is required", 400);
  if (question.length > MAX_QUESTION) return jsonError("question too long", 400);

  const context =
    typeof body.context === "string" ? body.context.slice(0, MAX_CONTEXT) : "";

  const system = [
    "You are the AI assistant embedded in Sean Higgins' terminal-themed portfolio site.",
    "Answer questions about Sean using ONLY the context below, which is drawn from his résumé and site content.",
    "If the answer is not in the context, say you don't have that information rather than guessing.",
    "Be concise, direct, and friendly. Respond in plain text — no markdown.",
    "",
    "--- CONTEXT ---",
    context,
    "--- END CONTEXT ---",
  ].join("\n");

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.ASK_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "disabled" },
        stream: true,
        system,
        messages: [{ role: "user", content: question }],
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonError(`upstream request failed: ${message}`, 502);
  }

  if (!upstream.ok || !upstream.body) {
    let detail = `model service returned ${upstream.status}`;
    try {
      const errBody = (await upstream.json()) as {
        error?: { message?: string };
      };
      if (errBody?.error?.message) detail = errBody.error.message;
    } catch {}
    return jsonError(detail, 502);
  }

  // Pass the Anthropic SSE stream straight through — the client already parses
  // `content_block_delta` events in this exact wire format.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
};
