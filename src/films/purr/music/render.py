"""purr music — render the score to a seamless 300 s loop.

  python3 -I src/films/purr/music/render.py           -> renders/purr/music.wav, .m4a, music-loop-check.wav
  python3 -I src/films/purr/music/render.py --map     print the bar map and stop

Loop wrap: every note is written at (onset mod N) into a buffer N + TAIL long;
whatever rings past sample N is then added back onto the start. All later
processing (reverb, filters, wow/flutter, noise) is circular over exactly N
samples, so sample N-1 runs into sample 0 as if the piece never stopped.
"""
import json
import os
import re
import subprocess
import sys
import time
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, HERE)

import numpy as np          # noqa: E402
import score as C           # noqa: E402
import synth as S           # noqa: E402
from synth import SR, band, hp, lp, spectral  # noqa: E402

N = C.BARS * C.BAR_N        # 300 s at 48 kHz: 14,400,000 samples
TAIL = 16 * SR
OUT = os.path.join(ROOT, "renders", "purr")
TARGET_LUFS = -18.0
SEED = 64


class Track:
    def __init__(self):
        self.buf = np.zeros((N + TAIL, 2))

    def add(self, t, sig):
        if sig.ndim == 1:
            sig = np.stack([sig, sig], axis=1) * 0.7071
        i = int(round(t * SR)) % N
        L = min(len(sig), TAIL)
        self.buf[i:i + L] += sig[:L]

    def folded(self):
        out = self.buf[:N].copy()
        out[:TAIL] += self.buf[N:]
        return out


def circ_conv(x, ir):
    """Circular convolution over exactly N samples (the reverb tail wraps)."""
    h = np.zeros(N)
    h[:len(ir)] = ir
    return np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(h), n=N)


def make_ir(rng, length=3.0, predelay=0.024, rts=(2.1, 1.9, 1.5, 1.0, 0.6)):
    """Stereo room: band-split noise, low bands decaying slower than high.
    rts are the seconds to -60 dB in each band."""
    L = int(length * SR)
    t = np.arange(L) / SR
    edges = [(None, 300), (300, 900), (900, 2500), (2500, 6000), (6000, None)]
    irs = []
    for ch in range(2):
        nz = rng.standard_normal(L)
        ir = np.zeros(L)
        for (lo, hi), rt in zip(edges, rts):
            g = []
            if lo:
                g.append(hp(lo, 2))
            if hi:
                g.append(lp(hi, 2))
            ir += spectral(nz, *g) * 10 ** (-3 * t / rt)
        ir *= S.ramp(t, 0.03)                         # soft onset of the diffuse tail
        er = np.zeros(L)                              # a few early reflections
        for d, g in zip(rng.uniform(0.006, 0.045, 7), rng.uniform(0.15, 0.45, 7)):
            er[int(d * SR)] += g * rng.choice([-1, 1])
        er = spectral(er, lp(5000))
        ir = ir / np.sqrt(np.sum(ir ** 2)) + er * 0.35
        pd = int(predelay * SR)
        ir = np.concatenate([np.zeros(pd), ir])[:L]
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


def body_ir(rng):
    """The piano's case and soundboard: a short, coloured knock that every note
    excites, and under it the open strings humming in sympathy, which only
    answer at their own pitches (the notes of D-flat major)."""
    L = int(3.2 * SR)
    t = np.arange(L) / SR
    Lb = int(0.22 * SR)
    board = spectral(rng.standard_normal(Lb), band(70, 2200, 1)) * np.exp(-t[:Lb] / 0.045)
    board /= np.sqrt(np.sum(board ** 2))
    ir = np.zeros(L)
    ir[:Lb] += 0.5 * board
    symp = np.zeros(L)
    scale = [1, 3, 5, 6, 8, 10, 0]
    for midi in range(25, 85):
        if midi % 12 not in scale:
            continue
        f = S.hz(midi)
        for n in (1, 2, 3):
            if n * f < 3000:
                symp += np.sin(2 * np.pi * n * f * t + rng.uniform(0, 6.28)) * np.exp(-t / (1.3 / n ** 0.5)) / (n * n) / np.sqrt(f / 60)
    symp *= S.ramp(t, 0.04)
    ir += 0.5 * symp / np.sqrt(np.sum(symp ** 2))
    return ir


