# Version E — Counter

The 2D game version of seanmh.com: read the opponent's punch, slip or duck,
then counter inside the opening. Clean counters build the multiplier and the
opponent's heat; passive play drains the pressure meter until the final bell.

## Controls

- `Left` / `A`: slip left
- `Down` / `S`: duck
- `Right` / `D`: slip right
- `Space` / `J`: counter
- `R`: restart
- `M`: toggle sound

Touch devices use the four persistent ringside controls.

## Difficulty

The first 30 seconds of every bout are eased: telegraphs run slow, the slip
window covers almost the whole telegraph, and the opponent's heat builds at a
fraction of its normal rate. That easing decays on an eased curve to full
difficulty. It is driven purely by elapsed bout time, so every player gets the
same ramp and global scores stay directly comparable — there is no difficulty
setting to pick.

Balance lives entirely in `src/scripts/game/tuning.ts`.

## Development

Use Node 22.12 or newer, then run:

```bash
npm install
npm test
npm run check
npm run build
```

The global top-ten client calls `/api/score/boxing` on seanmh.com. It hides
itself when the router Worker or KV storage is unavailable, so direct Pages
previews remain fully playable with local personal and daily bests.
