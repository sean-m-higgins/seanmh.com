import assert from 'node:assert/strict';
import test from 'node:test';

import { defenseIsOpen, newBout, stepCombat } from '../src/scripts/game/combat.ts';
import { mulberry32 } from '../src/scripts/game/rng.ts';
import { T } from '../src/scripts/game/tuning.ts';

const DT = 1 / 120;
const fixedRandom = () => 0;

function advanceUntil(state, predicate, limitSeconds = 5) {
  const events = [];
  for (let elapsed = 0; elapsed < limitSeconds && !predicate(); elapsed += DT) {
    events.push(...stepCombat(state, DT, [], fixedRandom));
  }
  return events;
}

test('correct defense opens a counter and awards a clean score', () => {
  const state = newBout(fixedRandom);
  assert.equal(state.attack.kind, 'left-straight');
  assert.equal(state.attack.defense, 'right');
  advanceUntil(state, () => defenseIsOpen(state));

  const dodge = stepCombat(state, DT, ['right'], fixedRandom);
  assert.equal(dodge[0].type, 'dodge');
  assert.equal(state.phase, 'counter');

  const counter = stepCombat(state, DT, ['counter'], fixedRandom);
  assert.equal(counter[0].type, 'counter');
  assert.equal(counter[0].quality, 'clean');
  assert.equal(state.score, 100);
  assert.equal(state.chain, 1);
  assert.equal(state.counters, 1);
});

test('waiting into the perfect band earns the perfect timing bonus', () => {
  const state = newBout(fixedRandom);
  advanceUntil(state, () => defenseIsOpen(state));
  stepCombat(state, DT, ['right'], fixedRandom);
  advanceUntil(state, () => state.phaseTime <= 0.13);

  const events = stepCombat(state, DT, ['counter'], fixedRandom);
  assert.equal(events[0].type, 'counter');
  assert.equal(events[0].quality, 'perfect');
  assert.equal(events[0].points, 150);
  assert.equal(state.perfects, 1);
});

test('early and incorrect defense both result in a hit and reset the chain', () => {
  const early = newBout(fixedRandom);
  early.chain = 5;
  const earlyEvents = stepCombat(early, DT, ['right'], fixedRandom);
  assert.equal(earlyEvents[0].type, 'hit');
  assert.equal(earlyEvents[0].reason, 'early');
  assert.equal(early.chain, 0);

  const wrong = newBout(fixedRandom);
  advanceUntil(wrong, () => defenseIsOpen(wrong));
  const wrongEvents = stepCombat(wrong, DT, ['left'], fixedRandom);
  assert.equal(wrongEvents[0].type, 'hit');
  assert.equal(wrongEvents[0].reason, 'wrong');
  assert.equal(wrong.hits, 1);
});

test('a counter outside its opening is a pressure-costing whiff', () => {
  const state = newBout(fixedRandom);
  state.chain = 3;
  const before = state.pressure;
  const events = stepCombat(state, DT, ['counter'], fixedRandom);
  assert.equal(events[0].type, 'miss');
  assert.equal(events[0].reason, 'whiff');
  assert.equal(state.chain, 0);
  assert.ok(state.pressure < before - 6.9);
});

test('passive play drains pressure and ends the bout', () => {
  const state = newBout(fixedRandom);
  const events = advanceUntil(state, () => state.phase === 'over', 30);
  assert.equal(state.phase, 'over');
  assert.ok(events.some((event) => event.type === 'over'));
});

test('attack selection does not immediately repeat the same punch', () => {
  const state = newBout(fixedRandom);
  const first = state.attack.kind;
  advanceUntil(state, () => defenseIsOpen(state));
  stepCombat(state, DT, ['right'], fixedRandom);
  stepCombat(state, DT, ['counter'], fixedRandom);
  advanceUntil(state, () => state.phase === 'telegraph');
  assert.notEqual(state.attack.kind, first);
});

test('success raises heat, speeds telegraphs, and can schedule multi-punch flurries', () => {
  const values = [0, 0, 0, 0, 0, 0];
  const random = () => values.shift() ?? 0;
  const state = newBout(random);
  state.heat = 0.8;
  advanceUntil(state, () => defenseIsOpen(state));
  stepCombat(state, DT, ['right'], random);
  stepCombat(state, DT, ['counter'], random);
  const events = [];
  for (let elapsed = 0; elapsed < 1 && state.phase !== 'telegraph'; elapsed += DT) {
    events.push(...stepCombat(state, DT, [], random));
  }
  assert.equal(state.phase, 'telegraph');
  assert.ok(state.phaseDuration < 0.5);
  assert.equal(state.flurryLeft, 1);
  assert.ok(events.some((event) => event.type === 'attack' && event.flurry));
});

test('a hit lowers heat and creates a longer recovery beat', () => {
  const state = newBout(fixedRandom);
  state.heat = 0.8;
  advanceUntil(state, () => defenseIsOpen(state));
  stepCombat(state, DT, ['left'], fixedRandom);
  assert.ok(state.heat < 0.6);
  assert.equal(state.phase, 'recover');
  assert.ok(state.phaseTime > 0.6);
});

test('the chain multiplier caps at four times base score', () => {
  const state = newBout(fixedRandom);
  state.chain = 20;
  advanceUntil(state, () => defenseIsOpen(state));
  stepCombat(state, DT, ['right'], fixedRandom);
  const events = stepCombat(state, DT, ['counter'], fixedRandom);
  assert.equal(events[0].type, 'counter');
  assert.equal(events[0].points, 400);
});

test('the pressure clock ends the bout even for a flawless counter-puncher', () => {
  const rand = mulberry32(9);
  const state = newBout(rand);
  let counterAt = null;

  // Never miss a read, and always counter inside the perfect band — the best
  // pressure income the scoring contract allows.
  for (let step = 0; step < 120 * 300 && state.phase !== 'over'; step++) {
    const actions = [];
    if (state.phase === 'telegraph') {
      counterAt = null;
      if (defenseIsOpen(state)) actions.push(state.attack.defense);
    } else if (state.phase === 'counter') {
      if (counterAt === null) counterAt = (T.PERFECT_MIN + T.PERFECT_MAX) / 2;
      if (state.phaseTime <= counterAt) {
        actions.push('counter');
        counterAt = null;
      }
    }
    stepCombat(state, DT, actions, rand);
  }

  assert.equal(state.phase, 'over', 'a perfect run must still run out of pressure');
  assert.equal(state.hits, 0);
  // The Worker rejects submitted runs longer than 300s as implausible, so the
  // clock has to expire comfortably inside that ceiling.
  assert.ok(state.time < 300, `bout ran ${state.time.toFixed(1)}s, past the 300s leaderboard ceiling`);
});
