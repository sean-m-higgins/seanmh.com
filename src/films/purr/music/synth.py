"""purr music — the instruments. Every sound here is computed from numbers.

Each note function returns a float array (samples, 2) or (samples,) starting at
the note's onset. Filters are zero-phase FFT masks; on whole-track signals they
are circular, which is exactly what a seamless loop wants.
"""
import numpy as np

SR = 48000


def hz(midi):
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def pan(p):
    """Constant-power gains for p in [-1, 1]."""
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


# --- zero-phase FFT filtering -------------------------------------------------

def lp(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order))


def hp(fc, order=2):
    return lambda f: (f / fc) ** order / np.sqrt(1 + (f / fc) ** (2 * order))


def band(lo, hi, order=2):
    a, b = hp(lo, order), lp(hi, order)
    return lambda f: a(f) * b(f)


def spectral(x, *gains):
    """Filter x (n,) or (n, ch) by the product of magnitude masks. Circular."""
    n = x.shape[0]
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    for gain in gains:
        g = g * gain(f)
    X = np.fft.rfft(x, axis=0)
    if X.ndim == 2:
        g = g[:, None]
    return np.fft.irfft(X * g, n=n, axis=0)


def ramp(t, att):
    """Raised-cosine attack from 0 to 1 over att seconds."""
    return np.where(t < att, 0.5 - 0.5 * np.cos(np.pi * np.minimum(t, att) / att), 1.0)


# --- felt piano ---------------------------------------------------------------

def piano(midi, vel, dur, rng):
    """A soft felt upright: inharmonic partials, 2-3 detuned strings, two-stage
    decay, velocity-dependent brightness, a felt thump, damper release."""
    f0 = hz(midi)
    B = 4e-5 * np.exp(0.05 * (midi - 21))                    # inharmonicity
    tau = np.interp(midi, [21, 36, 48, 60, 72, 84, 96, 108],
                    [13, 9.5, 7, 5, 3.4, 2.2, 1.4, 0.9])    # aftersound, fundamental
    t_rel = np.interp(midi, [30, 60, 90], [0.28, 0.16, 0.09])  # damper
    fc = 900 + 3000 * vel ** 1.4                             # felt: soft = dark
    nmax = int(np.clip(6000 / f0, 6, 30))
    n = np.arange(1, nmax + 1)
    fn = n * f0 * np.sqrt(1 + B * n * n)
    keep = fn < 7000
    n, fn = n[keep], fn[keep]
    amp = n ** -0.85 / (1 + (fn / fc) ** 1.7)
    amp *= 0.3 + np.abs(np.sin(np.pi * n / 7.4))             # hammer at ~1/7 of string
    amp /= np.sqrt(np.sum(amp ** 2))
    amp *= vel ** 1.7
    t2 = tau * (f0 / fn) ** 0.8                              # higher partials die sooner
    t1 = np.minimum(0.13 * t2, 0.7)                          # prompt sound
    w = 0.38                                                 # aftersound weight

    length = dur + 7 * t_rel
    L = int(length * SR) + 1
    t = np.arange(L) / SR
    att = 0.003 + 0.012 * (1 - vel)
    shape = ramp(t, att) * np.where(t < dur, 1.0, np.exp(-(t - dur) / t_rel))

    strings = 3 if midi >= 46 else 2
    det = rng.uniform(0.35, 1.2)                             # cents
    cents = np.array([0.0, det, -0.75 * det])[:strings]
    sa = np.array([1.0, 0.85, 0.7])[:strings]
    sa /= sa.sum()
    phases = rng.uniform(0, 2 * np.pi, len(n))

    y = np.zeros(L)
    for k in range(len(n)):
        Lk = min(L, int(t2[k] * np.log(w / 1e-4) * SR) + 1)
        tk = t[:Lk]
        env = (1 - w) * np.exp(-tk / t1[k]) + w * np.exp(-tk / t2[k])
        if k < 8:
            s = np.zeros(Lk)
            for c, a in zip(cents, sa):
                s += a * np.sin(2 * np.pi * fn[k] * 2 ** (c / 1200) * tk + phases[k])
        else:
            s = np.sin(2 * np.pi * fn[k] * tk + phases[k])
        y[:Lk] += amp[k] * env * s
    y *= shape

    # felt hammer thump and a little wooden knock
    Lt = min(L, int(0.09 * SR))
    tt = t[:Lt]
    thump = spectral(rng.standard_normal(Lt), lp(260 + 900 * vel))
    thump = thump / (np.std(thump) + 1e-12) * ramp(tt, 0.002) * np.exp(-tt / 0.014)
    knock = np.sin(2 * np.pi * 135 * tt) * np.exp(-tt / 0.028)
    y[:Lt] += vel ** 1.5 * (0.035 * thump + 0.03 * knock)

    gl, gr = pan(np.clip((midi - 62) / 30, -0.7, 0.7) * 0.75)
    return np.stack([y * gl, y * gr], axis=1)


