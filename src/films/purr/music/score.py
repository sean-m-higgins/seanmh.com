"""purr music — the composition, as data, and the player that turns it into events.

D-flat major, 64 BPM, 4/4, 80 bars = 300 s. Twenty 4-bar phrases, one for each
15 s of the film (the rain and the night take two each), dawn to night. Bar 80
(Ab13sus) turns back to bar 1 (Gbmaj9), so the loop is a cadence.

All melodies and progressions here are original. The piano writing borrows
ways of playing, not notes: a bass note answered by a soft chord (Satie), wide
broken left-hand arpeggios under a singing, ornamented line (Chopin), still
harmony stirred in sixteenths (Debussy), rootless voicings and a walking trio
(Bill Evans).
"""
import numpy as np

BPM = 64
BEAT = 60 / BPM            # 0.9375 s
BAR = 4 * BEAT             # 3.75 s
BAR_N = 180000             # samples per bar at 48 kHz
BARS = 80

PC = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7,
      "Ab": 8, "A": 9, "Bb": 10, "B": 11, "Cb": -1}


def m(name):
    """'Db5' -> 73. Cb4 is B3."""
    return 12 * (int(name[-1]) + 1) + PC[name[:-1]]


# root, rootless mid-register voicing (low -> high), and the chord's own
# third / fifth / seventh / colour above the root, for the left-hand patterns
CHORDS = {
    "Gbmaj9":    ("Gb", "Bb3 Db4 F4 Ab4", (4, 7, 11, 14)),    # 3 5 7 9
    "Gbmaj9#11": ("Gb", "Bb3 C4 F4 Ab4",  (4, 7, 11, 14)),    # 3 #11 7 9
    "Gbm6":      ("Gb", "A3 Db4 Eb4 Ab4", (3, 7, 9, 14)),     # b3 5 6 9
    "Fm7":       ("F",  "Ab3 Bb3 C4 Eb4", (3, 7, 10, 17)),    # b3 11 5 b7
    "Ebm9":      ("Eb", "Gb3 Bb3 Db4 F4", (3, 7, 10, 14)),    # b3 5 b7 9
    "Dbmaj9":    ("Db", "F3 Ab3 C4 Eb4",  (4, 7, 11, 14)),    # 3 5 7 9
    "Db13":      ("Db", "F3 Bb3 Cb4 Eb4", (4, 7, 10, 14)),    # 3 13 b7 9
    "Ab13sus":   ("Ab", "Gb3 Bb3 Db4 Eb4", (5, 7, 10, 14)),   # b7 9 11 5
    "Ab13":      ("Ab", "Gb3 Bb3 C4 F4",  (4, 7, 10, 14)),    # b7 9 3 13
    "Abm9":      ("Ab", "Gb3 Bb3 Cb4 Eb4", (3, 7, 10, 14)),   # b7 9 b3 5
    "Bb7b9":     ("Bb", "Ab3 Cb4 D4 F4",  (4, 7, 10, 13)),    # b7 b9 3 5
    "Bbm9":      ("Bb", "F3 Ab3 C4 Db4",  (3, 7, 10, 14)),    # 5 b7 9 b3
    "Cm7b5":     ("C",  "Gb3 Bb3 C4 Eb4", (3, 6, 10, 12)),    # b5 b7 1 b3
    "Fsus7":     ("F",  "Eb3 Bb3 C4 F4",  (5, 7, 10, 12)),    # b7 4 5 1
    "F7b9":      ("F",  "Eb3 A3 C4 Gb4",  (4, 7, 10, 13)),    # b7 3 5 b9
}

# Notes a melody may rest on over each chord (pitch classes). Anything else is
# a passing note; check() flags one that is long or lands on a strong beat.
REST_ON = {
    "Gbmaj9": "Gb Bb Db F Ab Eb C", "Gbmaj9#11": "Gb Bb Db F Ab Eb C", "Gbm6": "Gb A Db Eb Ab",
    "Fm7": "F Ab C Eb Bb", "Ebm9": "Eb Gb Bb Db F C Ab", "Dbmaj9": "Db F Ab C Eb Bb",
    "Db13": "Db F Ab Cb Eb Bb", "Ab13sus": "Ab Db Eb Gb Bb F", "Ab13": "Ab C Eb Gb Bb F",
    "Abm9": "Ab Cb Eb Gb Bb", "Bb7b9": "Bb D F Ab Cb", "Bbm9": "Bb Db F Ab C Eb",
    "Cm7b5": "C Eb Gb Bb F Ab", "Fsus7": "F Bb C Eb Ab", "F7b9": "F A C Eb Gb",
}

