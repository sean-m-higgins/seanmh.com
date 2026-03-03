const VERSIONS = [
  { name: 'a-scroll',   origin: 'https://seanmh-scroll.pages.dev',   weight: 34 },
  { name: 'b-card',     origin: 'https://seanmh-card.pages.dev',     weight: 33 },
  { name: 'c-terminal', origin: 'https://seanmh-terminal.pages.dev', weight: 33 },
];

function pickVersion() {
  const total = VERSIONS.reduce((sum, v) => sum + v.weight, 0);
  let rand = Math.random() * total;
  for (const v of VERSIONS) {
    rand -= v.weight;
    if (rand <= 0) return v;
  }
  return VERSIONS[VERSIONS.length - 1];
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Manual version override via query param
    const forceParam = url.searchParams.get('v');
    if (forceParam) {
      const forced = VERSIONS.find(ver => ver.name === forceParam);
      if (forced) {
        url.searchParams.delete('v');
        const proxyUrl = forced.origin + url.pathname + url.search;
        const resp = await fetch(proxyUrl, {
          method: request.method,
          headers: request.headers,
        });
        const headers = new Headers(resp.headers);
        headers.set('Set-Cookie', `pv=${forced.name}; Path=/; Max-Age=1800; SameSite=Lax`);
        headers.set('X-Portfolio-Version', forced.name);
        return new Response(resp.body, { status: resp.status, headers });
      }
    }

    // Check session cookie
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/pv=([a-z-]+)/);
    let chosen;
    let isNew = false;

    if (match) {
      chosen = VERSIONS.find(v => v.name === match[1]) || pickVersion();
    } else {
      chosen = pickVersion();
      isNew = true;
    }

    // Transparent proxy
    const proxyUrl = chosen.origin + url.pathname + url.search;
    const resp = await fetch(proxyUrl, {
      method: request.method,
      headers: request.headers,
    });

    const headers = new Headers(resp.headers);
    headers.set('X-Portfolio-Version', chosen.name);
    if (isNew) {
      headers.set('Set-Cookie', `pv=${chosen.name}; Path=/; Max-Age=1800; SameSite=Lax`);
    }

    return new Response(resp.body, { status: resp.status, headers });
  }
};
