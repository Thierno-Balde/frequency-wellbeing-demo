import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  html: await readFile('index.html', 'utf8'),
  css: await readFile('styles.css', 'utf8'),
  js: await readFile('app.js', 'utf8'),
  manifest: await readFile('manifest.webmanifest', 'utf8'),
  sw: await readFile('sw.js', 'utf8'),
};

assert.match(files.html, /id="frequencyInput"/);
assert.match(files.html, /id="playButton"/);
assert.match(files.html, /manifest\.webmanifest/);
assert.match(files.js, /new AudioContext\(\)/);
assert.match(files.js, /createOscillator\(\)/);
assert.match(files.js, /createGain\(\)/);
assert.match(files.js, /oscillator\.addEventListener\('ended'/);
assert.match(files.sw, /cache\.addAll\(ASSETS\)/);
assert.match(files.manifest, /"display": "standalone"/);
assert.doesNotMatch(`${files.html}${files.css}${files.js}`, /https?:\/\//);
assert.doesNotMatch(`${files.html}${files.css}${files.js}`, /\.(mp3|wav|ogg|m4a)(["'])/i);

console.log('PASS: PWA shell, local Web Audio, offline cache and no external audio assets');