def k_weighted(x):
    f = np.fft.rfftfreq(N, 1 / SR)
    z = np.exp(-2j * np.pi * f / SR)
    h1 = (1.53512485958697 - 2.69169618940638 * z + 1.19839281085285 * z * z) / \
         (1 - 1.69065929318241 * z + 0.73248077421585 * z * z)
    h2 = (1 - 2 * z + z * z) / (1 - 1.99004745483398 * z + 0.99007225036621 * z * z)
    return np.fft.irfft(np.fft.rfft(x, axis=0) * (h1 * h2)[:, None], n=N, axis=0)


def block_loudness(y, win, hop):
    cs = np.concatenate([np.zeros((1, 2)), np.cumsum(y * y, axis=0)])
    starts = np.arange(0, N - win + 1, hop)
    ms = (cs[starts + win] - cs[starts]) / win
    return ms.sum(axis=1)


def lufs(x):
    """ITU BS.1770 integrated loudness (gated)."""
    z = block_loudness(k_weighted(x), int(0.4 * SR), int(0.1 * SR))
    lk = -0.691 + 10 * np.log10(z + 1e-20)
    z1 = z[lk > -70]
    rel = -0.691 + 10 * np.log10(z1.mean()) - 10
    return -0.691 + 10 * np.log10(z[lk > rel].mean())


