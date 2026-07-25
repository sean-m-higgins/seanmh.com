const VERSIONS = [
  { name: 'a-scroll',   origin: 'https://seanmh-scroll.pages.dev',   weight: 34 },
  { name: 'b-card',     origin: 'https://seanmh-card.pages.dev',     weight: 33 },
  { name: 'c-terminal', origin: 'https://seanmh-terminal.pages.dev', weight: 33 },
];
const COOKIE_NAME = 'pv';
const COOKIE_OPTIONS = 'Path=/; Max-Age=1800; SameSite=Lax; Secure; HttpOnly';
const DOCUMENT_CACHE_CONTROL = 'private, no-store';

// --- /api/ask (Phase 2b) ---------------------------------------------------
// The terminal version's `ask <question>` command POSTs here. The Worker owns
// /api/* and answers it directly, before any version proxying. The Anthropic
// API key lives only in a Worker secret (ANTHROPIC_API_KEY); it never reaches
// the client.
//
// The endpoint is NOT public: callers must present the shared access secret
// (ASK_SECRET Worker secret) that the terminal client collects at its masked
// prompt and sends as `secret` in the JSON body. No valid secret ⇒ no paid
// model call. Rotate ASK_SECRET to revoke access. The KV namespace (ASK_RL)
// still applies a soft per-IP rate limit, which also throttles brute-force
// guesses at the secret, and doubles as storage for optional server-side
// grounding context (see ASK_SERVER_CONTEXT_KEY below).
//
// This route degrades gracefully: if a secret/binding is missing, it returns
// a friendly 503 and the terminal client falls back to its local, content-
// grounded answer — so the site keeps working before the infra is provisioned.
const ASK_MODEL = 'claude-sonnet-5';
const ASK_MAX_TOKENS = 600;
const ASK_RATE_LIMIT = 10; // requests per window
const ASK_RATE_WINDOW_S = 3600; // 1 hour
const ASK_MAX_QUESTION_LEN = 500;
const ASK_MAX_BODY_BYTES = 32000;
const ASK_MAX_CONTEXT_LEN = 12000;

// Optional server-side grounding context, stored as a KV value so it never
// ships to the browser and never lives in this (public) repo. It is appended
// to the client-built context after the secret gate, so only secret-holders
// can even query it — but anything here can still surface in answers, so keep
// it "share with a recruiter" private, not actually-sensitive.
//
// To set/update: Cloudflare Dashboard → KV → (the ASK_RL namespace) → add a
// text entry under this key (e.g. a detailed Markdown résumé). No entry ⇒ the
// endpoint behaves exactly as before.
const ASK_SERVER_CONTEXT_KEY = 'server-context';
const ASK_SERVER_CONTEXT_MAX = 24000; // chars (~7.5K tokens)

const ASK_SYSTEM_PROMPT = [
  'You are the assistant embedded in the terminal version of Sean Higgins\u2019',
  'personal portfolio site (seanmh.com). Answer ONLY questions about Sean using',
  'the grounding context provided in the user message. If a question is not',
  'about Sean, or the context does not contain the answer, politely decline and',
  'steer the visitor toward asking about Sean\u2019s experience, projects,',
  'education, or how to get in touch. Keep answers concise and plain-text',
  '(this is a terminal). Never invent facts that are not in the context.',
].join(' ');

function askError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

class AskBodyTooLargeError extends Error {}

async function readAskBody(request) {
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && /^\d+$/.test(contentLength)
    && Number(contentLength) > ASK_MAX_BODY_BYTES) {
    throw new AskBodyTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return JSON.parse('');

  const decoder = new TextDecoder();
  let received = 0;
  let json = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > ASK_MAX_BODY_BYTES) {
      try {
        await reader.cancel();
      } catch {
        // The size error below is the useful response even if cancel fails.
      }
      throw new AskBodyTooLargeError();
    }
    json += decoder.decode(value, { stream: true });
  }

  json += decoder.decode();
  return JSON.parse(json);
}

function clientIp(request) {
  const forwarded = request.headers.get('X-Forwarded-For')?.split(',', 1)[0];
  return (request.headers.get('CF-Connecting-IP') || forwarded || 'unknown')
    .trim()
    .slice(0, 128) || 'unknown';
}

