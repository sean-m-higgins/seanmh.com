# purr — music

A 120 s seamless loop of felt piano with light chill-jazz backing. It is computed
from code only: no samples, no SoundFonts, and all material is original.

```
python3 -I src/films/purr/music/render.py         # ~40 s -> renders/purr/music.wav, music.m4a, music-loop-check.wav
python3 -I src/films/purr/music/render.py --map   # print the bar map
```

- `synth.py`: the instruments (felt piano, Rhodes-like pad, upright bass, soft kit) and zero-phase FFT filters.
- `score.py`: the composition as data (chords, voicings, melody, per-scene arrangement) and the player that turns it into timed events.
- `render.py`: places events, wraps the loop, then adds reverb, tape, dust and loudness. It writes the files and prints the measurements as JSON.

Output is deterministic (seed 64). Two renders give byte-identical WAVs.

## Form

D♭ major, 64 BPM, 4/4, swung eighths (the off-beat falls at 0.6 of the beat). One bar is 3.75 s and there are 32 bars.
The 8 scenes are 4 bars each.

| bars | scene | chords (one bar each; `a b` means a change on beat 3) | band |
|---|---|---|---|
| 1–4 | morning | Gbmaj9 · Fm7 · Ebm9 · Dbmaj9 | solo piano, rolled chords + left-hand root/fifth, sparse melody |
| 5–8 | late morning | Gbmaj9 · Fm7 Bb7b9 · Ebm9 · Ab13sus Ab13 | theme; bass enters (whole notes); soft pad; brushes start circling in bar 8 |
| 9–12 | midday | Dbmaj9 · Bbm9 · Ebm9 · Ab13 | walking roots/fifths, brush sweep + slap on 2 & 4, soft kick, ghost taps |
| 13–16 | early afternoon | Dbmaj9 · Gbmaj9 · Fm7 Bbm9 · Ebm9 Ab13 | "kneading" comp in eighths; cross-stick instead of slap |
| 17–20 | afternoon rain | Bbm9 · Gbmaj9 · Ebm9 · Fsus7 F7b9 | piano arpeggios, lower minor melody, quiet rain bed fades in/out across the scene |
| 21–24 | golden hour | Gbmaj9 · Fm7 Bb7b9 · Ebm9 Ab13 · Dbmaj9 | fullest: theme restated higher, all instruments |
| 25–28 | dusk | Bbm9 · Ebm9 · Gbmaj9 Ab13 · Dbmaj9 | bass in half notes; kick out; brushes fade to nothing over bars 27–28 |
| 29–32 | night | Gbmaj9 · Fm7 · Ebm9 · Ab13sus | solo piano again: the morning theme, hushed |

The loop is a cadence. Bar 32's Ab13sus (V) turns to bar 1's Gbmaj9 (IV), and the
melody's last beat (D♭–E♭) leads into bar 1's held F. Night and morning are both
solo piano at nearly the same level (piano −23.0 vs −22.4 LUFS, K-weighted per scene),
so the energy is continuous through the seam.
Voicings are rootless and sit in the middle register (E♭3–A♭4). The melody sits above them (F4–B♭5).
Timing is humanised by about ±6 ms (clipped to ±15 ms) and velocity by about ±5%. The bass and snare play
10–20 ms behind the beat.

## Instruments

- **Felt piano**: up to 30 inharmonic partials (`f_n = n·f0·√(1+B n²)`), with B rising with pitch.
  The first 8 partials use 2–3 strings detuned by 0.35–1.2 cents. Decay is two-stage (prompt and aftersound), and higher partials die sooner.
  Velocity sets the felt brightness (a soft low-pass on the partials). Each note has a felt thump and a wooden knock at the attack, a damper release,
  and a stereo position set by pitch. Sustain follows the pedal, which is re-taken at every chord change.
- **Pad**: 1:1 FM electric piano holding each voicing. It is low-passed at 2.6 kHz and auto-panned once per bar.
- **Upright bass**: a sine plus 4 fast-fading harmonics, a pluck, occasional slides of a semitone up into the note, and
  chromatic approach notes into every other bar.
- **Kit**: a continuous brush sweep (band-passed noise with one circle per beat), a brush slap or cross-stick on beats 2 and 4,
  a muffled sine-sweep kick, and ghost taps.
- **Space and dust**: a stereo band-split noise reverb (RT 2.1 s in the lows, 0.6 s in the highs, 24 ms pre-delay).
  Tape wow and flutter (periods of 2 s and 15 s, plus 6 Hz flutter), a slightly asymmetric tanh saturation,
  a master low-pass at 8.5 kHz, hiss at −64 dBFS and about 2 vinyl crackles per second.

## How the loop wraps

N = 5,760,000 samples. Every note is written at `onset mod N` into a buffer
N + 16 s long. Everything that rings past sample N (piano decays, bass, the bar-1 chord
roll that starts 3 ms early) is then added back onto the start. Everything after
that is **circular over exactly N samples**:

- the reverb is a circular FFT convolution, so its tail wraps into bar 1;
- all filters are zero-phase FFT masks;
- the brush and rain levels are smoothed circularly;
- wow and flutter are a circular modulated delay whose periods divide 120 s;
- hiss and crackle are circular noise.

The result equals the steady state of the piece played forever. Sample N−1 runs into sample 0
like any other pair of samples.

## Measurements (last render)

| | |
|---|---|
| frames / duration (ffprobe) | 5,760,000 / 120.000000 s, 48 kHz, 24-bit stereo (`music.m4a`: AAC-LC 160 kb/s, also 5,760,000 frames decoded) |
| loudness (ffmpeg ebur128) | **−18.0 LUFS** integrated, LRA 6.0 LU (m4a: −18.0, LRA 5.9) |
| true peak | **−5.0 dBTP** (4× oversampled internally: −5.03); sample peak −5.03 dBFS, no clipping, no NaN |
| DC | ~1e-19 (removed) |
| spectrum | energy above 8 kHz −44.8 dB and above 10 kHz −49.6 dB relative to total; centroid 507 Hz |
| render time | ~36–38 s (notes 21 s, mix 9 s) |

Seam (WAV):

| | |
|---|---|
| jump at wrap (N−1 → 0) | 0.0034 |
| median / 99th percentile / max sample jump within ±1 s | 0.0037 / 0.0255 / 0.061 |
| >4 kHz energy in the 5 ms windows at the seam vs median | −2.6 dB (no click) |
| RMS last 0.5 s → first 0.5 s | −24.5 → −20.0 dBFS (+4.5 dB) |
| the same step at the other 31 bar lines | min +0.2, median +9.4, max +18.0 dB |

The seam's step in level is smaller than the typical bar line's, because bar 1's downbeat is
quieter than most downbeats. `renders/purr/music-loop-check.wav` holds the last
10 s followed by the first 10 s.

AAC note: in the decoded `music.m4a` the wrap jump is 0.017, inside the normal range
(p99 0.025). The first AAC frame cannot be rebuilt exactly, because the encoder
primes it with silence. Mux the video's audio from `music.wav` and treat the WAV
as the master.
