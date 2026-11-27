"""purr music — the composition, as data, and the player that turns it into events.

D-flat major, 64 BPM, 4/4, 32 bars = 120 s. Eight 4-bar scenes, morning to
night. Bar 32 (Ab13sus) turns back to bar 1 (Gbmaj9), so the loop is a cadence.
All melodies and progressions here are original.
"""
import numpy as np

BPM = 64
BEAT = 60 / BPM            # 0.9375 s
BAR = 4 * BEAT             # 3.75 s
BAR_N = 180000             # samples per bar at 48 kHz
BARS = 32
SWING = 0.6                # where the off-beat eighth lands inside a beat

PC = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7,
      "Ab": 8, "A": 9, "Bb": 10, "B": 11, "Cb": -1}


def m(name):
    """'Db5' -> 73. Cb4 is B3."""
    return 12 * (int(name[-1]) + 1) + PC[name[:-1]]


# root, rootless mid-register voicing (low -> high)
CHORDS = {
    "Gbmaj9":  ("Gb", "Bb3 Db4 F4 Ab4"),     # 3 5 7 9
    "Fm7":     ("F",  "Ab3 Bb3 C4 Eb4"),     # b3 11 5 b7
    "Ebm9":    ("Eb", "Gb3 Bb3 Db4 F4"),     # b3 5 b7 9
    "Dbmaj9":  ("Db", "F3 Ab3 C4 Eb4"),      # 3 5 7 9
    "Ab13sus": ("Ab", "Gb3 Bb3 Db4 Eb4"),    # b7 9 11 5
    "Ab13":    ("Ab", "Gb3 Bb3 C4 F4"),      # b7 9 3 13
    "Bb7b9":   ("Bb", "Ab3 Cb4 D4 F4"),      # b7 b9 3 5
    "Bbm9":    ("Bb", "F3 Ab3 C4 Db4"),      # 5 b7 9 b3
    "Fsus7":   ("F",  "Eb3 Bb3 C4 F4"),      # b7 4 5 1
    "F7b9":    ("F",  "Eb3 A3 C4 Gb4"),      # b7 3 5 b9
}

# bar -> [(beat, chord)], bars 1-based
PROG = {
    1: "Gbmaj9", 2: "Fm7", 3: "Ebm9", 4: "Dbmaj9",
    5: "Gbmaj9", 6: "Fm7 Bb7b9", 7: "Ebm9", 8: "Ab13sus Ab13",
    9: "Dbmaj9", 10: "Bbm9", 11: "Ebm9", 12: "Ab13",
    13: "Dbmaj9", 14: "Gbmaj9", 15: "Fm7 Bbm9", 16: "Ebm9 Ab13",
    17: "Bbm9", 18: "Gbmaj9", 19: "Ebm9", 20: "Fsus7 F7b9",
    21: "Gbmaj9", 22: "Fm7 Bb7b9", 23: "Ebm9 Ab13", 24: "Dbmaj9",
    25: "Bbm9", 26: "Ebm9", 27: "Gbmaj9 Ab13", 28: "Dbmaj9",
    29: "Gbmaj9", 30: "Fm7", 31: "Ebm9", 32: "Ab13sus",
}
CHANGES = {b: [(2.0 * i, c) for i, c in enumerate(s.split())] for b, s in PROG.items()}

