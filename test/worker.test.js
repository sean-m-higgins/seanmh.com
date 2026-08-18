import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../worker.js';

const originalFetch = globalThis.fetch;

function request(path = '/', init = {}) {
  return new Request(`https://seanmh.com${path}`, init);
}

function jsonRequest(body, headers = {}) {
  return request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function mockFetch(handler) {
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

test('forced routing strips the control param and sets document headers', async (t) => {
  let upstreamUrl;
  const restore = mockFetch(async (url) => {
    upstreamUrl = String(url);
    return new Response('card', { headers: { 'Set-Cookie': 'origin=value; Path=/' } });
  });
  t.after(restore);

  const response = await worker.fetch(request('/work?keep=1&v=b-card', {
    headers: { Accept: 'text/html' },
  }));

  assert.equal(upstreamUrl, 'https://seanmh-card.pages.dev/work?keep=1');
  assert.equal(response.headers.get('X-Portfolio-Version'), 'b-card');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const cookies = response.headers.get('Set-Cookie');
  assert.match(cookies, /origin=value/);
  assert.match(cookies, /pv=b-card/);
});

test('a visitor with no preference always gets a-scroll', async (t) => {
  const upstreamUrls = [];
  const restore = mockFetch(async (url) => {
    upstreamUrls.push(String(url));
    return new Response('scroll');
  });
  t.after(restore);

  // Repeated across what used to be the full spread of the rotation: the
  // default must not vary between visitors, which is the whole point of the
  // change (a stable canonical page for crawlers and for CWV attribution).
  const originalRandom = Math.random;
  t.after(() => { Math.random = originalRandom; });
  for (const random of [0, 0.5, 0.999999]) {
    Math.random = () => random;
    const response = await worker.fetch(request('/', {
      headers: { Accept: 'text/html' },
    }));
    assert.equal(response.headers.get('X-Portfolio-Version'), 'a-scroll');
    assert.match(response.headers.get('Set-Cookie'), /pv=a-scroll/);
  }
  assert.deepEqual(upstreamUrls, [
    'https://seanmh-scroll.pages.dev/',
    'https://seanmh-scroll.pages.dev/',
    'https://seanmh-scroll.pages.dev/',
  ]);
});

test('an explicit choice still overrides the default', async (t) => {
  const upstreamUrls = [];
  const restore = mockFetch(async (url) => {
    upstreamUrls.push(String(url));
    return new Response('other');
  });
  t.after(restore);

  // ?v= wins over the default...
  const forced = await worker.fetch(request('/?v=c-terminal', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(forced.headers.get('X-Portfolio-Version'), 'c-terminal');

  // ...and so does a sticky cookie from an earlier switch.
  const returning = await worker.fetch(request('/', {
    headers: { Accept: 'text/html', Cookie: 'pv=b-card' },
  }));
  assert.equal(returning.headers.get('X-Portfolio-Version'), 'b-card');

  assert.deepEqual(upstreamUrls, [
    'https://seanmh-terminal.pages.dev/',
    'https://seanmh-card.pages.dev/',
  ]);
});

test('nexus is routable via ?v= and a sticky cookie but never randomly assigned', async (t) => {
  const upstreamUrls = [];
  const restore = mockFetch(async (url) => {
    upstreamUrls.push(String(url));
    return new Response('nexus');
  });
  t.after(restore);

  // Explicit ?v=nexus proxies to the nexus origin and pins the pv cookie.
  const forced = await worker.fetch(request('/?v=nexus', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(upstreamUrls[0], 'https://seanmh-nexus.pages.dev/');
  assert.equal(forced.headers.get('X-Portfolio-Version'), 'nexus');
  assert.match(forced.headers.get('Set-Cookie'), /pv=nexus/);

  // A returning visitor with pv=nexus stays on the nexus origin.
  const returning = await worker.fetch(request('/app.js', {
    headers: { Cookie: 'pv=nexus' },
  }));
  assert.equal(upstreamUrls[1], 'https://seanmh-nexus.pages.dev/app.js');

  // Rotation (no ?v=, no cookie) must never land on nexus, at either extreme
  // of Math.random()'s range.
  const originalRandom = Math.random;
  t.after(() => { Math.random = originalRandom; });
  for (const r of [0, 0.999999]) {
    Math.random = () => r;
    const rotated = await worker.fetch(request('/', { headers: { Accept: 'text/html' } }));
    assert.notEqual(rotated.headers.get('X-Portfolio-Version'), 'nexus');
  }
});

test('d-3d-game is routable via ?v= but never randomly assigned', async (t) => {
  const upstreamUrls = [];
  const restore = mockFetch(async (url) => {
    upstreamUrls.push(String(url));
    return new Response('game');
  });
  t.after(restore);

  const forced = await worker.fetch(request('/?v=d-3d-game', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(upstreamUrls[0], 'https://seanmh-3d-game.pages.dev/');
  assert.equal(forced.headers.get('X-Portfolio-Version'), 'd-3d-game');
  assert.match(forced.headers.get('Set-Cookie'), /pv=d-3d-game/);

  // Rotation must never land on the game, at either extreme of Math.random().
  const originalRandom = Math.random;
  t.after(() => { Math.random = originalRandom; });
  for (const r of [0, 0.999999]) {
    Math.random = () => r;
    const rotated = await worker.fetch(request('/', { headers: { Accept: 'text/html' } }));
    assert.notEqual(rotated.headers.get('X-Portfolio-Version'), 'd-3d-game');
  }
});

test('e-2d-game is routable via ?v= but never randomly assigned', async (t) => {
  const upstreamUrls = [];
  const restore = mockFetch(async (url) => {
    upstreamUrls.push(String(url));
    return new Response('boxing');
  });
  t.after(restore);

  const forced = await worker.fetch(request('/?v=e-2d-game', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(upstreamUrls[0], 'https://seanmh-2d-game.pages.dev/');
  assert.equal(forced.headers.get('X-Portfolio-Version'), 'e-2d-game');
  assert.match(forced.headers.get('Set-Cookie'), /pv=e-2d-game/);

  const originalRandom = Math.random;
  t.after(() => { Math.random = originalRandom; });
  for (const random of [0, 0.999999]) {
    Math.random = () => random;
    const rotated = await worker.fetch(request('/', { headers: { Accept: 'text/html' } }));
    assert.notEqual(rotated.headers.get('X-Portfolio-Version'), 'e-2d-game');
  }
});

test('Blueprint owns /systems independently of version selection', async (t) => {
  const upstreamUrls = [];
  const restore = mockFetch(async (url) => {
    upstreamUrls.push(String(url));
    return new Response('blueprint', {
      headers: {
        'X-Robots-Tag': 'noindex',
        'Set-Cookie': 'origin=value; Path=/',
      },
    });
  });
  t.after(restore);

  const document = await worker.fetch(request('/systems/?view=edge', {
    headers: {
      Accept: 'text/html',
      Cookie: 'pv=c-terminal',
    },
  }));
  const asset = await worker.fetch(request('/systems/_astro/app.js', {
    headers: { Cookie: 'pv=d-3d-game' },
  }));

  assert.deepEqual(upstreamUrls, [
    'https://seanmh-blueprint.pages.dev/?view=edge',
    'https://seanmh-blueprint.pages.dev/_astro/app.js',
  ]);
  assert.equal(document.headers.get('X-Portfolio-Version'), 'f-blueprint');
  assert.equal(document.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(document.headers.get('Set-Cookie'), null);
  assert.equal(document.headers.get('X-Robots-Tag'), null);
  assert.equal(asset.headers.get('X-Portfolio-Version'), 'f-blueprint');
  assert.equal(asset.headers.get('Set-Cookie'), null);
  assert.equal(asset.headers.get('X-Robots-Tag'), null);
});

test('Blueprint canonicalizes its root and rewrites origin redirects under /systems', async (t) => {
  let calls = 0;
  const restore = mockFetch(async () => {
    calls += 1;
    return new Response(null, {
      status: 302,
      headers: { Location: '../next?from=blueprint' },
    });
  });
  t.after(restore);

  const canonical = await worker.fetch(request('/systems?keep=1', {
    headers: { Accept: 'text/html', Cookie: 'pv=b-card' },
  }));
  assert.equal(canonical.status, 308);
  assert.equal(canonical.headers.get('Location'), 'https://seanmh.com/systems/?keep=1');
  assert.equal(canonical.headers.get('Set-Cookie'), null);
  assert.equal(calls, 0);

  const redirected = await worker.fetch(request('/systems/one/page', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(redirected.headers.get('Location'), 'https://seanmh.com/systems/next?from=blueprint');
});

test('SEO control routes are stable across version cookies and include Blueprint', async (t) => {
  const restore = mockFetch(async () => {
    throw new Error('control routes must not reach an origin');
  });
  t.after(restore);

  const sitemap = await worker.fetch(request('/sitemap-0.xml', {
    headers: { Cookie: 'pv=nexus' },
  }));
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('Content-Type'), /^application\/xml/);
  assert.equal(sitemap.headers.get('Set-Cookie'), null);
  const body = await sitemap.text();
  assert.match(body, /https:\/\/seanmh\.com\/<\/loc>/);
  assert.match(body, /https:\/\/seanmh\.com\/systems\/<\/loc>/);

  const robots = await worker.fetch(request('/robots.txt', {
    headers: { Cookie: 'pv=e-2d-game' },
  }));
  assert.match(await robots.text(), /Sitemap: https:\/\/seanmh\.com\/sitemap-index\.xml/);
});

test('asset requests honor the cookie without refreshing it', async (t) => {
  let upstreamUrl;
  const restore = mockFetch(async (url) => {
    upstreamUrl = String(url);
    return new Response('asset');
  });
  t.after(restore);

  const response = await worker.fetch(request('/app.js', {
    headers: { Cookie: 'other=1; pv=c-terminal' },
  }));

  assert.equal(upstreamUrl, 'https://seanmh-terminal.pages.dev/app.js');
  assert.equal(response.headers.get('Set-Cookie'), null);
});

test('same-origin relative redirects keep their upstream path', async (t) => {
  const restore = mockFetch(async () => new Response(null, {
    status: 302,
    headers: { Location: '../next?from=redirect' },
  }));
  t.after(restore);

  const response = await worker.fetch(request('/one/two/page?v=a-scroll', {
    headers: { Accept: 'text/html' },
  }));

  assert.equal(
    response.headers.get('Location'),
    'https://seanmh.com/one/next?from=redirect',
  );
});

test('cross-origin redirects are not rewritten', async (t) => {
  const restore = mockFetch(async () => new Response(null, {
    status: 302,
    headers: { Location: 'https://example.com/elsewhere' },
  }));
  t.after(restore);

  const response = await worker.fetch(request('/?v=a-scroll'));
  assert.equal(response.headers.get('Location'), 'https://example.com/elsewhere');
});

test('proxy failures return a non-cacheable versioned 502', async (t) => {
  const restore = mockFetch(async () => {
    throw new Error('offline');
  });
  t.after(restore);

  const response = await worker.fetch(request('/?v=c-terminal'));
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(response.headers.get('X-Portfolio-Version'), 'c-terminal');
});

test('ask rejects invalid routes, methods, bodies, and missing configuration', async () => {
  const missing = await worker.fetch(request('/api/missing'));
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('Cache-Control'), 'no-store');
  assert.equal(missing.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal((await worker.fetch(request('/api/ask'))).status, 405);
  assert.equal((await worker.fetch(request('/api/ask', {
    method: 'POST',
    body: '{',
  }))).status, 400);
  assert.equal((await worker.fetch(jsonRequest({ question: 'Hello?' }), {})).status, 503);
});

test('ask rejects declared and streamed oversized request bodies', async () => {
  const declared = await worker.fetch(request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Length': '32001' },
    body: '{}',
  }));
  assert.equal(declared.status, 413);

  const streamed = await worker.fetch(jsonRequest({
    question: 'q',
    context: 'x'.repeat(32000),
  }));
  assert.equal(streamed.status, 413);
});

test('ask gates the model call, reads server context, and streams SSE', async (t) => {
  let modelRequest;
  const restore = mockFetch(async (url, init) => {
    modelRequest = { url: String(url), init };
    return new Response('event: message_stop\ndata: {}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  });
  t.after(restore);

  const puts = [];
  const env = {
    ANTHROPIC_API_KEY: 'api-key',
    ASK_SECRET: 'shared-secret',
    ASK_RL: {
      async get(key) {
        return key === 'server-context' ? 'private resume' : null;
      },
      async put(...args) {
        puts.push(args);
      },
    },
  };

  const unauthorized = await worker.fetch(jsonRequest({
    question: 'What did Sean build?',
    secret: 'wrong',
  }, { 'CF-Connecting-IP': '203.0.113.10' }), env);
  assert.equal(unauthorized.status, 401);
  assert.equal(modelRequest, undefined);

  const response = await worker.fetch(jsonRequest({
    question: 'What did Sean build?',
    context: `public portfolio ${'x'.repeat(8000)} retained-context-tail`,
    secret: 'shared-secret',
  }, { 'CF-Connecting-IP': '203.0.113.11' }), env);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /^text\/event-stream/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(modelRequest.url, 'https://api.anthropic.com/v1/messages');
  const payload = JSON.parse(modelRequest.init.body);
  assert.equal(payload.stream, true);
  assert.match(payload.messages[0].content, /public portfolio/);
  assert.match(payload.messages[0].content, /retained-context-tail/);
  assert.match(payload.messages[0].content, /private resume/);
  assert.equal(puts.length, 2);
});

function scoreRequest(body, headers = {}) {
  return request('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function boxingScoreRequest(body, headers = {}) {
  return request('/api/score/boxing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function mockScoreKv(initial = null) {
  const store = new Map();
  if (initial) store.set('hp:top', JSON.stringify(initial));
  return {
    store,
    async get(key) { return store.get(key) ?? null; },
    async put(key, value) { store.set(key, value); },
  };
}

test('score GET degrades to an empty list and POST 503s without KV', async () => {
  const emptyGet = await worker.fetch(request('/api/score'));
  assert.equal(emptyGet.status, 200);
  assert.deepEqual(await emptyGet.json(), { top: [] });

  const post = await worker.fetch(scoreRequest({ initials: 'SMH', score: 100, run: { dur: 60, landings: 5 } }));
  assert.equal(post.status, 503);
});

test('score POST validates initials, score, and plausibility', async () => {
  const env = { ASK_RL: mockScoreKv() };
  const cases = [
    [{ initials: 'TOOLONG', score: 100, run: { dur: 60, landings: 5 } }, 400],
    [{ initials: 'a!', score: 100, run: { dur: 60, landings: 5 } }, 400],
    [{ initials: 'SMH', score: -5, run: { dur: 60, landings: 5 } }, 400],
    [{ initials: 'SMH', score: 1.5, run: { dur: 60, landings: 5 } }, 400],
    [{ initials: 'SMH', score: 100 }, 422], // no run stats
    [{ initials: 'SMH', score: 100, run: { dur: 2, landings: 1 } }, 422], // too short
    [{ initials: 'SMH', score: 100, run: { dur: 60, landings: 40 } }, 422], // landings > dur/3
    [{ initials: 'SMH', score: 1_000_000, run: { dur: 60, landings: 3 } }, 422], // above ceiling
  ];
  for (const [body, expected] of cases) {
    const resp = await worker.fetch(scoreRequest(body), env);
    assert.equal(resp.status, expected, JSON.stringify(body));
  }
});

test('score POST inserts into the top list, ranks, and caps at ten', async () => {
  const seeded = Array.from({ length: 10 }, (_, k) => ({ i: 'AAA', s: (10 - k) * 1000, t: 1 }));
  const env = { ASK_RL: mockScoreKv(seeded) };

  // Beats 4th place (score 7000): lands at rank 4, list stays at ten.
  const good = await worker.fetch(scoreRequest({
    initials: 'smh', score: 7500, run: { dur: 90, landings: 12 },
  }, { 'CF-Connecting-IP': '203.0.113.20' }), env);
  assert.equal(good.status, 200);
  const goodBody = await good.json();
  assert.equal(goodBody.rank, 4);
  assert.equal(goodBody.top.length, 10);
  assert.equal(goodBody.top[3].i, 'SMH'); // uppercased
  assert.equal(goodBody.top[3].s, 7500);

  // Below the (new) cut line: accepted but unranked, list unchanged.
  const miss = await worker.fetch(scoreRequest({
    initials: 'LOW', score: 900, run: { dur: 60, landings: 8 },
  }, { 'CF-Connecting-IP': '203.0.113.21' }), env);
  const missBody = await miss.json();
  assert.equal(missBody.rank, null);
  assert.equal(missBody.top.some((e) => e.i === 'LOW'), false);
});

test('score POST is rate limited per IP', async () => {
  const kv = mockScoreKv();
  kv.store.set('score:203.0.113.30', '30');
  const env = { ASK_RL: kv };
  const resp = await worker.fetch(scoreRequest({
    initials: 'SMH', score: 100, run: { dur: 60, landings: 5 },
  }, { 'CF-Connecting-IP': '203.0.113.30' }), env);
  assert.equal(resp.status, 429);
});

test('boxing score board is isolated, validates run stats, and ranks entries', async () => {
  const kv = mockScoreKv();
  kv.store.set('hp:top', JSON.stringify([{ i: 'HP', s: 9999, t: 1 }]));
  const env = { ASK_RL: kv };

  const empty = await worker.fetch(request('/api/score/boxing'), env);
  assert.deepEqual(await empty.json(), { top: [] });

  const invalidRuns = [
    { dur: 4, counters: 2, maxChain: 2, hits: 0 },
    { dur: 30, counters: 121, maxChain: 8, hits: 1 },
    { dur: 30, counters: 5, maxChain: 6, hits: 1 },
    { dur: 30, counters: 5, maxChain: 4, hits: -1 },
  ];
  for (const run of invalidRuns) {
    const response = await worker.fetch(boxingScoreRequest({ initials: 'SMH', score: 500, run }), env);
    assert.equal(response.status, 422, JSON.stringify(run));
  }

  const tooHigh = await worker.fetch(boxingScoreRequest({
    initials: 'SMH', score: 3001, run: { dur: 30, counters: 5, maxChain: 5, hits: 1 },
  }), env);
  assert.equal(tooHigh.status, 422);

  const ranked = await worker.fetch(boxingScoreRequest({
    initials: 'smh', score: 3000, run: { dur: 30, counters: 8, maxChain: 6, hits: 1 },
  }, { 'CF-Connecting-IP': '203.0.113.40' }), env);
  assert.equal(ranked.status, 200);
  assert.equal((await ranked.json()).rank, 1);
  assert.equal(JSON.parse(kv.store.get('bx:top'))[0].i, 'SMH');
  assert.equal(JSON.parse(kv.store.get('hp:top'))[0].i, 'HP');
});

test('boxing score endpoint degrades without KV and rate limits independently', async () => {
  const empty = await worker.fetch(request('/api/score/boxing'));
  assert.deepEqual(await empty.json(), { top: [] });
  const unavailable = await worker.fetch(boxingScoreRequest({
    initials: 'SMH', score: 100, run: { dur: 10, counters: 1, maxChain: 1, hits: 0 },
  }));
  assert.equal(unavailable.status, 503);

  const kv = mockScoreKv();
  kv.store.set('score:boxing:203.0.113.41', '30');
  const limited = await worker.fetch(boxingScoreRequest({
    initials: 'SMH', score: 100, run: { dur: 10, counters: 1, maxChain: 1, hits: 0 },
  }, { 'CF-Connecting-IP': '203.0.113.41' }), { ASK_RL: kv });
  assert.equal(limited.status, 429);
});

test('ask returns 429 without calling the model after the limit', async (t) => {
  let called = false;
  const restore = mockFetch(async () => {
    called = true;
    return new Response();
  });
  t.after(restore);

  const env = {
    ANTHROPIC_API_KEY: 'api-key',
    ASK_SECRET: 'shared-secret',
    ASK_RL: {
      async get() { return '10'; },
      async put() {},
    },
  };
  const response = await worker.fetch(jsonRequest({
    question: 'Question',
    secret: 'shared-secret',
  }), env);

  assert.equal(response.status, 429);
  assert.equal(called, false);
});

test('/card redirects to the Card version without touching an origin', async (t) => {
  const restore = mockFetch(async () => {
    throw new Error('/card must resolve at the edge, not proxy');
  });
  t.after(restore);

  for (const path of ['/card', '/card/']) {
    const response = await worker.fetch(request(path, {
      headers: { Accept: 'text/html' },
    }));

    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), 'https://seanmh.com/?v=b-card');
    // A permanent redirect would be cached by every browser that ever scanned
    // a printed code, which would make the path impossible to repoint.
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    // The bounce itself must not set a preference; ?v=b-card does that.
    assert.equal(response.headers.get('Set-Cookie'), null);
  }
});

test('/card carries tracking params across and wins over an existing ?v=', async (t) => {
  const restore = mockFetch(async () => {
    throw new Error('/card must resolve at the edge, not proxy');
  });
  t.after(restore);

  const tracked = await worker.fetch(request('/card?utm_source=sticker', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(
    tracked.headers.get('Location'),
    'https://seanmh.com/?utm_source=sticker&v=b-card',
  );

  const overridden = await worker.fetch(request('/card?v=c-terminal', {
    headers: { Accept: 'text/html' },
  }));
  assert.equal(overridden.headers.get('Location'), 'https://seanmh.com/?v=b-card');
});

test('/card does not shadow other paths that start with card', async (t) => {
  let upstreamUrl;
  const restore = mockFetch(async (url) => {
    upstreamUrl = String(url);
    return new Response('page');
  });
  t.after(restore);

  const response = await worker.fetch(request('/cards', {
    headers: { Accept: 'text/html' },
  }));

  assert.equal(response.status, 200);
  assert.equal(upstreamUrl, 'https://seanmh-scroll.pages.dev/cards');
});
