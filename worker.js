const VERSIONS = [
  { name: 'a-scroll',   origin: 'https://seanmh-scroll.pages.dev',   weight: 34 },
  { name: 'b-card',     origin: 'https://seanmh-card.pages.dev',     weight: 33 },
  { name: 'c-terminal', origin: 'https://seanmh-terminal.pages.dev', weight: 33 },
];
const COOKIE_NAME = 'pv';
const COOKIE_OPTIONS = 'Path=/; Max-Age=1800; SameSite=Lax; Secure; HttpOnly';
const DOCUMENT_CACHE_CONTROL = 'private, no-store';

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
  async fetch(request) {
    const url = new URL(request.url);
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