# melody: bar -> "beat:dur:note ..."
MELODY = {
    # 1 morning — sparse, waking
    1: "0:3:F5 3.5:.5:Eb5",
    2: "0:1.5:C5 1.5:.5:Bb4 2:2:Ab4",
    3: "1:1:Bb4 2:.5:Db5 2.5:1.5:F5",
    4: "0:2:Eb5 2:2:C5",
    # 2 late morning — the theme
    5: ".5:.5:Bb4 1:.5:Db5 1.5:1:F5 2.5:.5:Ab5 3:1:F5",
    6: "0:1.5:Eb5 1.5:.5:C5 2:1:D5 3:1:Db5",
    7: "0:1.5:Bb4 1.5:.5:Gb4 2:.5:Ab4 2.5:1.5:Bb4",
    8: ".5:1.5:Db5 2:2:C5",
    # 3 midday — brighter, higher
    9: ".5:.5:Eb5 1:.5:F5 1.5:1.5:Ab5 3:.5:F5 3.5:.5:Eb5",
    10: "0:2:F5 2:.5:Db5 2.5:.5:Eb5 3:1:C5",
    11: "0:1:Db5 1:.5:Bb4 1.5:.5:Gb4 2:2:F5",
    12: ".5:.5:Eb5 1:1:F5 2:.5:Gb5 2.5:1.5:F5",
    # 4 early afternoon — kneading, rhythmic
    13: "0:.5:Ab4 .5:.5:C5 1:.5:Eb5 1.5:1:F5 3:.5:Eb5 3.5:.5:C5",
    14: "0:.5:Db5 .5:.5:F5 1:.5:Ab5 1.5:1:Bb5 3:.5:Ab5 3.5:.5:F5",
    15: "0:1:Ab5 1:.5:F5 1.5:.5:Eb5 2:1:Db5 3:1:F5",
    16: "0:1.5:Gb5 1.5:.5:F5 2:1:Eb5 3:.5:C5 3.5:.5:Eb5",
    # 5 afternoon rain — lower, minor
    17: ".5:.5:F4 1:.5:Ab4 1.5:1.5:C5 3:1:Db5",
    18: "0:2:Bb4 2:.5:Ab4 2.5:1.5:F4",
    19: ".5:.5:Gb4 1:.5:Bb4 1.5:1:Db5 2.5:.5:F5 3:1:Eb5",
    20: "0:2:Bb4 2:2:A4",
    # 6 golden hour — the theme, warm and full
    21: "0:1:Bb4 1:.5:Db5 1.5:1:F5 2.5:.5:Ab5 3:1:Bb5",
    22: "0:1.5:Ab5 1.5:.5:Eb5 2:1:D5 3:.5:F5 3.5:.5:Ab5",
    23: "0:1:Gb5 1:.5:F5 1.5:.5:Db5 2:1.5:C5 3.5:.5:Db5",
    24: "0:2.5:Eb5 2.5:.5:Db5 3:1:C5",
    # 7 dusk — falling, lamps on
    25: "1:1:Ab5 2:.5:F5 2.5:1.5:Db5",
    26: ".5:.5:Gb5 1:1:F5 2:2:Db5",
    27: "0:1.5:Bb4 1.5:.5:Db5 2:1:C5 3:1:Eb5",
    28: "0:1.5:F5 1.5:.5:Eb5 2:2:C5",
    # 8 night — the morning theme, hushed; the last beat leads into bar 1
    29: ".5:.5:Bb4 1:.5:Db5 1.5:2.5:F5",
    30: "1:1:Eb5 2:2:C5",
    31: ".5:.5:Gb4 1:.5:Bb4 1.5:2.5:Db5",
    32: ".5:.5:Bb4 1:2:Eb5 3:.5:Db5 3.5:.5:Eb5",
}

# piano comping: (beat, "all"|"top3", velocity scale)
COMP = {
    "morning": [(0, "all", 1.0)],
    "late":    [(0, "all", 1.0), (2.5, "top3", 0.7)],
    "midday":  [(0, "all", 1.0), (1.5, "all", 0.72), (3, "top3", 0.6)],
    "knead":   [(0, "all", 1.0), (1.5, "all", 0.7), (2.5, "top3", 0.6), (3.5, "all", 0.62)],
    "rain":    "arp",
    "golden":  [(0, "all", 1.0), (1.5, "all", 0.72), (3, "all", 0.62)],
    "dusk":    [(0, "all", 1.0), (2, "top3", 0.65)],
    "night":   [(0, "all", 1.0)],
}

# per scene: comp style, comp vel, melody vel, piano left-hand roots, bass,
# rhodes vel, drums {sweep, slap, rim, kick, ghost}
SCENES = [
    dict(name="morning",   comp="morning", cv=0.32, mv=0.45, lh=True,  bass=None,
         rh=0.0,  dr=dict()),
    dict(name="late morning", comp="late", cv=0.34, mv=0.51, lh=False, bass="long",
         rh=0.22, dr=dict()),
    dict(name="midday",    comp="midday", cv=0.36, mv=0.55, lh=False, bass="walk",
         rh=0.3,  dr=dict(sweep=0.6, slap=0.55, kick=0.55, ghost=0.15)),
    dict(name="early afternoon", comp="knead", cv=0.37, mv=0.56, lh=False, bass="walk",
         rh=0.3,  dr=dict(sweep=0.6, rim=0.5, kick=0.6, ghost=0.2)),
    dict(name="afternoon rain", comp="rain", cv=0.3, mv=0.49, lh=False, bass="walk",
         rh=0.36, dr=dict(sweep=0.5, slap=0.4, kick=0.35, ghost=0.1)),
    dict(name="golden hour", comp="golden", cv=0.4, mv=0.6, lh=False, bass="walk",
         rh=0.36, dr=dict(sweep=0.7, slap=0.6, kick=0.65, ghost=0.25)),
    dict(name="dusk",      comp="dusk", cv=0.34, mv=0.51, lh=False, bass="half",
         rh=0.26, dr=dict(sweep=0.4, slap=0.3)),
    dict(name="night",     comp="night", cv=0.3, mv=0.43, lh=True,  bass=None,
         rh=0.0,  dr=dict()),
]