def true_peak(x, os_=4):
    pk = 0.0
    for c in range(x.shape[1]):
        X = np.fft.rfft(x[:, c])
        Y = np.zeros(os_ * N // 2 + 1, complex)
        Y[:len(X)] = X
        pk = max(pk, np.abs(np.fft.irfft(Y, n=os_ * N)).max() * os_)
    return 20 * np.log10(pk)


def tape(x):
    """Wow and flutter as a circular modulated delay; every period divides 300 s."""
    n = np.arange(N)
    tt = n / SR
    d = (0.006 + 0.0007 * np.sin(2 * np.pi * 0.5 * tt + 0.3)        # wow, 2 s
         + 0.0035 * np.sin(2 * np.pi * (20 / 300) * tt + 1.1)       # drift, 15 s
         + 0.00002 * np.sin(2 * np.pi * 6.0 * tt + 0.7))            # flutter
    pos = n - d * SR
    i0 = np.floor(pos).astype(np.int64)
    fr = (pos - i0)[:, None]
    return x[i0 % N] * (1 - fr) + x[(i0 + 1) % N] * fr


def raised(t, a, b):
    """0 before a, 1 after b, raised-cosine between."""
    u = np.clip((t - a) / (b - a), 0, 1)
    return 0.5 - 0.5 * np.cos(np.pi * u)


def render():
    t_start = time.time()
    rng = np.random.default_rng(SEED)
    ev = C.events(SEED)
    names = ("piano", "rhodes", "bass", "drums", "strings", "celesta")
    tr = {k: Track() for k in names}
    counts = {}

    note_rng = np.random.default_rng(SEED + 1)
    kits = {
        "kick": [S.kick(note_rng) for _ in range(4)],
        "slap": [S.brush_slap(note_rng) for _ in range(6)],
        "ghost": [S.brush_slap(note_rng, short=True) for _ in range(6)],
        "rim": [S.rim(note_rng) for _ in range(4)],
        "tick": [S.tick(note_rng) for _ in range(3)],
    }
    drum_gain = {"kick": 0.55, "slap": 0.16, "ghost": 0.07, "rim": 0.12, "tick": 0.32}
    drum_pan = {"kick": 0.0, "slap": -0.2, "ghost": 0.25, "rim": -0.3, "tick": -0.28}
    for inst, t, p, vel, dur, extra in ev:
        counts[inst] = counts.get(inst, 0) + 1
        if inst == "piano":
            tr["piano"].add(t, S.piano(p, vel, dur, note_rng))
        elif inst == "rhodes":
            tr["rhodes"].add(t, S.rhodes(p, vel, dur, note_rng))
        elif inst == "bass":
            tr["bass"].add(t, S.bass(p, vel, dur, note_rng, slide=extra))
        elif inst == "strings":
            tr["strings"].add(t, S.strings(p, vel, dur, note_rng))
        elif inst == "celesta":
            tr["celesta"].add(t, S.celesta(p, vel, dur, note_rng))
        else:
            kit = kits[inst]
            y = kit[note_rng.integers(len(kit))] * vel * drum_gain[inst]
            gl, gr = S.pan(drum_pan[inst])
            tr["drums"].add(t, np.stack([y * gl, y * gr], axis=1))
    t_notes = time.time() - t_start

    stems = {k: tr[k].folded() for k in names}
    del tr
    tt = np.arange(N) / SR

    # brush sweep bed: per-beat circles, level per beat, smoothed (all circular)
    lv = C.sweep_levels()
    beat_pos = tt / C.BEAT
    k = np.arange(len(lv))
    level = np.interp(beat_pos, np.append(k, len(lv)), np.append(lv, lv[0]))
    level = spectral(level, lp(1.5, 2))
    u = (beat_pos - 0.1) % 1
    circles = 0.3 + 0.7 * np.sin(np.pi * u) ** 2
    sw = spectral(rng.standard_normal((N, 2)), band(1300, 5500, 2))
    sw = sw / sw.std() * (0.9 * level * circles)[:, None]
    sw[:, 0] *= 0.75                                  # brush hand sits a little right
    stems["drums"] += 0.028 * sw
    del sw, level, circles

    # weather and the fire: rain over bars 37-44 (it builds, then thins), the
    # stove's crackle under bars 61-64
    r_env = raised(tt, 132.5, 142.0) * (1 - raised(tt, 158.0, 166.0)) * (0.55 + 0.45 * raised(tt, 138.0, 146.0))
    hiss_r = spectral(rng.standard_normal((N, 2)), band(350, 4500, 1))
    drops = np.zeros((N, 2))
    nd = int(75 * 300)
    idx = rng.integers(0, N, nd)
    drops[idx, rng.integers(0, 2, nd)] = rng.uniform(0.2, 1.0, nd) ** 2
    drops = spectral(drops, band(1200, 5000, 2))
    air = (hiss_r / hiss_r.std() * 0.6 + drops / drops.std() * 0.4) * r_env[:, None] * 0.0075
    del hiss_r, drops
    f_env = raised(tt, 223.5, 227.0) * (1 - raised(tt, 237.5, 241.0))
    pops = np.zeros((N, 2))
    npop = int(7 * 20)
    pi_ = rng.integers(int(222 * SR), int(242 * SR), npop)
    pops[pi_, rng.integers(0, 2, npop)] = 10 ** rng.uniform(-1.2, 0, npop) * rng.choice([-1, 1], npop)
    pops = spectral(pops, band(500, 3200, 2))
    roar = spectral(rng.standard_normal((N, 2)), band(90, 700, 1))
    air += (pops * 2.8 + roar / roar.std() * 0.003) * f_env[:, None]
    del pops, roar
    stems["air"] = air

    # bus tone
    stems["piano"] = spectral(stems["piano"], lp(7500, 2), hp(40, 2))
    # the instrument's body: soundboard and sympathetic strings
    bir = body_ir(np.random.default_rng(SEED + 3))
    stems["piano"] += 0.2 * np.stack([circ_conv(stems["piano"][:, 0], bir), circ_conv(stems["piano"][:, 1], bir[::1])], axis=1)
    stems["rhodes"] = spectral(stems["rhodes"], lp(2600, 2), hp(90, 2))
    ap = 0.3 * np.sin(2 * np.pi * tt / C.BAR)         # one auto-pan sweep per bar
    stems["rhodes"][:, 0] *= 1 - ap
    stems["rhodes"][:, 1] *= 1 + ap
    stems["bass"] = spectral(stems["bass"], lp(1400, 2), hp(32, 2))
    stems["drums"] = spectral(stems["drums"], lp(7000, 2), hp(38, 2))
    stems["strings"] = spectral(stems["strings"], lp(3200, 2), hp(110, 2))
    stems["celesta"] = spectral(stems["celesta"], lp(7000, 2), hp(300, 2))

    gains = dict(piano=1.0, rhodes=0.36, bass=0.62, drums=1.0, strings=0.5, celesta=0.26, air=1.0)
    for k in stems:
        stems[k] *= gains[k]
    dry = sum(stems.values())

    # two rooms (both circular, so their tails wrap into bar 1): a close one all
    # the time, and a longer hall whose send follows the film (more when the
    # music is alone: dawn, the tank, the garden at night, the last phrase)
    sends = dict(piano=0.25, rhodes=0.4, bass=0.04, drums=0.22, strings=0.5, celesta=0.5, air=0.3)
    send = sum(stems[k] * sends[k] for k in stems)
    irL, irR = make_ir(np.random.default_rng(SEED + 2))
    wet = np.stack([circ_conv(0.75 * send[:, 0] + 0.25 * send[:, 1], irL),
                    circ_conv(0.75 * send[:, 1] + 0.25 * send[:, 0], irR)], axis=1)
    hl = C.hall_levels()
    kb = np.arange(len(hl))
    h_env = np.interp(tt / C.BAR, np.append(kb, len(hl)) + 0.5, np.append(hl, hl[0]), period=len(hl))
    h_env = spectral(h_env, lp(0.5, 2))
    hsend = (stems["piano"] * 0.5 + stems["celesta"] * 0.8 + stems["strings"] * 0.6 + stems["rhodes"] * 0.3) * h_env[:, None]
    hL, hR = make_ir(np.random.default_rng(SEED + 4), length=6.0, predelay=0.042, rts=(4.2, 3.8, 3.0, 1.9, 0.9))
    hall = np.stack([circ_conv(0.7 * hsend[:, 0] + 0.3 * hsend[:, 1], hL),
                     circ_conv(0.7 * hsend[:, 1] + 0.3 * hsend[:, 0], hR)], axis=1)
    wet = spectral(wet, hp(180, 2), lp(5500, 2)) + 0.8 * spectral(hall, hp(220, 2), lp(4200, 2))
    del send, hsend, hall
    mix = dry + wet
    del dry

    # tape: wow/flutter, gentle saturation, master tone
    mix = tape(mix)
    pre_rms = np.sqrt(np.mean(mix ** 2))
    mix *= 0.1 / pre_rms                              # into the "tape" at ~-20 dBFS RMS
    drive = 1.6
    mix = np.tanh(drive * (mix + 0.01)) / drive - np.tanh(drive * 0.01) / drive
    mix = spectral(mix, lp(8500, 2), hp(28, 2))

    # loudness, then dust: hiss and sparse crackle (both circular). The record
    # scene (bars 57-60) is the record: its crackle comes up for those bars.
    g = 10 ** ((TARGET_LUFS - lufs(mix)) / 20)
    mix *= g
    hiss = spectral(rng.standard_normal((N, 2)), band(500, 7000, 1))
    mix += hiss / hiss.std() * 10 ** (-64 / 20)
    del hiss
    cr = np.zeros((N, 2))
    nc = int(2.2 * 300)
    ci = rng.integers(0, N, nc)
    cr[ci, rng.integers(0, 2, nc)] = 10 ** rng.uniform(-3.4, -2.3, nc) * rng.choice([-1, 1], nc)
    nc2 = int(7 * 16)
    ci2 = rng.integers(int(209 * SR), int(226 * SR), nc2)
    cr[ci2, rng.integers(0, 2, nc2)] += 10 ** rng.uniform(-3.1, -2.1, nc2) * rng.choice([-1, 1], nc2)
    mix += spectral(cr, band(900, 6000, 2)) * 3.0
    del cr
    mix *= 10 ** ((TARGET_LUFS - lufs(mix)) / 20)
    mix -= mix.mean(axis=0)
    t_mix = time.time() - t_start - t_notes

    stem_db = {}                                      # K-weighted, per phrase, after master gain
    gm = g * 0.1 / pre_rms
    P15 = 15 * SR
    for name, s in list(stems.items()) + [("reverb", wet)]:
        kw = k_weighted(s * gm)
        stem_db[name] = [round(-0.691 + 10 * np.log10(np.mean(np.sum(
            kw[i * P15:(i + 1) * P15] ** 2, axis=1)) + 1e-20), 1) for i in range(C.PHRASES)]
    kw = k_weighted(mix)
    stem_db["mix"] = [round(-0.691 + 10 * np.log10(np.mean(np.sum(
        kw[i * P15:(i + 1) * P15] ** 2, axis=1)) + 1e-20), 1) for i in range(C.PHRASES)]
    return mix, dict(counts=counts, t_notes=t_notes, t_mix=t_mix, stem_db=stem_db)


def write_wav(path, x):
    y = np.clip(np.round(x * 8388607), -8388608, 8388607).astype("<i4")
    b = y.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


def seam_report(x):
    d = np.abs(np.diff(x, axis=0))
    wrap = np.abs(x[0] - x[-1])
    near = np.concatenate([d[-SR:], d[:SR]])
    r = {}
    r["wrap_jump"] = float(wrap.max())
    r["median_jump_near"] = float(np.median(near))
    r["p99_jump_near"] = float(np.percentile(near, 99))
    r["max_jump_near"] = float(near.max())
    h = int(0.5 * SR)
    rms = lambda s: 20 * np.log10(np.sqrt(np.mean(s ** 2)))
    r["rms_last_0.5s_db"] = round(rms(x[-h:]), 2)
    r["rms_first_0.5s_db"] = round(rms(x[:h]), 2)
    # the same step at every other bar line, for comparison (downbeats are louder)
    steps = [rms(x[b * C.BAR_N:b * C.BAR_N + h]) - rms(x[b * C.BAR_N - h:b * C.BAR_N])
             for b in range(1, C.BARS)]
    r["seam_step_db"] = round(r["rms_first_0.5s_db"] - r["rms_last_0.5s_db"], 2)
    r["other_barline_steps_db"] = dict(min=round(min(steps), 2), median=round(float(np.median(steps)), 2),
                                       max=round(max(steps), 2))
    # click detector: >4 kHz energy in 5 ms windows across the seam
    lp_ = np.concatenate([x[-SR:], x[:SR]])
    hf = spectral(lp_, hp(4000, 4))
    w = int(0.005 * SR)
    e = (hf[: len(hf) // w * w] ** 2).sum(axis=1).reshape(-1, w).mean(axis=1)
    seam_w = SR // w
    r["hf_seam_vs_median_db"] = round(10 * np.log10(e[seam_w - 1:seam_w + 1].max() /
                                                   np.median(e)), 2)
    # spectrum just before vs just after (2 s each), band levels
    def bands(s):
        f = np.fft.rfftfreq(len(s), 1 / SR)
        P = (np.abs(np.fft.rfft(s.mean(axis=1) * np.hanning(len(s)))) ** 2)
        out = []
        for lo, hi in [(20, 150), (150, 500), (500, 2000), (2000, 6000), (6000, 12000)]:
            out.append(round(10 * np.log10(P[(f >= lo) & (f < hi)].sum() + 1e-20), 1))
        return out
    r["bands_last_2s_db"] = bands(x[-2 * SR:])
    r["bands_first_2s_db"] = bands(x[:2 * SR])
    return r


def spectrum_report(x):
    f = np.fft.rfftfreq(N, 1 / SR)
    P = np.abs(np.fft.rfft(x.mean(axis=1))) ** 2
    tot = P.sum()
    return dict(
        dc=[float(v) for v in x.mean(axis=0)],
        frac_above_8k_db=round(10 * np.log10(P[f > 8000].sum() / tot), 1),
        frac_above_10k_db=round(10 * np.log10(P[f > 10000].sum() / tot), 1),
        centroid_hz=round(float((f * P).sum() / tot), 0),
    )


def ffmpeg_loudness(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                        "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    s = p.stderr[p.stderr.rfind("Summary:"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1))
    LRA = float(re.search(r"LRA:\s+(-?[\d.]+) LU", s).group(1))
    TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
    return dict(I=I, LRA=LRA, TP=TP)


def main():
    if "--map" in sys.argv:
        print(C.bar_map())
        return
    bad = C.check()
    if bad:
        raise SystemExit("melody rests on notes its chord does not hold:\n" + "\n".join(bad))
    os.makedirs(OUT, exist_ok=True)
    t0 = time.time()
    x, info = render()
    assert x.shape == (N, 2) and np.isfinite(x).all()
    tp = true_peak(x)
    peak = 20 * np.log10(np.abs(x).max())
    wav = os.path.join(OUT, "music.wav")
    write_wav(wav, x)
    loop = np.concatenate([x[-10 * SR:], x[:10 * SR]])
    write_wav(os.path.join(OUT, "music-loop-check.wav"), loop)
    m4a = os.path.join(OUT, "music.m4a")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", wav,
                    "-c:a", "aac", "-b:a", "128k", m4a], check=True)
    rep = dict(
        render_s=round(time.time() - t0, 1), notes_s=round(info["t_notes"], 1),
        mix_s=round(info["t_mix"], 1), events=info["counts"],
        lufs_internal=round(lufs(x), 2), true_peak_internal_dbtp=round(tp, 2),
        sample_peak_dbfs=round(peak, 2), stems_lufs_per_phrase=info["stem_db"],
        seam=seam_report(x), spectrum=spectrum_report(x),
        ffmpeg_wav=ffmpeg_loudness(wav), ffmpeg_m4a=ffmpeg_loudness(m4a),
    )
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
