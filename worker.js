// The three portfolio versions. a-scroll is canonical: it is what every
// visitor arriving without a preference gets. The other two stay reachable by
// an explicit ?v= (the version switcher) or a sticky pv= cookie.
//
// This was previously a weighted random rotation (34/33/33). Serving three
// different pages from the same URL left the canonical content
// non-deterministic, which works against indexing and turns Core Web Vitals
// field data into an unattributable mix of three separate codebases. The fix
// is deliberately a stable default for *everyone*: choosing a version by user
// agent so crawlers saw something different from humans would be cloaking.
const VERSIONS = [
  { name: 'a-scroll',   origin: 'https://seanmh-scroll.pages.dev' },
  { name: 'b-card',     origin: 'https://seanmh-card.pages.dev' },
  { name: 'c-terminal', origin: 'https://seanmh-terminal.pages.dev' },
];

// Served when there is no ?v= and no cookie. Keep a-scroll first in VERSIONS.
const DEFAULT_VERSION = VERSIONS[0];

// The Nexus (a 3D portal entry world) is a manual-only destination: reachable
// by an explicit ?v=nexus (the switcher's NEXUS launcher) or a sticky pv=nexus
// cookie, but deliberately kept OUT of VERSIONS so it can never become the
// default. It's a routable target, not a landing page.
const NEXUS = { name: 'nexus', origin: 'https://seanmh-nexus.pages.dev' };

// The game (Version D, halfpipe) has the same posture as the Nexus: reachable
// via ?v=d-3d-game or a sticky cookie, never served to a visitor who did not
// ask for it — a game is a bad thing to hand a recruiter unannounced.
const GAME = { name: 'd-3d-game', origin: 'https://seanmh-3d-game.pages.dev' };

// Version E is the 2D boxing companion game. Like Version D, it is opt-in and
// never served by default.
const GAME_2D = { name: 'e-2d-game', origin: 'https://seanmh-2d-game.pages.dev' };

// Version F is a public architectural case study, not a preference-selected
// homepage. The Worker owns its stable path before ?v=/cookie resolution and
// strips /systems when proxying to the dedicated Pages project. Keeping it out
// of ROUTABLE means visiting Blueprint never changes the visitor's portfolio.
const BLUEPRINT = { name: 'f-blueprint', origin: 'https://seanmh-blueprint.pages.dev' };
const BLUEPRINT_PREFIX = '/systems';

// Short path for print: stickers, business cards and the QR codes on them
// point at /card, which redirects into the ?v= system rather than proxying.
// Two reasons it is worth its own route. It is short enough to set in type and
// read aloud, and it encodes into a smaller QR symbol than the query string it
// resolves to — 29x29 modules against 33x33 at the same error correction,
// which is a 10% larger module at any given sticker size.
//
// Deliberately a redirect and not a second way to serve b-card: ?v= already
// owns version selection and the preference cookie, and bouncing through it
// keeps that logic in exactly one place.
const CARD_PATH = '/card';
const CARD_VERSION = 'b-card';

// Site-wide discovery files cannot vary with a visual-version cookie. Keep
// the small canonical set at the edge so Blueprint is discoverable alongside
// the profile regardless of which presentation a returning visitor selected.
const CONTROL_ROUTES = new Map([
  ['/robots.txt', {
    type: 'text/plain; charset=utf-8',
    body: 'User-agent: *\nAllow: /\n\nSitemap: https://seanmh.com/sitemap-index.xml\n',
  }],
  ['/sitemap-index.xml', {
    type: 'application/xml; charset=utf-8',
    body: '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://seanmh.com/sitemap-0.xml</loc></sitemap></sitemapindex>\n',
  }],
  ['/sitemap-0.xml', {
    type: 'application/xml; charset=utf-8',
    body: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://seanmh.com/</loc></url><url><loc>https://seanmh.com/systems/</loc></url></urlset>\n',
  }],
]);

