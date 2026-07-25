// Cloudflare Pages Function used by the direct terminal origin. The front
// router Worker owns this route at seanmh.com and keeps the same contract.
type PagesFunction<Env> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

interface AskEnv {
  ANTHROPIC_API_KEY?: string;
  ASK_SECRET?: string;
  ASK_MODEL?: string;
  ASK_RL?: {
    get(key: string): Promise<string | null>;
    put(
      key: string,
      value: string,
      options: { expirationTtl: number },
    ): Promise<void>;
  };
}

const MAX_QUESTION = 500;
const MAX_CONTEXT = 12000;
const MAX_BODY_BYTES = 32000;
const MAX_TOKENS = 600;
const DEFAULT_MODEL = "claude-sonnet-5";
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 3600;
const SERVER_CONTEXT_KEY = "server-context";
const MAX_SERVER_CONTEXT = 24000;

const SYSTEM_PROMPT = [
  "You are the assistant embedded in the terminal version of Sean Higgins' personal portfolio site (seanmh.com).",
  "Answer ONLY questions about Sean using the grounding context provided in the user message.",
  "If a question is not about Sean, or the context does not contain the answer, politely decline and steer the visitor toward asking about Sean's experience, projects, education, or how to get in touch.",
  "Keep answers concise and plain-text because this is a terminal. Never invent facts that are not in the context.",
].join(" ");

class AskBodyTooLargeError extends Error {}

async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > MAX_BODY_BYTES
  ) {
    throw new AskBodyTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return JSON.parse("") as unknown;

  const decoder = new TextDecoder();
  let received = 0;
  let json = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      try {
        await reader.cancel();
      } catch {
        // The size error below remains the useful response if cancel fails.
      }
      throw new AskBodyTooLargeError();
    }
    json += decoder.decode(value, { stream: true });
  }

  json += decoder.decode();
  return JSON.parse(json) as unknown;
}

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
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0];
  return (
    request.headers.get("cf-connecting-ip") ||
    forwarded ||
    "unknown"
  ).trim().slice(0, 128) || "unknown";
}

async function isRateLimited(env: AskEnv, ip: string): Promise<boolean> {
  if (!env.ASK_RL) return false;
  const key = `ask:${ip}`;
  let count = 0;
  try {
    count = Number.parseInt((await env.ASK_RL.get(key)) || "0", 10) || 0;
  } catch {
    return false;
  }
  if (count >= RATE_LIMIT) return true;
  try {
    await env.ASK_RL.put(key, String(count + 1), {
      expirationTtl: RATE_WINDOW_SECONDS,
    });
  } catch {
    // The limiter is best effort; KV trouble must not take down the portfolio.
  }
  return false;
}

async function serverContext(env: AskEnv): Promise<string> {
  if (!env.ASK_RL) return "";
  try {
    const value = await env.ASK_RL.get(SERVER_CONTEXT_KEY);
    return value ? value.slice(0, MAX_SERVER_CONTEXT) : "";
  } catch {
    return "";
  }
}

export const onRequestPost: PagesFunction<AskEnv> = async ({
  request,
  env: askEnv,
}) => {
  let parsed: unknown;
  try {
    parsed = await readJsonBody(request);
  } catch (error) {
    if (error instanceof AskBodyTooLargeError) {
      return jsonError("request body too large", 413);
    }
    return jsonError("invalid request body", 400);
  }

  const body =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return jsonError("question is required", 400);
  if (question.length > MAX_QUESTION) return jsonError("question too long", 413);

  if (!askEnv.ANTHROPIC_API_KEY || !askEnv.ASK_SECRET) {
    return jsonError("ask service is not configured", 503);
  }

  if (await isRateLimited(askEnv, clientIp(request))) {
    return jsonError("rate limit reached; please try again later", 429);
  }

  // No valid secret means the paid model is never called.
  const secret = typeof body.secret === "string" ? body.secret : "";
  if (!secret || !timingSafeEqual(secret, askEnv.ASK_SECRET)) {
    return jsonError("invalid secret", 401);
  }

  const clientContext =
    typeof body.context === "string" ? body.context.slice(0, MAX_CONTEXT) : "";
  const extraContext = await serverContext(askEnv);
  const context = extraContext
    ? `${clientContext}\n\n## Detailed background (server-side; not shown on the site)\n${extraContext}`
    : clientContext;

  let upstream: Response;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": askEnv.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: askEnv.ASK_MODEL || DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "disabled" },
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Grounding context about Sean:\n${context}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });
  } catch {
    return jsonError("upstream model request failed", 502);
  }

  if (!upstream.ok || !upstream.body) {
    return jsonError(`model service returned ${upstream.status}`, 502);
  }

  // Pass the Anthropic SSE stream straight through — the client already parses
  // `content_block_delta` events in this exact wire format.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
      "x-content-type-options": "nosniff",
    },
  });
};