# bar -> chords (one bar each; "a b" means a change on beat 3), bars 1-based
PROG = {
    # 1 dawn                                        2 sill
    1: "Gbmaj9", 2: "Fm7", 3: "Ebm9", 4: "Dbmaj9",
    5: "Gbmaj9", 6: "Fm7 Bb7b9", 7: "Ebm9", 8: "Ab13sus Ab13",
    # 3 breakfast                                   4 sunpatch
    9: "Dbmaj9", 10: "Bbm9", 11: "Ebm9", 12: "Ab13",
    13: "Dbmaj9", 14: "Gbmaj9", 15: "Fm7 Bbm9", 16: "Ebm9 Ab13",
    # 5 balcony                                     6 garden
    17: "Dbmaj9", 18: "Abm9 Db13", 19: "Gbmaj9", 20: "Fm7 Bb7b9",
    21: "Ebm9", 22: "Ab13", 23: "Dbmaj9 Bbm9", 24: "Ebm9 Ab13",
    # 7 quilt                                       8 piano
    25: "Dbmaj9", 26: "Gbmaj9", 27: "Fm7 Bbm9", 28: "Ebm9 Ab13",
    29: "Gbmaj9", 30: "Gbm6", 31: "Dbmaj9 Bbm9", 32: "Ebm9 Ab13sus",
    # 9 fish                                        10 rain
    33: "Bbm9", 34: "Gbmaj9#11", 35: "Ebm9", 36: "Fsus7",
    37: "Bbm9", 38: "Gbmaj9", 39: "Ebm9", 40: "Fsus7 F7b9",
    # 11 rain, heavier                              12 box
    41: "Bbm9", 42: "Ebm9", 43: "Cm7b5 F7b9", 44: "Bbm9 Ab13sus",
    45: "Gbmaj9", 46: "Fm7 Bb7b9", 47: "Ebm9 Ab13", 48: "Dbmaj9",
    # 13 sunset                                     14 dusk
    49: "Gbmaj9", 50: "Dbmaj9", 51: "Bbm9", 52: "Ab13sus Ab13",
    53: "Bbm9", 54: "Ebm9", 55: "Gbmaj9 Ab13", 56: "Dbmaj9",
    # 15 record                                     16 stove
    57: "Ebm9 Ab13", 58: "Dbmaj9 Bb7b9", 59: "Ebm9 Ab13", 60: "Abm9 Db13",
    61: "Gbmaj9", 62: "Gbm6", 63: "Fm7 Bbm9", 64: "Ebm9 Ab13sus",
    # 17 desk                                       18 house
    65: "Dbmaj9", 66: "Bbm9", 67: "Ebm9", 68: "Ab13",
    69: "Gbmaj9", 70: "Dbmaj9", 71: "Gbmaj9", 72: "Ab13sus",
    # 19 night                                      20 night, lamp out
    73: "Gbmaj9", 74: "Fm7", 75: "Ebm9", 76: "Dbmaj9",
    77: "Gbmaj9", 78: "Gbm6", 79: "Dbmaj9", 80: "Ab13sus",
}
CHANGES = {b: [(2.0 * i, c) for i, c in enumerate(s.split())] for b, s in PROG.items()}