// Everything the Worker will proxy when named explicitly (?v= or cookie).
// Only DEFAULT_VERSION is ever served without being asked for.
const ROUTABLE = [...VERSIONS, NEXUS, GAME, GAME_2D];
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
async function isRateLimited(env, key, limit, windowS) {
  if (!env || !env.ASK_RL) return false;
  let count = 0;
  try {
    count = parseInt((await env.ASK_RL.get(key)) || '0', 10) || 0;
  } catch {
    return false;
  }
  if (count >= limit) return true;
  try {
    await env.ASK_RL.put(key, String(count + 1), { expirationTtl: windowS });
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
  if (await isRateLimited(env, `ask:${clientIp(request)}`, ASK_RATE_LIMIT, ASK_RATE_WINDOW_S)) {
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

// --- /api/score (halfpipe leaderboard) -------------------------------------
// Global top-N for the d-3d-game halfpipe. Storage is one small JSON list in the
// existing KV namespace (ASK_RL): [{ i: initials, s: score, t: epoch-ms }].
// Anti-forgery is proportionate, not perfect: strict input validation, a
// per-IP rate limit, and a physical plausibility ceiling derived from the
// game's own scoring math — the goal is making cheating more effort than
// playing. No KV binding ⇒ GET degrades to an empty list and POST to 503, so
// the client hides the board instead of breaking.
const SCORE_KEY = 'hp:top';
const SCORE_TOP_N = 10;
const SCORE_RATE_LIMIT = 30; // submissions per IP per window
const SCORE_RATE_WINDOW_S = 3600;
const SCORE_MAX = 5_000_000;

function scoreResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function readTopList(env, key = SCORE_KEY) {
  if (!env || !env.ASK_RL) return null;
  try {
    const raw = await env.ASK_RL.get(key);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter((e) => e && typeof e.i === 'string' && Number.isFinite(e.s));
  } catch {
    return null;
  }
}

// Ceiling from the game's scoring model: one trick tops out around 9k points
// (max spin rate × max hang time × max grab bonus), tricks land at most every
// ~3s, and the chain multiplier grows by 1 per clean landing — so a run with
// n landings can't beat 9000 × n(n+1)/2, and n itself is bounded by duration.
function plausibleScore(score, run) {
  if (!run || typeof run !== 'object') return false;
  const dur = Number(run.dur);
  const landings = Number(run.landings);
  if (!Number.isFinite(dur) || dur < 5 || dur > 600) return false;
  if (!Number.isInteger(landings) || landings < 1 || landings > dur / 3) return false;
  return score <= 9000 * ((landings * (landings + 1)) / 2);
}

async function handleScore(request, env) {
  if (request.method === 'GET') {
    const top = await readTopList(env);
    return scoreResponse(200, { top: top || [] });
  }
  if (request.method !== 'POST') {
    return askError(405, 'Use GET /api/score, or POST with {"initials","score","run"}.');
  }
  if (!env || !env.ASK_RL) return askError(503, 'leaderboard not configured');

  let body;
  try {
    body = await readAskBody(request);
  } catch (err) {
    if (err instanceof AskBodyTooLargeError) return askError(413, 'Request body too large.');
    return askError(400, 'Invalid JSON body.');
  }

  const initials = (typeof body?.initials === 'string' ? body.initials : '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{1,3}$/.test(initials)) {
    return askError(400, 'Initials must be 1-3 letters or digits.');
  }
  const score = body?.score;
  if (!Number.isInteger(score) || score < 1 || score > SCORE_MAX) {
    return askError(400, 'Invalid score.');
  }

  if (await isRateLimited(env, `score:${clientIp(request)}`, SCORE_RATE_LIMIT, SCORE_RATE_WINDOW_S)) {
    return askError(429, 'Rate limit reached — please try again later.');
  }

  if (!plausibleScore(score, body?.run)) {
    return askError(422, 'Score rejected.');
  }

  const top = (await readTopList(env)) || [];
  const entry = { i: initials, s: score, t: Date.now() };
  let rank = top.findIndex((e) => score > e.s);
  if (rank === -1 && top.length < SCORE_TOP_N) rank = top.length;
  if (rank === -1 || rank >= SCORE_TOP_N) {
    return scoreResponse(200, { top, rank: null });
  }
  top.splice(rank, 0, entry);
  top.length = Math.min(top.length, SCORE_TOP_N);
  try {
    await env.ASK_RL.put(SCORE_KEY, JSON.stringify(top));
  } catch {
    return askError(503, 'leaderboard temporarily unavailable');
  }
  return scoreResponse(200, { top, rank: rank + 1 });
}

// --- /api/score/boxing (Version E leaderboard) ----------------------------
// Kept separate from the halfpipe board so both games retain their own score
// contract and anti-forgery ceiling while sharing the existing KV binding.
const BOXING_SCORE_KEY = 'bx:top';

function plausibleBoxingScore(score, run) {
  if (!run || typeof run !== 'object') return false;
  const dur = Number(run.dur);
  const counters = Number(run.counters);
  const maxChain = Number(run.maxChain);
  const hits = Number(run.hits);
  if (!Number.isFinite(dur) || dur < 5 || dur > 300) return false;
  if (!Number.isInteger(counters) || counters < 1 || counters > Math.ceil(dur * 4)) return false;
  if (!Number.isInteger(maxChain) || maxChain < 1 || maxChain > counters) return false;
  if (!Number.isInteger(hits) || hits < 0 || hits > Math.ceil(dur * 2)) return false;
  // One perfect counter is worth at most 100 × 1.5 × the capped 4× chain.
  return score <= 600 * counters;
}

async function handleBoxingScore(request, env) {
  if (request.method === 'GET') {
    const top = await readTopList(env, BOXING_SCORE_KEY);
    return scoreResponse(200, { top: top || [] });
  }
  if (request.method !== 'POST') {
    return askError(405, 'Use GET /api/score/boxing, or POST with {"initials","score","run"}.');
  }
  if (!env || !env.ASK_RL) return askError(503, 'leaderboard not configured');

  let body;
  try {
    body = await readAskBody(request);
  } catch (err) {
    if (err instanceof AskBodyTooLargeError) return askError(413, 'Request body too large.');
    return askError(400, 'Invalid JSON body.');
  }

  const initials = (typeof body?.initials === 'string' ? body.initials : '').trim().toUpperCase();
  if (!/^[A-Z0-9]{1,3}$/.test(initials)) {
    return askError(400, 'Initials must be 1-3 letters or digits.');
  }
  const score = body?.score;
  if (!Number.isInteger(score) || score < 1 || score > SCORE_MAX) {
    return askError(400, 'Invalid score.');
  }
  if (await isRateLimited(env, `score:boxing:${clientIp(request)}`, SCORE_RATE_LIMIT, SCORE_RATE_WINDOW_S)) {
    return askError(429, 'Rate limit reached — please try again later.');
  }
  if (!plausibleBoxingScore(score, body?.run)) return askError(422, 'Score rejected.');

  const top = (await readTopList(env, BOXING_SCORE_KEY)) || [];
  const entry = { i: initials, s: score, t: Date.now() };
  let rank = top.findIndex((item) => score > item.s);
  if (rank === -1 && top.length < SCORE_TOP_N) rank = top.length;
  if (rank === -1 || rank >= SCORE_TOP_N) return scoreResponse(200, { top, rank: null });
  top.splice(rank, 0, entry);
  top.length = Math.min(top.length, SCORE_TOP_N);
  try {
    await env.ASK_RL.put(BOXING_SCORE_KEY, JSON.stringify(top));
  } catch {
    return askError(503, 'leaderboard temporarily unavailable');
  }
  return scoreResponse(200, { top, rank: rank + 1 });
}

function getCookieValue(cookieHeader, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
  return match?.[1];
}

function findVersion(name) {
  return ROUTABLE.find((v) => v.name === name);
}

function cookieFor(version) {
  return `${COOKIE_NAME}=${version.name}; ${COOKIE_OPTIONS}`;
}

function isDocumentRequest(request) {
  return request.headers.get('Sec-Fetch-Dest') === 'document'
    || (request.headers.get('Accept') || '').includes('text/html');
}

function controlRouteResponse(request, pathname) {
  const route = CONTROL_ROUTES.get(pathname);
  if (!route) return null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed.', {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  return new Response(request.method === 'HEAD' ? null : route.body, {
    headers: {
      'Content-Type': route.type,
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
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

function rewriteLocationHeader(headers, publicUrl, upstreamUrl, publicPathPrefix = '') {
  const location = headers.get('Location');
  if (!location) return;

  try {
    const originLocation = new URL(location, upstreamUrl);
    if (originLocation.origin !== new URL(upstreamUrl).origin) return;

    const rewritten = new URL(publicUrl);
    rewritten.pathname = publicPathPrefix + originLocation.pathname;
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
      if (url.pathname === '/api/score') return handleScore(request, env);
      if (url.pathname === '/api/score/boxing') return handleBoxingScore(request, env);
      return askError(404, 'Unknown API route.');
    }

    const controlResponse = controlRouteResponse(request, url.pathname);
    if (controlResponse) return controlResponse;

    // Blueprint is durable, indexable content. Resolve the complete path
    // namespace—including its /systems/_astro assets—before a pv cookie can
    // select a different origin. /systems itself normalizes to the canonical
    // trailing-slash URL without setting or refreshing a preference cookie.
    if (url.pathname === BLUEPRINT_PREFIX) {
      url.pathname = `${BLUEPRINT_PREFIX}/`;
      return new Response(null, {
        status: 308,
        headers: {
          Location: url.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname.startsWith(`${BLUEPRINT_PREFIX}/`)) {
      const originPath = url.pathname.slice(BLUEPRINT_PREFIX.length) || '/';
      const proxyUrl = BLUEPRINT.origin + originPath + url.search;
      let resp;
      try {
        resp = await fetch(proxyUrl, proxiedRequestInit(request));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(
          `Upstream ${BLUEPRINT.origin} not reachable.\n${message}`,
          {
            status: 502,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-store',
              'X-Content-Type-Options': 'nosniff',
              'X-Portfolio-Version': BLUEPRINT.name,
            },
          },
        );
      }

      const headers = new Headers(resp.headers);
      rewriteLocationHeader(headers, url, proxyUrl, BLUEPRINT_PREFIX);
      // The Pages origin deliberately returns noindex so its production and
      // preview hostnames cannot compete with the apex. That origin-only rule
      // must never leak through the public, self-canonical /systems/ path.
      headers.delete('X-Robots-Tag');
      headers.delete('Set-Cookie');
      headers.set('X-Portfolio-Version', BLUEPRINT.name);
      if (isDocumentRequest(request)) {
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      }

      return new Response(resp.body, {
        status: resp.status,
        statusText: resp.statusText,
        headers,
      });
    }

    // /card resolves to the Card version's canonical URL. Any query string the
    // visitor arrived with is carried across, so a per-batch tracking param
    // printed on one run of stickers survives the bounce; an explicit ?v= is
    // overwritten, because the whole point of this path is which version it
    // lands on.
    //
    // 302 rather than 301/308 on purpose. This path gets printed on physical
    // objects that outlive routing decisions, and a permanent redirect would
    // sit in the browser cache of everyone who ever scanned an old sticker,
    // making the target impossible to repoint later.
    if (url.pathname === CARD_PATH || url.pathname === `${CARD_PATH}/`) {
      const target = new URL(url);
      target.pathname = '/';
      target.searchParams.set('v', CARD_VERSION);
      return new Response(null, {
        status: 302,
        headers: {
          Location: target.toString(),
          'Cache-Control': 'no-store',
        },
      });
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
    const chosen = forced || cookieVersion || DEFAULT_VERSION;

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