// Length-independent comparison so we don't leak the secret via response timing.
function timingSafeEqual(a, b) {
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

// Soft, best-effort rate limit. If KV isn't bound we simply skip limiting
// rather than failing the request.
async function isRateLimited(env, ip) {
  if (!env || !env.ASK_RL) return false;
  const key = `ask:${ip}`;
  let count = 0;
  try {
    count = parseInt((await env.ASK_RL.get(key)) || '0', 10) || 0;
  } catch {
    return false;
  }
  if (count >= ASK_RATE_LIMIT) return true;
  try {
    await env.ASK_RL.put(key, String(count + 1), { expirationTtl: ASK_RATE_WINDOW_S });
  } catch {
    // Non-fatal: allow the request if the counter write fails.
  }
  return false;
}

// Best-effort read of the server-side context. Missing binding, missing key,
// or a KV error all degrade to "no extra context" rather than failing the ask.
async function serverContext(env) {
  if (!env || !env.ASK_RL) return '';
  try {
    const value = await env.ASK_RL.get(ASK_SERVER_CONTEXT_KEY);
    return value ? value.slice(0, ASK_SERVER_CONTEXT_MAX) : '';
  } catch {
    return '';
  }
}

async function handleAsk(request, env) {
  if (request.method !== 'POST') {
    return askError(405, 'Use POST /api/ask with a JSON body {"question": "..."}.');
  }

  let body;
  try {
    body = await readAskBody(request);
  } catch (err) {
    if (err instanceof AskBodyTooLargeError) {
      return askError(413, 'Request body too large.');
    }
    return askError(400, 'Invalid JSON body.');
  }

  const question = (body && typeof body.question === 'string' ? body.question : '').trim();
  if (!question) return askError(400, 'Missing "question".');
  if (question.length > ASK_MAX_QUESTION_LEN) {
    return askError(413, 'Question too long.');
  }

  const apiKey = env && env.ANTHROPIC_API_KEY;
  const askSecret = env && env.ASK_SECRET;
  if (!apiKey || !askSecret) {
    // Infra not provisioned yet \u2014 let the client fall back locally.
    return askError(503, 'ask service not configured');
  }

  // Rate limit before the secret check so brute-force guesses burn quota too.
  if (await isRateLimited(env, clientIp(request))) {
    return askError(429, 'Rate limit reached \u2014 please try again later.');
  }

  // Secret gate \u2014 no valid secret means we never call the paid model. The
  // terminal client treats 401 as "re-prompt for the secret".
  const secret = body && typeof body.secret === 'string' ? body.secret : '';
  if (!secret || !timingSafeEqual(secret, askSecret)) {
    return askError(401, 'invalid secret');
  }

  // Grounding context is supplied by the client (it already has the baked-in
  // site content). We still cap and scope it via the system prompt.
  const clientContext = body && typeof body.context === 'string'
    ? body.context.slice(0, ASK_MAX_CONTEXT_LEN)
    : '';

  // Server-side context (detailed résumé etc.) is appended only after the
  // secret gate — it never ships to the browser. See ASK_SERVER_CONTEXT_KEY.
  const extraContext = await serverContext(env);
  const context = extraContext
    ? `${clientContext}\n\n## Detailed background (server-side; not shown on the site)\n${extraContext}`
    : clientContext;

  let anthropicResp;
  try {
    anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ASK_MODEL,
        max_tokens: ASK_MAX_TOKENS,
        // Sonnet 5 runs adaptive thinking when the field is omitted; disable it
        // so responses start fast and the whole budget goes to the answer.
        thinking: { type: 'disabled' },
        stream: true,
        system: ASK_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Grounding context about Sean:\n${context}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });
  } catch {
    return askError(502, 'Upstream model request failed.');
  }

  if (!anthropicResp.ok || !anthropicResp.body) {
    return askError(502, `Model returned ${anthropicResp.status}.`);
  }

  // Stream the SSE response straight through to the terminal client.
  return new Response(anthropicResp.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function pickVersion() {
  const total = VERSIONS.reduce((sum, v) => sum + v.weight, 0);
  let rand = Math.random() * total;
  for (const v of VERSIONS) {
    rand -= v.weight;
    if (rand <= 0) return v;
  }
  return VERSIONS[VERSIONS.length - 1];
}

function getCookieValue(cookieHeader, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
  return match?.[1];
}

function findVersion(name) {
  return VERSIONS.find((v) => v.name === name);
}

function cookieFor(version) {
  return `${COOKIE_NAME}=${version.name}; ${COOKIE_OPTIONS}`;
}

function isDocumentRequest(request) {
  return request.headers.get('Sec-Fetch-Dest') === 'document'
    || (request.headers.get('Accept') || '').includes('text/html');
}

function proxiedRequestInit(request) {
  const init = {
    method: request.method,
    headers: request.headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  return init;
}

function rewriteLocationHeader(headers, publicUrl, upstreamUrl) {
  const location = headers.get('Location');
  if (!location) return;

  try {
    const originLocation = new URL(location, upstreamUrl);
    if (originLocation.origin !== new URL(upstreamUrl).origin) return;

    const rewritten = new URL(publicUrl);
    rewritten.pathname = originLocation.pathname;
    rewritten.search = originLocation.search;
    rewritten.hash = originLocation.hash;
    headers.set('Location', rewritten.toString());
  } catch {
    // Leave unusual Location values untouched.
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // The Worker owns /api/* directly, before any version proxying.
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/ask') return handleAsk(request, env);
      return askError(404, 'Unknown API route.');
    }

    const forceParam = url.searchParams.get('v');

    // Strip the local routing param before proxying, even when its value is
    // invalid, so origin pages never see Worker-only controls.
    url.searchParams.delete('v');

    // Manual version override via query param
    const forced = forceParam ? findVersion(forceParam) : undefined;

    // Check session cookie
    const cookie = request.headers.get('Cookie') || '';
    const cookieVersion = findVersion(getCookieValue(cookie, COOKIE_NAME));
    const chosen = forced || cookieVersion || pickVersion();

    // Transparent proxy
    const proxyUrl = chosen.origin + url.pathname + url.search;
    let resp;
    try {
      resp = await fetch(proxyUrl, proxiedRequestInit(request));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(
        `Upstream ${chosen.origin} not reachable.\n${message}`,
        {
          status: 502,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-Portfolio-Version': chosen.name,
          },
        },
      );
    }

    const headers = new Headers(resp.headers);
    rewriteLocationHeader(headers, url, proxyUrl);
    headers.set('X-Portfolio-Version', chosen.name);
    // Refresh only on page navigations so the version sticks through a browsing
    // session. Asset/fetch responses must not set it: a stale in-flight
    // subrequest from the previous version would overwrite a just-switched cookie.
    const isDocument = isDocumentRequest(request);
    if (forced || isDocument) {
      headers.append('Set-Cookie', cookieFor(chosen));
    }
    if (isDocument) {
      headers.set('Cache-Control', DOCUMENT_CACHE_CONTROL);
    }

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers,
    });
  }
};
