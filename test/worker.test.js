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
