// A dependency-free static server for the film stage and storyboards, bound
// to localhost only. It serves tools/, src/ and incoming/ (local storyboards)
// from this worktree, and /refs/ from ~/SoftLot/MyWebsite/film-refs, the
// prepared reference photos, which never enter git.
//
//   node scripts/film-server.mjs [port]     # default 4340
//   open http://127.0.0.1:4340/tools/stage.html?film=test

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REFS = resolve(ROOT, '../../film-refs');
const ALLOWED = ['tools/', 'src/', 'incoming/'];
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.vtt': 'text/vtt',
};

export function startServer(port = 4340) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '');
    let file = null;
    if (path.startsWith('refs/')) file = join(REFS, path.slice(5));
    else if (ALLOWED.some((p) => path.startsWith(p))) file = join(ROOT, path);
    if (!file || !(file.startsWith(ROOT) || file.startsWith(REFS))) {
      res.writeHead(404).end('not found');
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await startServer(+(process.argv[2] ?? 4340));
  const { port } = server.address();
  console.log(`film stage: http://127.0.0.1:${port}/tools/stage.html?film=test`);
}
