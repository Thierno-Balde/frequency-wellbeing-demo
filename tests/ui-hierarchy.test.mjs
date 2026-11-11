import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
test('mobile hierarchy puts active frequency and volume before the seven presets', () => {
  const positions = ['id="frequencyDisplay"', 'id="volumeInput"', 'id="presetList"', 'id="customPresetSection"', 'id="playButton"'].map((token) => html.indexOf(token));
  assert.ok(positions.every((position) => position >= 0), `missing hierarchy anchor: ${positions}`);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.match(html, /<details[^>]*id="customPresetSection"/);
  assert.match(html, /class="listen-dock"/);
  assert.match(css, /\.listen-dock\s*\{[^}]*position:\s*fixed/s);
  assert.match(html, /id="selectedPresetName"/);
});
test('visualizer is compact and the main action has a touch-sized target', () => {
  assert.match(css, /\.orb\s*\{[^}]*width:\s*(?:2\d|3\d)px/s);
  assert.match(css, /\.play-button\s*\{[^}]*min-height:\s*(?:5[0-9]|6\d)px/s);
});

test('preset containers use a group label without overriding native button semantics', () => {
  assert.match(html, /id="presetList" class="presets" role="group"/);
  assert.doesNotMatch(html, /role="listitem"/);
});
