// Render a film to MP4 with one persistent headless Chrome over CDP, piping
// PNG frames straight into ffmpeg. No dependencies; Node 22's global WebSocket.
//
//   node scripts/render-film.mjs <slug>                 draft -> renders/<slug>.mp4
//   node scripts/render-film.mjs <slug> --release       public/<slug>.mp4 + -poster.webp + .vtt (20 MiB budget)
//   node scripts/render-film.mjs <slug> --still 3.5,12  PNG stills -> renders/<slug>-<t>s.png
//   node scripts/render-film.mjs <slug> --hash 0,60     same frame twice (fresh page each time) -> same hash?
//   options: --from <s> --to <s> (draft range) · --crf <n> (default 20) · --poster <s>
//            --look <name> (passed to scenes as env.look; stills are named <slug>-<look>-<t>s.png)
//   node scripts/render-film.mjs <slug> --loop <scene>  one scene, env.loop set -> public/<slug>-loop.mp4 + .gif (720 px)
//   --audio <file> muxes a soundtrack (AAC 160 kb/s) into a draft or release; it must be as long as the film

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './film-server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BUDGET = 20 * 1024 * 1024;

const argv = process.argv.slice(2);
const slug = argv[0];
const opt = (name) => { const i = argv.indexOf(`--${name}`); return i < 0 ? undefined : (argv[i + 1] ?? true); };
if (!slug || slug.startsWith('--')) {
  console.error('usage: node scripts/render-film.mjs <slug> [--release] [--still t,t] [--hash f,f] [--from s] [--to s] [--crf n] [--poster s]');
  process.exit(1);
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      const p = m.id && this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
    };
    this.open = new Promise((ok, bad) => { this.ws.onopen = ok; this.ws.onerror = bad; });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  }
  close() { this.ws.close(); }
}

async function launchChrome() {
  const profile = await mkdtemp(join(tmpdir(), 'film-chrome-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--mute-audio', '--force-device-scale-factor=1', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const port = await new Promise((ok, bad) => {
    let buf = '';
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (m) ok(+m[1]);
    });
    proc.on('exit', () => bad(new Error('Chrome exited before DevTools was ready')));
  });
  return { proc, port, profile };
}