# melody: bar -> "beat:dur:note ...". A dur of "g" is a grace note before that beat.
MELODY = {
    # 1 dawn: the theme's first notes, far apart
    1: "1:2:F5 3:1:Ab5",
    2: "0:3:Eb5",
    3: "1:1:Db5 2:2:F5",
    4: "0:2.5:Eb5 3:1:C5",
    # 2 sill: the theme
    5: ".5:.5:Bb4 1:.5:Db5 1.5:1:F5 2.5:.5:Ab5 3:1:F5",
    6: "0:1.5:Eb5 1.5:.5:C5 2:1:D5 3:1:Cb5",
    7: "0:1.5:Bb4 1.5:.5:Gb4 2:.5:Ab4 2.5:1.5:Bb4",
    8: ".5:1.5:Db5 2:2:C5",
    # 3 breakfast: light, a little busy
    9: "0:.5:Ab4 .5:.5:C5 1:1:Eb5 2:.5:F5 2.5:.5:Eb5 3:1:C5",
    10: "0:g:C5 0:1:Db5 1:.5:C5 1.5:.5:Ab4 2:1.5:F4 3.5:.5:Ab4",
    11: "0:.5:Bb4 .5:.5:Db5 1:1:F5 2:.5:Gb5 2.5:.5:F5 3:1:Db5",
    12: "0:1.5:C5 1.5:.5:Bb4 2:2:Eb5",
    # 4 sunpatch: long notes, drowsing
    13: "0:2:F5 2:1:Eb5 3:1:C5",
    14: "0:3:Db5 3:1:Bb4",
    15: "0:2:Ab4 2:1:C5 3:1:Db5",
    16: "0:2:Bb4 2:2:C5",
    # 5 balcony: brighter, higher
    17: ".5:.5:Eb5 1:.5:F5 1.5:1.5:Ab5 3:.5:F5 3.5:.5:Eb5",
    18: "0:1.5:Gb5 1.5:.5:Eb5 2:1:F5 3:1:Cb5",
    19: "0:1:Bb4 1:.5:Db5 1.5:.5:F5 2:2:Ab5",
    20: "0:1.5:Ab5 1.5:.5:F5 2:1:D5 3:1:F5",
    # 6 garden: turning, like the bee
    21: "0:.5:Gb5 .5:.5:F5 1:.5:Gb5 1.5:.5:Bb5 2:1:Ab5 3:.5:F5 3.5:.5:Db5",
    22: "0:1:Eb5 1:.5:C5 1.5:.5:Eb5 2:.5:F5 2.5:1.5:Gb5",
    23: "0:.5:F5 .5:.5:Eb5 1:1:Ab5 2:.5:Ab5 2.5:.5:F5 3:1:Db5",
    24: "0:1:Bb4 1:.5:Db5 1.5:.5:F5 2:1:Eb5 3:.5:C5 3.5:.5:Bb4",
    # 7 quilt: kneading, rhythmic
    25: "0:.5:Ab4 .5:.5:C5 1:.5:Eb5 1.5:1:F5 3:.5:Eb5 3.5:.5:C5",
    26: "0:.5:Db5 .5:.5:F5 1:.5:Ab5 1.5:1:Bb5 3:.5:Ab5 3.5:.5:F5",
    27: "0:1:Ab5 1:.5:F5 1.5:.5:Eb5 2:1:Db5 3:1:F5",
    28: "0:1.5:Gb5 1.5:.5:F5 2:1:Eb5 3:.5:C5 3.5:.5:Eb5",
    # 8 piano: a nocturne, the line sung and ornamented
    29: "0:g:C5 0:2:Db5 2:.5:F5 2.5:.5:Ab5 3:1:Bb5",
    30: "0:2.5:A5 2.5:.5:Gb5 3:1:Eb5",
    31: "0:g:Gb5 0:1.5:F5 1.5:.5:Eb5 2:1:Db5 3:.5:C5 3.5:.5:Db5",
    32: "0:2:Bb4 2:g:F5 2:2:Eb5",
    # 9 fish: a few notes, floating
    33: "1:2:F5 3:1:Db5",
    34: "0:3:C5 3:1:Bb4",
    35: "1:1:Gb4 2:2:Bb4",
    36: "0:2:C5 2:2:Bb4",
    # 10 rain: lower, minor
    37: ".5:.5:F4 1:.5:Ab4 1.5:1.5:C5 3:1:Db5",
    38: "0:2:Bb4 2:.5:Ab4 2.5:1.5:F4",
    39: ".5:.5:Gb4 1:.5:Bb4 1.5:1:Db5 2.5:.5:F5 3:1:Eb5",
    40: "0:2:Bb4 2:2:A4",
    # 11 rain, heavier: the same thought an octave up, pressing
    41: "0:1:F5 1:.5:Ab5 1.5:1.5:C6 3:1:Bb5",
    42: "0:2:Gb5 2:.5:F5 2.5:.5:Db5 3:1:Bb4",
    43: "0:1:Eb5 1:1:Gb5 2:1:A5 3:1:Gb5",
    44: "0:2:F5 2:2:Eb5",
    # 12 box: the theme, warm and full
    45: "0:1:Bb4 1:.5:Db5 1.5:1:F5 2.5:.5:Ab5 3:1:Bb5",
    46: "0:1.5:Ab5 1.5:.5:Eb5 2:1:D5 3:.5:F5 3.5:.5:Ab5",
    47: "0:1:Gb5 1:.5:F5 1.5:.5:Db5 2:1.5:C5 3.5:.5:Db5",
    48: "0:2.5:Eb5 2.5:.5:Db5 3:1:C5",
    # 13 sunset: the second theme, broad
    49: "0:1.5:Db6 1.5:.5:Bb5 2:2:Ab5",
    50: "0:1.5:F5 1.5:.5:Ab5 2:2:C6",
    51: "0:1.5:Db6 1.5:.5:C6 2:1:Ab5 3:1:F5",
    52: "0:2:Eb5 2:1:C5 3:1:Eb5",
    # 14 dusk: its answer, falling, lamps on
    53: "1:1:Ab5 2:.5:F5 2.5:1.5:Db5",
    54: ".5:.5:Gb5 1:1:F5 2:2:Db5",
    55: "0:1.5:Bb4 1.5:.5:Db5 2:1:C5 3:1:Eb5",
    56: "0:1.5:F5 1.5:.5:Eb5 2:2:C5",
    # 15 record: a chorus with the trio
    57: "0:.5:Bb4 .5:.5:Db5 1:.5:F5 1.5:.5:Gb5 2:1:Eb5 3:.5:C5 3.5:.5:Bb4",
    58: "0:1:Ab4 1:.5:C5 1.5:.5:Eb5 2:.5:D5 2.5:.5:F5 3:1:Ab5",
    59: "0:.5:Gb5 .5:.5:F5 1:.5:Db5 1.5:.5:Bb4 2:.5:C5 2.5:.5:Eb5 3:1:Gb5",
    60: "0:1:Eb5 1:.5:Cb5 1.5:.5:Bb4 2:1:F5 3:.5:Eb5 3.5:.5:Cb5",
    # 16 stove: the theme, slow and low, with a minor fourth for the fire
    61: ".5:.5:Bb4 1:.5:Db5 1.5:2.5:F5",
    62: "0:2:Eb5 2:2:Db5",
    63: "0:1.5:C5 1.5:.5:Ab4 2:1:F4 3:1:Ab4",
    64: "0:2:Bb4 2:2:Db5",
    # 17 desk: she taps the pencil on beat 3 of bar 66 and beats 2 and 4 of
    # bar 67; it falls through the run and lands on bar 68
    65: "0:1.5:Ab4 2:1:C5 3:1:Eb5",
    66: "0:1.5:F5 2:.5:Db6",
    67: "1:.5:Bb5 3:.25:F6 3.25:.25:Db6 3.5:.25:Bb5 3.75:.25:Gb5",
    68: "0:.5:Eb4 1.5:.5:C5 2:2:Eb5",
    # 18 house: a lullaby, rocking
    69: "0:1:Db5 1:1:F5 2:1:Ab5 3:1:F5",
    70: "0:1:C5 1:1:Eb5 2:2:Ab5",
    71: "0:1:Db5 1:1:F5 2:1:Bb5 3:1:Ab5",
    72: "0:2:Gb5 2:2:Eb5",
    # 19 night: the morning theme, hushed
    73: "0:3:F5 3.5:.5:Eb5",
    74: "0:1.5:C5 1.5:.5:Bb4 2:2:Ab4",
    75: "1:1:Bb4 2:.5:Db5 2.5:1.5:F5",
    76: "0:2:Eb5 2:2:C5",
    # 20 lamp out: almost nothing; the last beat leads into bar 1
    77: "1:3:Db5",
    78: "0:2:Eb5 2:2:A4",
    79: "0:3:Ab4",
    80: ".5:.5:Bb4 1:2:Eb5 3:.5:Db5 3.5:.5:Eb5",
}

