import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const files = {
  html: await readFile('index.html', 'utf8'),
  css: await readFile('styles.css', 'utf8'),
  js: await readFile('app.js', 'utf8'),
  sw: await readFile('sw.js', 'utf8'),
};
assert.match(files.html, /audioOutput/);
assert.match(files.css, /sr-audio/);
assert.match(files.js, /createMediaStreamDestination/);
assert.match(files.js, /audioOutput/);
assert.doesNotMatch(files.js, /stopWhenInactive/);
assert.doesNotMatch(files.js, /visibilitychange/);
assert.match(files.sw, /frequence-shell-v5/);
assert.match(files.sw, /preset-store\.js/);
assert.match(files.html, /type=\"module\" src=\"app\.js/);
console.log('PASS: background media audio path, lock-safe behavior and refreshed PWA cache');
