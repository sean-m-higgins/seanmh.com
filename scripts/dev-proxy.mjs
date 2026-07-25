#!/usr/bin/env node
// Local stand-in for the Cloudflare Worker (worker.js): serves all version
// builds from ONE origin so cross-document view transitions can be tested
// locally (they require same-origin navigation).
//
// Usage:
//   1. Build + preview each version worktree on its port:
//        a-scroll:   npm run preview -- --port 4321
//        b-card:     npm run preview -- --port 4322
//        c-terminal: npm run preview -- --port 4323
//   2. node scripts/dev-proxy.mjs
//   3. Open http://localhost:8787 in Chrome/Edge and use the dial.
import http from "node:http";
import { Readable } from "node:stream";

const VERSIONS = [
  { name: "a-scroll", origin: "http://localhost:4321", weight: 34 },
  { name: "b-card", origin: "http://localhost:4322", weight: 33 },
  { name: "c-terminal", origin: "http://localhost:4323", weight: 33 },
];
const PORT = Number.parseInt(process.env.PORT || "8787", 10);
const COOKIE_NAME = "pv";
// Intentionally omit Secure because this dev proxy is served over plain HTTP.
const COOKIE_OPTIONS = "Path=/; Max-Age=1800; SameSite=Lax; HttpOnly";
const DOCUMENT_CACHE_CONTROL = "private, no-store";
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT: ${process.env.PORT}`);
  process.exit(1);
}

if (typeof fetch !== "function") {
  console.error("scripts/dev-proxy.mjs requires Node 18+ because it uses the built-in fetch API.");
  process.exit(1);
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
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]*)`));
  return match?.[1];
}

function findVersion(name) {
  return VERSIONS.find((v) => v.name === name);
}

function cookieFor(version) {
  return `${COOKIE_NAME}=${version.name}; ${COOKIE_OPTIONS}`;
}

function isDocumentRequest(req) {
  return req.headers["sec-fetch-dest"] === "document"
    || (req.headers.accept || "").includes("text/html");
}

function upstreamRequestHeaders(req) {
  const headers = { ...req.headers };

  // These are connection-specific for this local proxy hop, not for the
  // preview server hop.
  for (const header of HOP_BY_HOP_HEADERS) {
    delete headers[header];
  }
  delete headers.host;

  return headers;
}

function upstreamRequestInit(req) {
  const init = {
    method: req.method,
    headers: upstreamRequestHeaders(req),
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req;
    init.duplex = "half";
  }

  return init;
}

function responseHeadersFrom(upstream) {
  const headers = {};

  for (const [key, value] of upstream.headers) {
    const lowerKey = key.toLowerCase();
    if (
      HOP_BY_HOP_HEADERS.has(lowerKey)
      || lowerKey === "content-encoding"
      || lowerKey === "content-length"
      || lowerKey === "set-cookie"
    ) {
      continue;
    }
    headers[lowerKey] = value;
  }

  const setCookies = typeof upstream.headers.getSetCookie === "function"
    ? upstream.headers.getSetCookie()
    : upstream.headers.get("set-cookie")
      ? [upstream.headers.get("set-cookie")]
      : [];

  if (setCookies.length > 0) {
    headers["set-cookie"] = setCookies;
  }

  return headers;
}

function rewriteLocationHeader(headers, publicUrl, upstreamUrl) {
  const location = headers.location;
  if (!location) return;

  try {
    const originLocation = new URL(location, upstreamUrl);
    if (originLocation.origin !== new URL(upstreamUrl).origin) return;

    const rewritten = new URL(publicUrl);
    rewritten.pathname = originLocation.pathname;
    rewritten.search = originLocation.search;
    rewritten.hash = originLocation.hash;
    headers.location = rewritten.toString();
  } catch {
    // Leave unusual Location values untouched.
  }
}

function appendSetCookie(headers, cookie) {
  const existing = headers["set-cookie"];
  if (!existing) {
    headers["set-cookie"] = cookie;
  } else if (Array.isArray(existing)) {
    headers["set-cookie"] = [...existing, cookie];
  } else {
    headers["set-cookie"] = [existing, cookie];
  }
}

function pipeUpstreamBody(upstream, res) {
  if (!upstream.body) {
    res.end();
    return;
  }

  Readable.fromWeb(upstream.body).on("error", (err) => {
    console.error(`Error reading upstream response: ${err.message}`);
    res.destroy(err);
  }).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

  // Mirror worker.js: ?v= override, then pv cookie, then random assignment.
  const force = url.searchParams.get("v");
  url.searchParams.delete("v");
  const forced = findVersion(force);
  const cookieVersion = findVersion(getCookieValue(req.headers.cookie || "", COOKIE_NAME));
  const chosen =
    forced ||
    cookieVersion ||
    pickVersion();

  try {
    const upstreamUrl = chosen.origin + url.pathname + url.search;
    const upstream = await fetch(upstreamUrl, upstreamRequestInit(req));
    const headers = responseHeadersFrom(upstream);
    rewriteLocationHeader(headers, url, upstreamUrl);
    // Mirror worker.js: only refresh the cookie on page navigations, so a stale
    // in-flight asset request from the previous version can't overwrite a
    // just-switched cookie. A manual ?v= selection also updates the cookie.
    const isDocument = isDocumentRequest(req);
    if (forced || isDocument) {
      appendSetCookie(headers, cookieFor(chosen));
    }
    if (isDocument) {
      headers["cache-control"] = DOCUMENT_CACHE_CONTROL;
    }
    headers["x-portfolio-version"] = chosen.name;

    res.writeHead(upstream.status, headers);
    if (req.method === "HEAD") {
      res.end();
    } else {
      pipeUpstreamBody(upstream, res);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.writeHead(502, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "x-portfolio-version": chosen.name,
    });
    res.end(`Upstream ${chosen.origin} not reachable — is its preview running?\n${message}`);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT=... to choose a different local proxy port.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Dev proxy on http://localhost:${PORT}`);
  for (const v of VERSIONS) console.log(`  ${v.name} ← ${v.origin}`);
});