# right-hand comping: (beat, "all"|"top3", velocity scale)
COMP = {
    "one":     [(0, "all", 1.0)],
    "late":    [(0, "all", 1.0), (2.5, "top3", 0.7)],
    "midday":  [(0, "all", 1.0), (1.5, "all", 0.72), (3, "top3", 0.6)],
    "knead":   [(0, "all", 1.0), (1.5, "all", 0.7), (2.5, "top3", 0.6), (3.5, "all", 0.62)],
    "arp":     "arp",
    "golden":  [(0, "all", 1.0), (1.5, "all", 0.72), (3, "all", 0.62)],
    "dusk":    [(0, "all", 1.0), (2, "top3", 0.65)],
    "stride":  [(1, "all", 0.85), (2.5, "top3", 0.55), (3, "all", 0.75)],
    "stab":    [(0, "all", 0.9)],
}

# per 4-bar phrase: comp (right hand), lh (left-hand pattern), cv / mv (comp and
# melody velocity), bass, rh (electric-piano pad), st (strings), cel (celesta),
# dr (kit), swing (where the off-beat eighth lands), hall (send to the long reverb)
def _s(name, comp=None, lh=None, cv=0.32, mv=0.5, bass=None, rh=0.0, st=0.0, cel=None,
       dr=None, swing=0.6, hall=0.25, oct=False):
    return dict(name=name, comp=comp, lh=lh, cv=cv, mv=mv, bass=bass, rh=rh, st=st, cel=cel,
                dr=dr or {}, swing=swing, hall=hall, oct=oct)


