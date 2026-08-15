import assert from 'node:assert/strict';
import test from 'node:test';

import { load, loadMuted, saveMuted, saveRun, setInitials } from '../src/scripts/game/storage.ts';

function installStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  globalThis.localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    clear() { values.clear(); },
    key(index) { return [...values.keys()][index] ?? null; },
    get length() { return values.size; },
  };
  return values;
}

test('run storage tracks personal best, daily best, recent runs, and initials', () => {
  const values = installStorage();
  assert.equal(load().best, 0);
  saveRun(1200);
  saveRun(800);
  setInitials('SMH');
  const saved = load();
  assert.equal(saved.best, 1200);
  assert.equal(saved.dailyBest, 1200);
  assert.deepEqual(saved.runs, [800, 1200]);
  assert.equal(saved.initials, 'SMH');
  assert.ok(values.has('seanmh:e-2d-game:counter:v1'));
});

test('an old daily score resets without losing the all-time best', () => {
  installStorage({
    'seanmh:e-2d-game:counter:v1': JSON.stringify({
      best: 9000,
      dailyBest: 8000,
      dailyDate: '2000-01-01',
      runs: [9000],
      initials: 'OLD',
    }),
  });
  const saved = load();
  assert.equal(saved.best, 9000);
  assert.equal(saved.dailyBest, 0);
  assert.notEqual(saved.dailyDate, '2000-01-01');
});

test('mute preference persists and storage errors degrade safely', () => {
  installStorage();
  saveMuted(true);
  assert.equal(loadMuted(), true);
  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(load().best, 0);
  assert.equal(loadMuted(), false);
  assert.doesNotThrow(() => saveMuted(true));
  assert.doesNotThrow(() => saveRun(100));
});