async function openStage(chrome, url) {
  const r = await fetch(`http://127.0.0.1:${chrome.port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const target = await r.json();
  const page = new CDP(target.webSocketDebuggerUrl);
  await page.open;
  await page.send('Runtime.enable');
  const info = await page.eval(`new Promise((ok, bad) => { const t0 = Date.now();
    (function wait() { if (window.__stage) return ok(window.__stage.info);
      if (Date.now() - t0 > 20000) return bad(new Error('stage did not load'));
      setTimeout(wait, 30); })(); })`);
  return { page, info, id: target.id };
}

const png = async (page, i) => Buffer.from((await page.eval(`__stage.render(${i})`)).split(',')[1], 'base64');

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  p.done = new Promise((ok, bad) => p.on('exit', (c) => (c === 0 ? ok() : bad(new Error(`ffmpeg exited ${c}`)))));
  return p;
}

function probe(file) {
  return new Promise((ok) => {
    const p = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,bit_rate,size', '-of', 'json', file]);
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('exit', () => ok(JSON.parse(out).format));
  });
}

const server = await startServer(0);
const look = opt('look');
const loopScene = opt('loop');
const base = `http://127.0.0.1:${server.address().port}/tools/stage.html?film=${slug}&render=1${look ? `&look=${look}` : ''}${loopScene ? '&loop=1' : ''}`;
const tag = look ? `${slug}-${look}` : slug;
const chrome = await launchChrome();
try {
  const { page, info } = await openStage(chrome, base);
  console.log(`${slug}: ${info.frames} frames · ${info.duration}s · ${info.size}² @ ${info.fps} fps`);
  await mkdir(join(ROOT, 'renders'), { recursive: true });

  if (opt('hash')) {
    for (const f of String(opt('hash')).split(',').map(Number)) {
      const a = createHash('sha256').update(await png(page, f)).digest('hex');
      await png(page, f + 1); // draw something else in between
      const b = createHash('sha256').update(await png(page, f)).digest('hex');
      const fresh = await openStage(chrome, base);
      const c = createHash('sha256').update(await png(fresh.page, f)).digest('hex');
      fresh.page.close();
      console.log(`frame ${f}: ${a.slice(0, 16)} ${a === b && b === c ? 'identical (same page twice, and a fresh page)' : `DIFFERS: ${b.slice(0, 16)} ${c.slice(0, 16)}`}`);
    }
  } else if (opt('still')) {
    for (const s of String(opt('still')).split(',').map(Number)) {
      const out = join(ROOT, 'renders', `${tag}-${s}s.png`);
      await writeFile(out, await png(page, Math.min(info.frames - 1, Math.round(s * info.fps))));
      console.log(out);
    }
  } else if (loopScene) {
    // The sharing loop: one scene, rendered with env.loop so it has no seam.
    const sc = info.scenes.find((x) => x.id === loopScene);
    if (!sc) throw new Error(`no scene "${loopScene}" in ${slug}`);
    const from = Math.round(sc.start * info.fps), to = Math.round((sc.start + sc.dur) * info.fps);
    const mp4 = join(ROOT, 'public', `${slug}-loop.mp4`), gif = join(ROOT, 'public', `${slug}-loop.gif`);
    const frameDir = await mkdtemp(join(tmpdir(), 'film-loop-'));
    const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(info.fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation',
      '-crf', String(opt('crf') ?? 20), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    for (let i = from; i < to; i++) {
      const buf = await png(page, i);
      await writeFile(join(frameDir, `${String(i - from).padStart(4, '0')}.png`), buf);
      if (!enc.stdin.write(buf)) await new Promise((ok) => enc.stdin.once('drain', ok));
    }
    enc.stdin.end();
    await enc.done;
    const frames = Array.from({ length: to - from }, (_, k) => join(frameDir, `${String(k).padStart(4, '0')}.png`));
    await new Promise((ok, bad) => spawn('gifski', ['--quiet', '--fps', String(info.fps), '--width', '720', '--quality', '80', '-o', gif, ...frames], { stdio: 'inherit' })
      .on('exit', (c) => (c === 0 ? ok() : bad(new Error(`gifski exited ${c}`)))));
    await rm(frameDir, { recursive: true, force: true });
    for (const f of [mp4, gif]) console.log(`${f}  ${((await stat(f)).size / 1048576).toFixed(2)} MiB`);
  } else {
    const release = !!opt('release');
    const out = release ? join(ROOT, 'public', `${slug}.mp4`) : join(ROOT, 'renders', `${slug}.mp4`);
    const from = Math.round((+opt('from') || 0) * info.fps);
    const to = opt('to') ? Math.min(info.frames, Math.round(+opt('to') * info.fps)) : info.frames;
    const audio = opt('audio') ? resolve(String(opt('audio'))) : null;
    const audioIn = audio ? ['-ss', String(from / info.fps), '-t', String((to - from) / info.fps), '-i', audio] : [];
    const audioOut = audio ? ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k'] : [];
    const enc = ffmpeg(['-f', 'image2pipe', '-framerate', String(info.fps), '-i', '-', ...audioIn,
      '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', String(opt('crf') ?? 20),
      '-pix_fmt', 'yuv420p', ...audioOut, '-movflags', '+faststart', out]);
    const t0 = Date.now();
    for (let i = from; i < to; i++) {
      if (!enc.stdin.write(await png(page, i))) await new Promise((ok) => enc.stdin.once('drain', ok));
      if ((i - from) % 48 === 0) process.stdout.write(`\r  frame ${i}/${to - 1}`);
    }
    enc.stdin.end();
    await enc.done;
    const secs = (Date.now() - t0) / 1000;
    const p = await probe(out);
    const mib = p.size / 1048576, kbps = p.bit_rate / 1000;
    console.log(`\r${out}\n  ${to - from} frames in ${secs.toFixed(1)}s (${((to - from) / secs).toFixed(1)} fps) · ${mib.toFixed(2)} MiB · ${kbps.toFixed(0)} kb/s · 60 s at this rate ≈ ${((kbps * 60) / 8 / 1024).toFixed(1)} MiB`);
    if (release) {
      if (p.size > BUDGET) throw new Error(`over budget: ${mib.toFixed(2)} MiB > 20 MiB. Raise --crf or simplify the boil.`);
      const posterAt = Math.round((+opt('poster') || info.duration * 0.8) * info.fps);
      // Homebrew's ffmpeg has no WebP encoder; ImageMagick's libwebp writes the poster.
      const poster = spawn('magick', ['png:-', '-quality', '90', `webp:${join(ROOT, 'public', `${slug}-poster.webp`)}`], { stdio: ['pipe', 'inherit', 'inherit'] });
      const posterDone = new Promise((ok, bad) => poster.on('exit', (c) => (c === 0 ? ok() : bad(new Error(`magick exited ${c}`)))));
      poster.stdin.end(await png(page, Math.min(info.frames - 1, posterAt)));
      await posterDone;
      await writeFile(join(ROOT, 'public', `${slug}.vtt`), info.vtt);
      console.log(`  + public/${slug}-poster.webp, public/${slug}.vtt`);
    }
  }
  page.close();
} finally {
  chrome.proc.kill();
  server.close();
  await new Promise((ok) => setTimeout(ok, 300));
  await rm(chrome.profile, { recursive: true, force: true });
}