SCENES = [
    _s("dawn", lh="satie", cv=0.27, mv=0.42, cel="dew", swing=0.5, hall=0.6),
    _s("sill", lh="satie", cv=0.3, mv=0.48, swing=0.5, hall=0.45),
    _s("breakfast", comp="late", cv=0.33, mv=0.5, bass="long", rh=0.2, swing=0.58),
    _s("sunpatch", comp="one", cv=0.33, mv=0.5, bass="half", rh=0.26, dr=dict(sweep=0.35), swing=0.58, hall=0.3),
    _s("balcony", comp="midday", cv=0.36, mv=0.55, bass="walk", rh=0.3,
       dr=dict(sweep=0.6, slap=0.5, kick=0.5, ghost=0.15)),
    _s("garden", comp="midday", cv=0.36, mv=0.56, bass="walk", rh=0.3,
       dr=dict(sweep=0.6, slap=0.5, kick=0.55, ghost=0.2)),
    _s("quilt", comp="knead", cv=0.37, mv=0.56, bass="walk", rh=0.3,
       dr=dict(sweep=0.6, rim=0.5, kick=0.6, ghost=0.2)),
    _s("piano", lh="nocturne", cv=0.3, mv=0.54, bass="long", dr=dict(tick=0.5), swing=0.5, hall=0.4),
    _s("fish", lh="debussy", cv=0.2, mv=0.47, bass="long", rh=0.28, cel="bubbles", swing=0.5, hall=0.5),
    _s("rain", comp="arp", cv=0.3, mv=0.49, bass="half", rh=0.34, dr=dict(sweep=0.45, slap=0.3), hall=0.35),
    _s("rain2", comp="arp", cv=0.32, mv=0.54, bass="walk", rh=0.36, st=0.26,
       dr=dict(sweep=0.5, slap=0.4, kick=0.35, ghost=0.1), hall=0.35),
    _s("box", comp="golden", cv=0.4, mv=0.6, bass="walk", rh=0.36, st=0.3,
       dr=dict(sweep=0.7, slap=0.6, kick=0.65, ghost=0.25), oct=True),
    _s("sunset", lh="nocturne", cv=0.3, mv=0.57, bass="half", rh=0.2, st=0.27, dr=dict(sweep=0.4), swing=0.56, hall=0.5),
    _s("dusk", comp="dusk", cv=0.34, mv=0.51, bass="half", rh=0.26, st=0.2, dr=dict(sweep=0.35, slap=0.25), hall=0.35),
    _s("record", comp="stride", cv=0.36, mv=0.56, bass="four", rh=0.18,
       dr=dict(sweep=0.65, slap=0.55, kick=0.45, ghost=0.3), swing=0.64),
    _s("stove", comp="one", lh="roots", cv=0.33, mv=0.47, bass="long", rh=0.28, swing=0.56, hall=0.35),
    _s("desk", comp="stab", cv=0.3, mv=0.5, bass="pluck", cel="taps", swing=0.5, hall=0.3),
    _s("house", lh="satie", cv=0.24, mv=0.42, bass="long", st=0.2, cel="double", swing=0.5, hall=0.6),
    _s("night", lh="satie", cv=0.27, mv=0.42, swing=0.5, hall=0.55),
    _s("lampout", comp="one", lh="roots", cv=0.24, mv=0.38, cel="stars", swing=0.5, hall=0.65),
]
PHRASES = len(SCENES)
assert PHRASES * 4 == BARS