# --- electric piano pad (Rhodes-like, 1:1 FM) ---------------------------------

def rhodes(midi, vel, dur, rng):
    f0 = hz(midi)
    L = int((dur + 0.9) * SR) + 1
    t = np.arange(L) / SR
    index = (0.3 + 1.3 * vel) * np.exp(-t / 0.35) + 0.3
    ph = 2 * np.pi * f0 * t + rng.uniform(0, 2 * np.pi)
    y = np.sin(ph + index * np.sin(ph))
    tau = np.interp(midi, [36, 60, 84], [6.0, 3.8, 2.2])
    env = ramp(t, 0.035) * (0.45 * np.exp(-t / 0.9) + 0.55 * np.exp(-t / tau))
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.13))
    y *= env * vel ** 1.5
    return np.stack([y, y], axis=1) * 0.7071


# --- upright bass -------------------------------------------------------------

def bass(midi, vel, dur, rng, slide=0.0):
    """Sine plus a few quickly-fading harmonics; a pluck; optional slide-in."""
    f0 = hz(midi)
    L = int((dur + 0.55) * SR) + 1
    t = np.arange(L) / SR
    f = f0 * 2 ** (slide / 12 * np.exp(-t / 0.045))
    ph = 2 * np.pi * np.cumsum(f) / SR + rng.uniform(0, 2 * np.pi)
    y = np.sin(ph)
    for h, a, d in [(2, 0.5, 0.5), (3, 0.24, 0.26), (4, 0.11, 0.13), (5, 0.05, 0.07)]:
        y += a * np.exp(-t / d) * np.sin(h * ph)
    env = ramp(t, 0.006) * (0.55 * np.exp(-t / 0.42) + 0.45 * np.exp(-t / 2.6))
    env *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.07))
    Lt = int(0.05 * SR)
    pluck = spectral(rng.standard_normal(Lt), lp(520))
    pluck = pluck / np.std(pluck) * np.exp(-t[:Lt] / 0.01)
    y = y * env
    y[:Lt] += 0.12 * pluck * ramp(t[:Lt], 0.001)
    y *= vel ** 1.3
    return np.stack([y, y], axis=1) * 0.7071


# --- soft kit -----------------------------------------------------------------

def kick(rng):
    L = int(0.55 * SR)
    t = np.arange(L) / SR
    f = 47 + 68 * np.exp(-t / 0.028)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * ramp(t, 0.002) * np.exp(-t / 0.2)
    click = spectral(rng.standard_normal(L), lp(1200))
    y += 0.05 * click / np.std(click) * np.exp(-t / 0.003)
    return y


def brush_slap(rng, short=False):
    L = int(0.7 * SR)
    t = np.arange(L) / SR
    nz = spectral(rng.standard_normal(L), band(550, 4800))
    nz /= np.std(nz)
    if short:
        env = ramp(t, 0.003) * np.exp(-t / 0.035)
    else:
        env = ramp(t, 0.004) * (0.8 * np.exp(-t / 0.075) + 0.2 * np.exp(-t / 0.3))
    body = 0.22 * np.sin(2 * np.pi * 188 * t) * np.exp(-t / 0.06)
    return nz * env + body * ramp(t, 0.002)


def rim(rng):
    """A felt-muffled cross-stick."""
    L = int(0.18 * SR)
    t = np.arange(L) / SR
    nz = spectral(rng.standard_normal(L), band(700, 3800))
    nz /= np.std(nz)
    y = (0.55 * np.sin(2 * np.pi * 1580 * t) * np.exp(-t / 0.007)
         + 0.6 * np.sin(2 * np.pi * 510 * t) * np.exp(-t / 0.02)
         + 0.25 * nz * np.exp(-t / 0.004))
    return y * ramp(t, 0.0008)
