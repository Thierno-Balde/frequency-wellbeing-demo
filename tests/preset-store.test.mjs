import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_PRESETS,
  CUSTOM_PRESETS_STORAGE_KEY,
  validateFrequency,
  normalizeCustomPreset,
  loadCustomPresets,
  addCustomPreset,
} from '../preset-store.js';

function memoryStorage(initial = null) {
  const values = new Map(initial === null ? [] : [[CUSTOM_PRESETS_STORAGE_KEY, initial]]);
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

test('built-in presets contain the seven requested chakra labels and preserve the other defaults', () => {
  const pairs = BUILT_IN_PRESETS.map(({ name, frequencyHz }) => [name, frequencyHz]);
  for (const expected of [
    ['Racine', 396], ['Sacré', 417], ['Plexus solaire', 528],
    ['Cœur', 639], ['Gorge', 741], ['Troisième œil', 852], ['Couronne', 963],
    ['256 Hz', 256], ['432 Hz', 432], ['768 Hz', 768],
  ]) assert.ok(pairs.some(([name, hz]) => name === expected[0] && hz === expected[1]), `${expected}`);
  assert.equal(new Set(BUILT_IN_PRESETS.map(({ frequencyHz }) => frequencyHz)).size, BUILT_IN_PRESETS.length);
});

test('frequency validation accepts integer Hz at both supported boundaries', () => {
  assert.equal(validateFrequency('20'), 20);
  assert.equal(validateFrequency(20000), 20000);
});

test('frequency validation rejects fractions, non-numbers and values outside 20–20000 Hz', () => {
  for (const value of ['', 'abc', 19, 20001, 20.5, NaN, Infinity]) assert.equal(validateFrequency(value), null);
});

test('custom preset normalization trims its label and converts Hz to a number', () => {
  assert.deepEqual(normalizeCustomPreset('  Nuit calme  ', '432'), { name: 'Nuit calme', frequencyHz: 432 });
});

test('custom preset normalization rejects an empty label and invalid frequency', () => {
  assert.equal(normalizeCustomPreset('   ', 432), null);
  assert.equal(normalizeCustomPreset('Test', 20001), null);
});

test('custom presets persist and reload from browser storage', () => {
  const storage = memoryStorage();
  const result = addCustomPreset(storage, 'Mon repère', '777');
  assert.deepEqual(result, { ok: true, preset: { name: 'Mon repère', frequencyHz: 777 } });
  assert.deepEqual(loadCustomPresets(storage), [{ name: 'Mon repère', frequencyHz: 777 }]);
});

test('corrupt persisted JSON falls back safely without throwing', () => {
  const storage = memoryStorage('{not-json');
  assert.deepEqual(loadCustomPresets(storage), []);
});

test('unavailable storage reports a failed save instead of false success', () => {
  const storage = {
    getItem() { throw new Error('storage disabled'); },
    setItem() { throw new Error('storage disabled'); },
  };
  assert.deepEqual(addCustomPreset(storage, 'Mon repère', 777), { ok: false, reason: 'storage' });
});