def scene_of(bar):
    return SCENES[((bar - 1) % BARS) // 4]


def swing(x, sw):
    b = np.floor(x)
    f = x - b
    return b + (f / 0.5 * sw if f < 0.5 else sw + (f - 0.5) / 0.5 * (1 - sw))


def at(bar, beat):
    """Seconds for a (1-based bar, 0-based beat) position, swung as its phrase swings."""
    while beat >= 4:
        bar, beat = bar + 1, beat - 4
    return (bar - 1) * BAR + swing(beat, scene_of(bar)["swing"]) * BEAT


def chord_name(bar, beat):
    return [c for b, c in CHANGES[(bar - 1) % BARS + 1] if b <= beat][-1]


def chord_at(bar, beat):
    name = chord_name(bar, beat)
    root, voicing, _ = CHORDS[name]
    return name, PC[root] % 12, [m(v) for v in voicing.split()]


def tones(bar, beat):
    return CHORDS[chord_name(bar, beat)][2]


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


def spans(bar):
    """[(beat, length_in_beats)] for each chord in the bar."""
    ch = CHANGES[bar]
    return [(b, (ch[i + 1][0] if i + 1 < len(ch) else 4) - b) for i, (b, _) in enumerate(ch)]


def check():
    """Melody notes that sit on a strong beat or last a beat or more, but are
    not notes the chord lets a line rest on. Returns a list of strings."""
    out = []
    for bar in range(1, BARS + 1):
        for tok in MELODY[bar].split():
            beat, dur, note = tok.split(":")
            if dur == "g":
                continue
            beat, dur = float(beat), float(dur)
            name = chord_name(bar, beat)
            ok = {PC[x] % 12 for x in REST_ON[name].split()}
            if m(note) % 12 not in ok and (dur >= 1 or beat in (0, 2)):
                out.append(f"bar {bar} beat {beat}: {note} over {name}")
            # a held note must also suit a chord that changes under it
            for b2, c2 in CHANGES[bar]:
                if beat < b2 < beat + dur - 0.26:
                    ok2 = {PC[x] % 12 for x in REST_ON[c2].split()}
                    if m(note) % 12 not in ok2:
                        out.append(f"bar {bar} beat {beat}: {note} held into {c2}")
    return out


# --- the player ---------------------------------------------------------------

def events(seed=64):
    """Return a list of (instrument, time_s, midi, velocity, dur_s, extra)."""
    rng = np.random.default_rng(seed)
    ev = []
    pedals = pedal_changes()

    def jit(sd=0.006, lim=0.015):
        return float(np.clip(rng.normal(0, sd), -lim, lim))

    def swell(bar, beat):
        """A phrase breathes: a little louder through its middle."""
        u = (((bar - 1) % 4) + beat / 4) / 4
        return 1 + 0.07 * np.sin(np.pi * u)

    # --- piano: right-hand comping and the left-hand patterns.
    # Collect attacks first so each note knows when it stops.
    attacks = []                                   # (t, pitch, vel, kind)
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        cv = sc["cv"]

        style = COMP[sc["comp"]] if sc["comp"] else None
        if style == "arp":
            for beat, _ in CHANGES[bar]:
                _, _, v = chord_at(bar, beat)
                order = [0, 1, 2, 3, 2, 1, 2, 3]
                steps = 8 if len(CHANGES[bar]) == 1 else 4
                for i in range(steps):
                    vel = cv * (1.0 if i == 0 else 0.8) * (1 + rng.normal(0, 0.05))
                    attacks.append((at(bar, beat + 0.5 * i) + jit(), v[order[i]], vel, "arp"))
        elif style:
            pat = list(style)
            if sc["comp"] not in ("stride",):
                for beat, _ in CHANGES[bar]:        # always strike on a chord change
                    if not any(abs(b - beat) < 1e-6 for b, _, _ in pat):
                        pat.append((beat, "all", 0.9))
            for beat, which, vs in sorted(pat):
                _, _, v = chord_at(bar, beat)
                notes = v if which == "all" else v[1:]
                t0 = at(bar, beat) + jit()
                roll = 0.045 if sc["comp"] == "one" and beat == 0 else 0.012
                for i, p in enumerate(notes):
                    top = 1.1 if i == len(notes) - 1 else 0.95
                    vel = cv * vs * top * swell(bar, beat) * (1 + rng.normal(0, 0.05))
                    kind = "stab" if sc["comp"] in ("stab", "stride") else "comp"
                    attacks.append((t0 + i * roll + abs(jit(0.004, 0.008)), p, vel, kind))

        lh = sc["lh"]
        for beat, length in spans(bar):
            _, root, v = chord_at(bar, beat)
            third, fifth, seventh, _ = tones(bar, beat)
            if lh == "roots":
                r = in_range(root, 30, 41)
                for i, p in enumerate((r, r + 7)):
                    attacks.append((at(bar, beat) + 0.02 * i + jit(), p, cv * 0.95 * (1 + rng.normal(0, 0.05)), "lh"))
            elif lh == "satie":
                # a low note, then the chord, softly: a slow sway
                r = in_range(root, 32, 43)
                hi = sc["name"] == "house"
                steps = [(0, [r + (12 if hi else 0)], 1.0), (1, v[1:], 0.62)]
                if length > 2:
                    steps += [(2, [r + 7 + (12 if hi else 0)], 0.8), (3, v[1:], 0.55)]
                for db, ps, vs in steps:
                    t0 = at(bar, beat + db) + jit()
                    for i, p in enumerate(ps):
                        attacks.append((t0 + 0.018 * i, p, cv * vs * swell(bar, beat + db) * (1 + rng.normal(0, 0.05)), "lh"))
            elif lh == "nocturne":
                # a wide broken chord in eighths: root, fifth, tenth, and over the top
                r = in_range(root, 34, 45)
                wave = [0, 7, 12 + third, 19, 12 + seventh, 19, 12 + third, 7]
                n = int(length * 2)
                for i in range(n):
                    vs = 0.95 if i == 0 else 0.56 + 0.12 * np.sin(np.pi * i / n)
                    attacks.append((at(bar, beat + 0.5 * i) + jit(), r + wave[i], cv * vs * swell(bar, beat) * (1 + rng.normal(0, 0.05)), "lh"))
            elif lh == "debussy":
                # the voicing stirred in sixteenths, up through the octave and back
                fig = [v[0], v[1], v[2], v[3], v[0] + 12, v[1] + 12, v[0] + 12, v[3],
                       v[2], v[1], v[0], v[1], v[2], v[3], v[2], v[1]]
                n = int(length * 4)
                for i in range(n):
                    vs = (1.0 if i % 4 == 0 else 0.78) * (0.85 + 0.15 * np.sin(np.pi * i / n))
                    attacks.append((at(bar, beat + 0.25 * i) + jit(0.004, 0.01), fig[i], cv * vs * (1 + rng.normal(0, 0.05)), "lh"))
                r = in_range(root, 34, 45)
                attacks.append((at(bar, beat) + jit(), r, cv * 1.5, "lh"))

    attacks.sort(key=lambda a: a[0])
    for i, (t, p, vel, kind) in enumerate(attacks):
        if kind == "stab":
            ev.append(("piano", t, p, vel, 0.32, None))
            continue
        end = next_after(pedals, t + 0.05)          # next pedal lift (jitter may be early)
        for t2, p2, _, _ in attacks[i + 1:]:         # or the same key struck again
            if t2 >= end:
                break
            if p2 == p:
                end = t2
                break
        ev.append(("piano", t, p, vel, end - t + 0.04, None))

    # --- melody (and what doubles it)
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        toks = MELODY[bar].split()
        for k, tok in enumerate(toks):
            beat, dur, note = tok.split(":")
            beat = float(beat)
            if dur == "g":                           # a grace note, crushed in just before the beat
                ev.append(("piano", at(bar, beat) - 0.075 + jit(0.003, 0.006), m(note), sc["mv"] * 0.62, 0.11, "melody"))
                continue
            dur = float(dur)
            # the last note of a phrase arrives a breath late
            late = 0.022 if (bar % 4 == 0 and k == len(toks) - 1) else 0.0
            t0 = at(bar, beat) + 0.008 + late + jit()
            d = at(bar, beat + dur) - at(bar, beat) + 0.08
            vel = sc["mv"] * (1.08 if dur >= 1.5 else 1.0) * (0.92 if beat % 1 else 1.0) * swell(bar, beat)
            vel *= 1 + rng.normal(0, 0.04)
            if sc["name"] == "desk" and dur <= 0.5 and m(note) >= 82:
                d = 0.16                             # the taps and the falling run are staccato
            ev.append(("piano", t0, m(note), float(vel), d, "melody"))
            if sc["oct"]:
                ev.append(("piano", t0 + 0.006, m(note) - 12, float(vel) * 0.62, d, "melody"))
            if sc["cel"] == "double" and dur >= 1:
                ev.append(("celesta", t0 + 0.012, m(note) + 12, 0.34 * (1 + rng.normal(0, 0.05)), d, None))
            if sc["cel"] == "taps" and m(note) >= 82:
                ev.append(("celesta", t0, m(note), 0.5, d, None))

    # --- celesta on its own: dew at dawn, bubbles in the tank, stars at night
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        _, _, v = chord_at(bar, 0)
        if sc["cel"] == "dew" and bar % 2 == 0:
            ev.append(("celesta", at(bar, 2.5) + jit(), v[3] + 24, 0.26, 1.5, None))
        elif sc["cel"] == "bubbles":
            for beat in (0.75, 1.75, 2.5, 3.25):
                if rng.random() < 0.7:
                    _, _, vv = chord_at(bar, beat)
                    ev.append(("celesta", at(bar, beat) + jit(0.01, 0.02), vv[int(rng.integers(1, 4))] + 24,
                               0.2 + 0.1 * rng.random(), 1.2, None))
        elif sc["cel"] == "stars":
            for beat, k in ((2, 3), (3.5, 2)) if bar % 2 else ((1.5, 1),):
                ev.append(("celesta", at(bar, beat) + jit(), v[k] + 24, 0.24, 2.0, None))

    # --- bass
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        mode = sc["bass"]
        if mode is None:
            continue
        ch = CHANGES[bar]
        last_of_scene = bar % 4 == 0
        nxt_bar = bar % BARS + 1
        _, nxt, _ = chord_at(nxt_bar, 0)
        nxt = in_range(nxt, 34, 45)
        notes = []                                   # (beat, dur, midi, vel)
        if mode == "long" or (mode == "half" and last_of_scene):
            soft = 0.4 if sc["name"] in ("house", "piano") else 0.5
            for beat, length in spans(bar):
                _, root, _ = chord_at(bar, beat)
                notes.append((beat, length - 0.12, in_range(root, 34, 45), soft))
        elif mode == "pluck":
            _, root, _ = chord_at(bar, 0)
            notes.append((0, 0.5, in_range(root, 34, 45), 0.5))
        elif mode == "four":
            # walking quarters: root, a chord tone, the next root (or a chord tone), an approach
            for beat, length in spans(bar):
                _, root, _ = chord_at(bar, beat)
                third, fifth, seventh, _ = tones(bar, beat)
                r = in_range(root, 34, 45)
                if length == 4:
                    line = [r, r + third, r + fifth, nxt + (1 if rng.random() < 0.5 else -1)]
                else:
                    last = beat + 2 >= 4
                    target = nxt if last else in_range(chord_at(bar, beat + 2)[1], 34, 45)
                    line = [r, target + (1 if target < r else -1)]
                for i, p in enumerate(line):
                    notes.append((beat + i, 0.92, p, 0.6 * (1.0 if i == 0 else 0.86)))
        else:
            v = 0.62 if mode == "walk" else 0.5
            _, r1, _ = chord_at(bar, 0)
            r1 = in_range(r1, 34, 45)
            approach = mode == "walk" and bar % 2 == 0
            if len(ch) == 2:
                _, r2, _ = chord_at(bar, 2)
                second = in_range(r2, 34, 45)
            else:
                second = r1 + 7 if r1 + 7 <= 50 else r1 - 5
            notes.append((0, 1.85, r1, v))
            notes.append((2, 1.4 if approach else 1.85, second, v * 0.85))
            if approach:
                notes.append((3.5, 0.45, nxt - 1 if bar % 4 else nxt + 1, v * 0.7))
        for beat, dur, p, vel in notes:
            t0 = at(bar, beat) + 0.012 + jit()
            d = at(bar, beat + dur) - at(bar, beat)
            slide = -1.0 if rng.random() < 0.22 and beat > 0 and mode != "four" else 0.0
            ev.append(("bass", t0, p, vel * (1 + rng.normal(0, 0.04)), d, slide))
    # the pencil lands: one low, soft note under bar 68
    ev.append(("bass", at(68, 0) + 0.01, m("Ab1"), 0.6, 1.6, 0.0))
    ev.append(("kick", at(68, 0) + 0.005, 0, 0.4, 0, None))

    # --- pads: the voicing, held through each chord
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        for beat, length in spans(bar):
            _, root, v = chord_at(bar, beat)
            t0 = at(bar, beat)
            end = at(bar, beat + length)
            if sc["rh"] > 0:
                for k, p in enumerate(v):
                    ev.append(("rhodes", t0 + 0.02 + 0.01 * k + jit(0.004), p,
                               sc["rh"] * (1 + rng.normal(0, 0.05)), end - t0 + 0.05, None))
            if sc["st"] > 0:
                # strings: the root below, the voicing, and its top note again an octave up
                lift = 12 if sc["name"] == "house" else 0
                for p in [in_range(root, 46, 57)] + [x + lift for x in v] + [v[3] + 12]:
                    ev.append(("strings", t0 - 0.06 + jit(0.01, 0.02), p,
                               sc["st"] * (1 + rng.normal(0, 0.05)), end - t0 + 0.3, None))

    # --- drums
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        dr = sc["dr"]
        if not dr:
            continue
        in_scene = (bar - 1) % 4
        fading = sc["name"] == "dusk" and in_scene >= 2
        if dr.get("tick"):                           # the metronome on the piano, one tick a beat
            for beat in range(4):
                ev.append(("tick", at(bar, beat), 0, dr["tick"] * (1.0 if beat == 0 else 0.7), 0, None))
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
    """Brush-sweep level per beat (320 beats), with the brushes easing in
    before the band and fading through dusk."""
    lv = np.zeros(BARS * 4)
    for bar in range(1, BARS + 1):
        s = scene_of(bar)["dr"].get("sweep", 0.0)
        lv[(bar - 1) * 4:(bar - 1) * 4 + 4] = s
    lv[11 * 4 + 2] = 0.2                      # bar 12, beats 3-4: brushes start circling
    lv[11 * 4 + 3] = 0.3
    for i, b in enumerate(range(54 * 4, 56 * 4)):   # bars 55-56: brushes fade away
        lv[b] = 0.35 * (1 - (i + 1) / 8)
    return lv


def hall_levels():
    """Send level to the long reverb, per bar."""
    return np.array([scene_of(bar)["hall"] for bar in range(1, BARS + 1)])


def bar_map():
    lines = []
    for bar in range(1, BARS + 1):
        sc = scene_of(bar)
        dr = "+".join(k for k in ("sweep", "slap", "rim", "kick", "ghost", "tick") if sc["dr"].get(k))
        parts = ["piano" + (":" + sc["lh"] if sc["lh"] else "") + ("/" + sc["comp"] if sc["comp"] else "")] + \
                (["bass:" + sc["bass"]] if sc["bass"] else []) + (["rhodes"] if sc["rh"] else []) + \
                (["strings"] if sc["st"] else []) + (["celesta:" + sc["cel"]] if sc["cel"] else []) + ([dr] if dr else [])
        head = f"{sc['name']:<10}" if (bar - 1) % 4 == 0 else " " * 10
        lines.append(f"{bar:>2} {at(bar, 0):7.2f}s  {head} {PROG[bar]:<16} {', '.join(parts)}")
    return "\n".join(lines)
