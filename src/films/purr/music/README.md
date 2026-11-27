# purr — music

A 300 s seamless loop: a felt piano with a small band around it (upright bass,
brushes, an electric-piano pad, a string section, a celesta). It is computed
from code only: no samples, no SoundFonts, and all material is original.

```
python3 -I src/films/purr/music/render.py         # ~4 min -> renders/purr/music.wav, music.m4a, music-loop-check.wav
python3 -I src/films/purr/music/render.py --map   # print the bar map
```

- `synth.py`: the instruments and zero-phase FFT filters.
- `score.py`: the composition as data (chords, voicings, melody, the arrangement of each phrase) and the player that turns it into timed events. `check()` lists any melody note that rests on a note its chord does not hold; the render refuses to run if there is one.
- `render.py`: places events, wraps the loop, then adds the rooms, tape, dust and loudness. It writes the files and prints the measurements as JSON.

Output is deterministic (seed 64).

## Form

D♭ major, 64 BPM, 4/4. One bar is 3.75 s and there are 80 bars: twenty 4-bar
phrases, one for each 15 s of the film (the rain and the night take two).
Eighths are swung where the band plays (the off-beat at 0.56–0.64 of the beat)
and straight where the piano is alone.

| bars | scene | chords (one bar each; `a b` means a change on beat 3) | who plays |
|---|---|---|---|
| 1–4 | dawn | Gbmaj9 · Fm7 · Ebm9 · Dbmaj9 | piano alone: a low note answered by a soft chord; the theme's first notes, far apart; two celesta notes |
| 5–8 | sill | Gbmaj9 · Fm7 Bb7b9 · Ebm9 · Ab13sus Ab13 | piano alone: **the theme** |
| 9–12 | breakfast | Dbmaj9 · Bbm9 · Ebm9 · Ab13 | bass enters (long notes), pad; brushes start circling in bar 12 |
| 13–16 | sunpatch | Dbmaj9 · Gbmaj9 · Fm7 Bbm9 · Ebm9 Ab13 | one rolled chord a bar, bass in half notes, brush sweep only |
| 17–20 | balcony | Dbmaj9 · Abm9 Db13 · Gbmaj9 · Fm7 Bb7b9 | the band: two-feel bass with approach notes, brush slap on 2 & 4, soft kick |
| 21–24 | garden | Ebm9 · Ab13 · Dbmaj9 Bbm9 · Ebm9 Ab13 | the same; the line turns on itself, like the bee |
| 25–28 | quilt | Dbmaj9 · Gbmaj9 · Fm7 Bbm9 · Ebm9 Ab13 | "kneading" comp in eighths; cross-stick instead of slap |
| 29–32 | piano | Gbmaj9 · Gbm6 · Dbmaj9 Bbm9 · Ebm9 Ab13sus | a nocturne: wide broken left hand in eighths, an ornamented line; the metronome on screen ticks once a beat |
| 33–36 | fish | Bbm9 · Gbmaj9♯11 · Ebm9 · Fsus7 | the voicing stirred in sixteenths, a few melody notes, celesta bubbles |
| 37–40 | rain | Bbm9 · Gbmaj9 · Ebm9 · Fsus7 F7b9 | arpeggios, the minor melody, soft brushes; the rain bed fades in |
| 41–44 | rain, heavier | Bbm9 · Ebm9 · Cm7b5 F7b9 · Bbm9 Ab13sus | the same thought an octave up; strings enter; the rain thins in bar 44 |
| 45–48 | box | Gbmaj9 · Fm7 Bb7b9 · Ebm9 Ab13 · Dbmaj9 | fullest: the theme in octaves, everyone |
| 49–52 | sunset | Gbmaj9 · Dbmaj9 · Bbm9 · Ab13sus Ab13 | **the second theme**, broad, over the nocturne left hand and the strings |
| 53–56 | dusk | Bbm9 · Ebm9 · Gbmaj9 Ab13 · Dbmaj9 | its answer, falling; brushes fade to nothing over bars 55–56 |
| 57–60 | record | Ebm9 Ab13 · Dbmaj9 Bb7b9 · Ebm9 Ab13 · Abm9 Db13 | a trio chorus: walking bass in quarters, chords on 2 and 4; more crackle, because this is the record |
| 61–64 | stove | Gbmaj9 · Gbm6 · Fm7 Bbm9 · Ebm9 Ab13sus | the theme, slow and low, with a minor fourth; the fire crackles |
| 65–68 | desk | Dbmaj9 · Bbm9 · Ebm9 · Ab13 | almost nothing: a high staccato note on each of the cat's three taps, a falling run as the pencil goes, one low note when it lands |
| 69–72 | house | Gbmaj9 · Dbmaj9 · Gbmaj9 · Ab13sus | a lullaby in rocking steps, the celesta doubling it an octave up, strings high and soft |
| 73–76 | night | Gbmaj9 · Fm7 · Ebm9 · Dbmaj9 | piano alone again: the morning theme, hushed |
| 77–80 | lamp out | Gbmaj9 · Gbm6 · Dbmaj9 · Ab13sus | one chord a bar, three stars on the celesta |

The loop is a cadence. Bar 80's Ab13sus (V) turns to bar 1's Gbmaj9 (IV), and
the melody's last beat (D♭–E♭) leads into bar 1's F. Night and dawn are both
solo piano, so the energy is continuous through the seam.

Voicings are rootless and sit in the middle register (E♭3–A♭4). The melody sits above them (F4–D♭6).
Timing is humanised by about ±6 ms (clipped to ±15 ms) and velocity by about ±5%. Each 4-bar phrase
swells a little through its middle, and its last note arrives 22 ms late. The bass and snare play
10–20 ms behind the beat.

### What is borrowed from pianists

