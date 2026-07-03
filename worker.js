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
// the client. A KV namespace (ASK_RL) provides a soft per-IP rate limit.
//
// This route degrades gracefully: if the secret/binding is missing, it returns
// a friendly 503 and the terminal client falls back to its local, content-
// grounded answer — so the site keeps working before the infra is provisioned.
const ASK_MODEL = 'claude-haiku-4-5-20251001'; // verify id before going live
const ASK_MAX_TOKENS = 512;
const ASK_RATE_LIMIT = 10; // requests per window
const ASK_RATE_WINDOW_S = 3600; // 1 hour
const ASK_MAX_QUESTION_LEN = 500;

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
    },
  });
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')
    || 'unknown';
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

async function handleAsk(request, env) {
  if (request.method !== 'POST') {
    return askError(405, 'Use POST /api/ask with a JSON body {"question": "..."}.');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return askError(400, 'Invalid JSON body.');
  }

  const question = (body && typeof body.question === 'string' ? body.question : '').trim();
  if (!question) return askError(400, 'Missing "question".');
  if (question.length > ASK_MAX_QUESTION_LEN) {
    return askError(413, 'Question too long.');
  }

  const apiKey = env && env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Infra not provisioned yet \u2014 let the client fall back locally.
    return askError(503, 'ask service not configured');
  }

  if (await isRateLimited(env, clientIp(request))) {
    return askError(429, 'Rate limit reached \u2014 please try again later.');
  }

  // Grounding context is supplied by the client (it already has the baked-in
  // site content). We still cap and scope it via the system prompt.
  const context = body && typeof body.context === 'string'
    ? body.context.slice(0, 6000)
    : '';

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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return askError(502, `Upstream model error: ${message}`);
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

function rewriteLocationHeader(headers, publicUrl, origin) {
  const location = headers.get('Location');
  if (!location) return;

  try {
    const originLocation = new URL(location, origin);
    const originUrl = new URL(origin);
    if (originLocation.origin !== originUrl.origin) return;

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
            'X-Portfolio-Version': chosen.name,
          },
        },
      );
    }

    const headers = new Headers(resp.headers);
    rewriteLocationHeader(headers, url, chosen.origin);
    headers.set('X-Portfolio-Version', chosen.name);
    // Refresh only on page navigations so the version sticks through a browsing
    // session. Asset/fetch responses must not set it: a stale in-flight
    // subrequest from the previous version would overwrite a just-switched cookie.
    const isDocument = isDocumentRequest(request);
    if (forced || isDocument) {
      headers.set('Set-Cookie', cookieFor(chosen));
    }
    if (isDocument) {
      headers.set('Cache-Control', DOCUMENT_CACHE_CONTROL);
    }

    return new Response(resp.body, { status: resp.status, headers });
  }
};