def scene_of(bar):
    return SCENES[(bar - 1) // 4]


def swing(x):
    b = np.floor(x)
    f = x - b
    return b + (f / 0.5 * SWING if f < 0.5 else SWING + (f - 0.5) / 0.5 * (1 - SWING))


def at(bar, beat):
    """Seconds for a (1-based bar, 0-based beat) position, swung."""
    return (bar - 1) * BAR + swing(beat) * BEAT


def chord_at(bar, beat):
    name = [c for b, c in CHANGES[bar] if b <= beat][-1]
    root, voicing = CHORDS[name]
    return name, PC[root] % 12, [m(v) for v in voicing.split()]


def in_range(pc, lo, hi):
    x = lo + (pc - lo) % 12
    return x if x <= hi else x - 12


def pedal_changes():
    """Times the sustain pedal is re-taken: every chord change."""
    return sorted(at(b, beat) for b in range(1, BARS + 1) for beat, _ in CHANGES[b])


def next_after(times, t):
    for x in times:
        if x > t + 1e-6:
            return x
    return times[0] + BARS * BAR        # wraps to bar 1 of the next pass


# --- the player ---------------------------------------------------------------

def events(seed=64):
    """Return a list of (instrument, time_s, midi, velocity, dur_s, extra)."""
    rng = np.random.default_rng(seed)
    ev = []
    pedals = pedal_changes()

    def jit(sd=0.006, lim=0.015):
        return float(np.clip(rng.normal(0, sd), -lim, lim))

    # piano comping: collect attacks first so each note knows when it stops
    attacks = []                                   # (t, pitches, vels)
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        style = COMP[sc["comp"]]
        if style == "arp":
            for beat, _ in CHANGES[bar]:
                _, _, v = chord_at(bar, beat)
                order = [0, 1, 2, 3, 2, 1, 2, 3]
                steps = 8 if len(CHANGES[bar]) == 1 else 4
                for i in range(steps):
                    p = v[order[i]]
                    vel = sc["cv"] * (1.0 if i == 0 else 0.8) * (1 + rng.normal(0, 0.05))
                    attacks.append((at(bar, beat + 0.5 * i) + jit(), [p], [vel], "arp"))
            continue
        pat = list(style)
        for beat, _ in CHANGES[bar]:                # always strike on a chord change
            if not any(abs(b - beat) < 1e-6 for b, _, _ in pat):
                pat.append((beat, "all", 0.9))
        for beat, which, vs in sorted(pat):
            _, root, v = chord_at(bar, beat)
            notes = v if which == "all" else v[1:]
            t0 = at(bar, beat) + jit()
            roll = 0.045 if sc["comp"] in ("morning", "night") and beat == 0 else 0.012
            if sc["lh"] and beat == 0:
                r = in_range(root, 36, 47)
                notes = [r, r + 7] + notes
            vels = []
            for i, _ in enumerate(notes):
                top = 1.1 if i == len(notes) - 1 else 0.95
                vels.append(sc["cv"] * vs * top * (1 + rng.normal(0, 0.05)))
            for i, p in enumerate(notes):
                attacks.append((t0 + i * roll + abs(jit(0.004, 0.008)), [p], [vels[i]], "comp"))

    attacks.sort(key=lambda a: a[0])
    for i, (t, ps, vs, kind) in enumerate(attacks):
        p = ps[0]
        end = next_after(pedals, t + 0.05)          # next pedal lift (jitter may be early)
        for t2, ps2, _, _ in attacks[i + 1:]:        # or the same key struck again
            if t2 >= end:
                break
            if ps2[0] == p:
                end = t2
                break
        ev.append(("piano", t, p, vs[0], end - t + 0.04, None))

    # melody
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        for tok in MELODY[bar].split():
            beat, dur, note = tok.split(":")
            beat, dur = float(beat), float(dur)
            t0 = at(bar, beat) + 0.008 + jit()
            d = at(bar, beat + dur) - at(bar, beat) + 0.08
            vel = sc["mv"] * (1.08 if dur >= 1.5 else 1.0) * (0.92 if beat % 1 else 1.0)
            vel *= 1 + rng.normal(0, 0.04)
            ev.append(("piano", t0, m(note), float(vel), d, "melody"))

    # bass
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        mode = sc["bass"]
        if mode is None:
            continue
        ch = CHANGES[bar]
        last_of_scene = bar % 4 == 0
        notes = []                                   # (beat, dur, midi, vel)
        if mode == "long" or (mode == "half" and last_of_scene):
            for i, (beat, _) in enumerate(ch):
                _, root, _ = chord_at(bar, beat)
                span = (ch[i + 1][0] if i + 1 < len(ch) else 4) - beat
                notes.append((beat, span - 0.12, in_range(root, 34, 45), 0.5))
        else:
            v = 0.62 if mode == "walk" else 0.5
            _, r1, _ = chord_at(bar, 0)
            r1 = in_range(r1, 34, 45)
            approach = mode == "walk" and bar % 2 == 0 and bar < BARS
            if len(ch) == 2:
                _, r2, _ = chord_at(bar, 2)
                second = in_range(r2, 34, 45)
            else:
                second = r1 + 7 if r1 + 7 <= 50 else r1 - 5
            notes.append((0, 1.85, r1, v))
            notes.append((2, 1.4 if approach else 1.85, second, v * 0.85))
            if approach:
                _, nxt, _ = chord_at(bar + 1, 0)
                nxt = in_range(nxt, 34, 45)
                notes.append((3.5, 0.45, nxt - 1 if bar % 4 else nxt + 1, v * 0.7))
        for beat, dur, p, vel in notes:
            t0 = at(bar, beat) + 0.012 + jit()
            d = at(bar, beat + dur) - at(bar, beat)
            slide = -1.0 if rng.random() < 0.22 and beat > 0 else 0.0
            ev.append(("bass", t0, p, vel * (1 + rng.normal(0, 0.04)), d, slide))

    # electric piano pad: the voicing, held through each chord
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        if sc["rh"] <= 0:
            continue
        ch = CHANGES[bar]
        for i, (beat, _) in enumerate(ch):
            _, _, v = chord_at(bar, beat)
            t0 = at(bar, beat)
            end = at(bar, ch[i + 1][0]) if i + 1 < len(ch) else at(bar + 1, 0)
            for k, p in enumerate(v):
                ev.append(("rhodes", t0 + 0.02 + 0.01 * k + jit(0.004), p,
                           sc["rh"] * (1 + rng.normal(0, 0.05)), end - t0 + 0.05, None))

    # drums
    for bar in range(1, BARS + 1):
        dr = scene_of(bar)["dr"]
        if not dr:
            continue
        in_scene = (bar - 1) % 4
        fading = scene_of(bar)["name"] == "dusk" and in_scene >= 2
        if dr.get("kick") and not fading:
            hits = [(0, 1.0), (1.5, 0.55)] + ([(2.5, 0.4)] if in_scene % 2 else [])
            for beat, v in hits:
                ev.append(("kick", at(bar, beat) + jit(0.004), 0, dr["kick"] * v, 0, None))
        for beat in (1, 3):
            if fading:
                continue
            if dr.get("slap"):
                ev.append(("slap", at(bar, beat) + 0.02 + jit(0.005), 0,
                           dr["slap"] * (1 + rng.normal(0, 0.06)), 0, None))
            if dr.get("rim"):
                ev.append(("rim", at(bar, beat) + 0.015 + jit(0.004), 0,
                           dr["rim"] * (1 + rng.normal(0, 0.06)), 0, None))
        if dr.get("ghost") and not fading:
            for beat in (0.5, 1.5, 2.5, 3.5):
                if rng.random() < 0.55:
                    ev.append(("ghost", at(bar, beat) + 0.015 + jit(0.006), 0,
                               dr["ghost"] * rng.uniform(0.6, 1.0), 0, None))
    return ev


def sweep_levels():
    """Brush-sweep level per beat (128 beats), including the pickup into bar 9
    and the fade through dusk."""
    lv = np.zeros(BARS * 4)
    for bar in range(1, BARS + 1):
        s = scene_of(bar)["dr"].get("sweep", 0.0)
        lv[(bar - 1) * 4:(bar - 1) * 4 + 4] = s
    lv[7 * 4 + 2] = 0.25                      # bar 8, beats 3-4: brushes start circling
    lv[7 * 4 + 3] = 0.45
    for i, b in enumerate(range(26 * 4, 28 * 4)):   # bars 27-28: brushes fade away
        lv[b] = 0.4 * (1 - (i + 1) / 8)
    return lv


def bar_map():
    lines = []
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        dr = "+".join(k for k in ("sweep", "slap", "rim", "kick", "ghost") if sc["dr"].get(k))
        parts = ["piano"] + (["bass:" + sc["bass"]] if sc["bass"] else []) + \
                (["rhodes"] if sc["rh"] else []) + ([dr] if dr else []) + \
                (["rain"] if sc["name"] == "afternoon rain" else [])
        head = f"{sc['name']:<16}" if (bar - 1) % 4 == 0 else " " * 16
        lines.append(f"{bar:>2} {at(bar, 0):7.2f}s  {head} {PROG[bar]:<14} "
                     f"{MELODY[bar]:<56} {', '.join(parts)}")
    return "\n".join(lines)