Ways of playing, not notes:

- **Satie** (dawn, sill, house, night): a low note on the beat answered by a soft chord, and nothing else.
- **Chopin** (piano, sunset): a wide broken left hand (root, fifth, tenth, over the top and back) under a singing right hand with grace notes crushed in before the beat.
- **Debussy** (fish): harmony that does not move, stirred in sixteenths, with a raised fourth for the water.
- **Bill Evans** (the band phrases, record): rootless voicings with the colour notes on top, and a trio that walks.

### In time with the picture

- The metronome on the piano swings to one side on every beat of bars 29–32, and ticks there.
- The grey tabby kneads the quilt once a beat (bars 25–28).
- The black cat's three taps on the pencil land on bar 66 beat 3 and bar 67 beats 2 and 4; the pencil lands on bar 68.
- The lamp goes out on the downbeat of bar 77.

## Instruments

- **Felt piano**: up to 30 inharmonic partials (`f_n = n·f0·√(1+B n²)`), with B rising with pitch.
  The first 8 partials use 2–3 strings detuned by 0.35–1.2 cents. Decay is two-stage (prompt and aftersound), and higher partials die sooner.
  Velocity sets the felt brightness. Each note has a felt thump and a wooden knock at the attack, a damper release,
  and a stereo position set by pitch. Sustain follows the pedal, which is re-taken at every chord change.
  The whole piano then passes through its **body**: a short soundboard knock, and the open strings of D♭ major humming in sympathy.
- **Pad**: 1:1 FM electric piano holding each voicing, low-passed at 2.6 kHz and auto-panned once per bar.
- **Strings**: three players per note a few cents apart, each with its own vibrato and place in the stereo field, bowed slowly (0.5–0.85 s attack).
- **Celesta**: five partials with bell-like ratios and a felt hammer; used for dew, bubbles, the pencil taps, the lullaby and the stars.
- **Upright bass**: a sine plus 4 fast-fading harmonics, a pluck, occasional slides of a semitone up into the note.
- **Kit**: a continuous brush sweep (one circle per beat), a brush slap or cross-stick on beats 2 and 4, a muffled kick, ghost taps, and the metronome's tick.
- **Space and dust**: a close room (RT 2.1 s in the lows, 0.6 s in the highs) on everything, and a longer hall (RT 4.2 s)
  whose send follows the film: more when the piano is alone. Tape wow and flutter, a slightly asymmetric tanh saturation,
  a master low-pass at 8.5 kHz, hiss at −64 dBFS and about 2 vinyl crackles per second (about 9 during the record scene).
  A rain bed under bars 37–44 and a fire's crackle under bars 61–64.

## How the loop wraps

N = 14,400,000 samples. Every note is written at `onset mod N` into a buffer
N + 16 s long. Everything that rings past sample N is then added back onto the
start. Everything after that is **circular over exactly N samples**: both
reverbs and the piano body are circular FFT convolutions, all filters are
zero-phase FFT masks, the brush, rain and hall levels are smoothed circularly,
wow and flutter are a circular modulated delay whose periods divide 300 s, and
hiss and crackle are circular noise.

The result equals the steady state of the piece played forever. Sample N−1 runs into sample 0
like any other pair of samples.

## Measurements (last render)

| | |
|---|---|
| frames / duration (ffprobe) | 14,400,000 / 300.000000 s, 48 kHz, 24-bit stereo (`music.m4a`: AAC-LC 128 kb/s) |
| loudness (ffmpeg ebur128) | **−18.0 LUFS** integrated, LRA 7.2 LU (m4a: −18.1, LRA 7.2) |
| true peak | **−5.3 dBTP**; no clipping, no NaN |
| DC | ~1e-20 (removed) |
| spectrum | energy above 8 kHz −47.9 dB and above 10 kHz −51.1 dB relative to total; centroid 469 Hz |
| events | 1,064 piano notes, 292 pad, 156 strings, 126 bass, 36 celesta, 190 kit hits |
| render time | ~90–120 s (notes 60 s, mix 30 s) |

Loudness by phrase (K-weighted, LUFS), the mix and what carries it:

| | dawn | sill | brkf | sun | balc | gard | quilt | piano | fish | rain | rain | box | sunset | dusk | record | stove | desk | house | night | lamp |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mix | −23 | −19 | −18 | −18 | −17 | −16 | −16 | −19 | −20 | −18 | −17 | −14 | −17 | −18 | −17 | −18 | −21 | −21 | −22 | −23 |
| piano | −24 | −20 | −19 | −20 | −18 | −17 | −17 | −20 | −22 | −20 | −20 | −16 | −20 | −20 | −18 | −19 | −22 | −25 | −23 | −24 |
| strings | | | | | | | | | | | −27 | −26 | −27 | −30 | | | | −30 | | |

Seam (WAV):

| | |
|---|---|
| jump at wrap (N−1 → 0) | 0.0019 |
| median / 99th percentile / max sample jump within ±1 s | 0.0023 / 0.0116 / 0.041 |
| >4 kHz energy in the 5 ms windows at the seam vs median | 0.0 dB (no click) |
| RMS last 0.5 s → first 0.5 s | −24.6 → −25.1 dBFS (−0.5 dB) |
| the same step at the other 79 bar lines | min −1.4, median +4.1, max +16.0 dB |

`renders/purr/music-loop-check.wav` holds the last 10 s followed by the first 10 s.

AAC note: the first AAC frame cannot be rebuilt exactly, because the encoder
primes it with silence. Mux the video's audio from `music.wav` and treat the WAV
as the master.

**Not auditioned.** This music was written and checked by measurement and by
rule (loudness, peaks, spectrum, the seam, the melody against its chords), by a
model that cannot hear it. A listen by a person is the missing check.
