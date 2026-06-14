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

const VERSIONS = [
  { name: "a-scroll", origin: "http://localhost:4321" },
  { name: "b-card", origin: "http://localhost:4322" },
  { name: "c-terminal", origin: "http://localhost:4323" },
];
const PORT = 8787;

function pickVersion() {
  return VERSIONS[Math.floor(Math.random() * VERSIONS.length)];
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Mirror worker.js: ?v= override, then pv cookie, then random assignment.
  const force = url.searchParams.get("v");
  const match = (req.headers.cookie || "").match(/pv=([a-z-]+)/);
  const chosen =
    VERSIONS.find((v) => v.name === force) ||
    VERSIONS.find((v) => match && v.name === match[1]) ||
    pickVersion();

  url.searchParams.delete("v");
  try {
    const upstream = await fetch(chosen.origin + url.pathname + url.search);
    const headers = Object.fromEntries(upstream.headers);
    delete headers["content-encoding"];
    delete headers["content-length"];
    // Mirror worker.js: only refresh the cookie on page navigations, so a stale
    // in-flight asset request from the previous version can't overwrite a
    // just-switched cookie.
    const isDocument = req.headers["sec-fetch-dest"] === "document"
      || (req.headers["accept"] || "").includes("text/html");
    if (isDocument) {
      headers["set-cookie"] = `pv=${chosen.name}; Path=/; Max-Age=1800; SameSite=Lax`;
    }
    headers["x-portfolio-version"] = chosen.name;
    res.writeHead(upstream.status, headers);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    res.writeHead(502, { "content-type": "text/plain" });
    res.end(`Upstream ${chosen.origin} not reachable — is its preview running?\n${err.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`Dev proxy on http://localhost:${PORT}`);
  for (const v of VERSIONS) console.log(`  ${v.name} ← ${v.origin}`);
});
