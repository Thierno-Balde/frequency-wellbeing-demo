import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.children = [];
    this.textContent = '';
    this.style = {};
    this.classes = new Set();
    this.classList = {
      add: (name) => this.classes.add(name),
      remove: (name) => this.classes.delete(name),
      contains: (name) => this.classes.has(name),
      toggle: (name, force) => {
        const enabled = force === undefined ? !this.classes.has(name) : Boolean(force);
        if (enabled) this.classes.add(name); else this.classes.delete(name);
        return enabled;
      },
    };
    this.nextElementSibling = { textContent: '' };
  }
  set className(value) { this.classes = new Set(String(value).split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classes].join(' '); }
  addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
  dispatch(type) { for (const callback of this.listeners[type] ?? []) callback({ target: this }); }
  click() { this.dispatch('click'); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren(...children) { this.children = children; }
  querySelector(selector) {
    if (selector === 'span:last-child') return this.children.find((child) => child.id === 'playLabel') ?? new FakeElement('playLabel');
    if (selector === '.play-icon') return this.children.find((child) => child.className === 'play-icon') ?? new FakeElement('playIcon');
    return null;
  }
  focus() {}
}

class FakeParam {
  constructor() { this.calls = []; }
  setValueAtTime(...args) { this.calls.push(['setValueAtTime', ...args]); }
  linearRampToValueAtTime(...args) { this.calls.push(['linearRampToValueAtTime', ...args]); }
  setTargetAtTime(...args) { this.calls.push(['setTargetAtTime', ...args]); }
  cancelScheduledValues(...args) { this.calls.push(['cancelScheduledValues', ...args]); }
}

const storageValues = new Map();
const storage = {
  getItem(key) { return storageValues.has(key) ? storageValues.get(key) : null; },
  setItem(key, value) { storageValues.set(key, String(value)); },
};
const elements = new Map();
const allElements = [];
function element(id) {
  if (!elements.has(id)) { const item = new FakeElement(id); elements.set(id, item); allElements.push(item); }
  return elements.get(id);
}
const documentStub = {
  documentElement: Object.assign(new FakeElement('html'), { dataset: {} }),
  querySelector(selector) {
    if (selector === 'meta[name="theme-color"]') return element('themeMeta');
    if (selector.startsWith('#')) return element(selector.slice(1));
    return null;
  },
  querySelectorAll(selector) {
    return selector === '.preset' ? [...(elements.get('presetList')?.children ?? []), ...(elements.get('customPresetList')?.children ?? [])].filter((item) => item.classList.contains('preset')) : [];
  },
  createElement(tag) { const item = new FakeElement(tag); allElements.push(item); return item; },
};
const windowStub = {
  matchMedia: () => ({ matches: false }),
  addEventListener() {},
};
const navigatorStub = { serviceWorker: { register: async () => ({}) } };
let lastOscillator;
class FakeAudioContext {
  constructor() { this.currentTime = 1; this.state = 'running'; }
  createOscillator() {
    lastOscillator = {
      frequency: new FakeParam(),
      connect() {}, disconnect() {}, start() {}, stop() {}, addEventListener() {},
      type: '',
    };
    return lastOscillator;
  }
  createGain() { return { gain: new FakeParam(), connect() {}, disconnect() {} }; }
  createMediaStreamDestination() { return { stream: {} }; }
  async resume() {}
}

Object.defineProperty(globalThis, 'document', { value: documentStub, configurable: true });
Object.defineProperty(globalThis, 'window', { value: windowStub, configurable: true });
Object.defineProperty(globalThis, 'navigator', { value: navigatorStub, configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
Object.defineProperty(globalThis, 'AudioContext', { value: FakeAudioContext, configurable: true });

element('frequencyInput').value = '432';
element('volumeInput').value = '0.16';
element('audioOutput').play = async () => {};
element('audioOutput').pause = () => {};
element('themeIcon').nextElementSibling = new FakeElement('themeLabel');
element('playButton').appendChild(Object.assign(new FakeElement('playIcon'), { className: 'play-icon' }));
element('playButton').appendChild(new FakeElement('playLabel'));

test('app renders presets, saves/selects a custom preset and retunes the active oscillator', async () => {
  await import('../app.js?runtime-test');
  const builtIns = element('presetList');
  assert.deepEqual(builtIns.children.map((button) => [button.textContent, button.dataset.frequency]), [
    ['Racine — 396 Hz', '396'], ['Sacré — 417 Hz', '417'], ['Plexus solaire — 528 Hz', '528'],
    ['Cœur — 639 Hz', '639'], ['Gorge — 741 Hz', '741'], ['Troisième œil — 852 Hz', '852'], ['Couronne — 963 Hz', '963'],
  ]);
  assert.equal(element('selectedPresetName').textContent, 'Fréquence personnalisée');
  assert.equal(element('frequencyInput').value, '432', 'preserve the existing initial free-frequency value');
  builtIns.children[2].click();
  assert.equal(element('frequencyInput').value, '528');
  assert.equal(element('selectedPresetName').textContent, 'Plexus solaire');
  element('frequencyInput').value = '432';
  element('frequencyInput').dispatch('input');
  assert.equal(element('selectedPresetName').textContent, 'Fréquence personnalisée');

  element('customPresetName').value = '  Tempo doux  ';
  element('customPresetFrequency').value = '777';
  element('saveCustomPresetButton').click();
  const customList = element('customPresetList');
  assert.equal(customList.children.length, 1);
  assert.match(customList.children[0].textContent, /Tempo doux/);
  assert.match(customList.children[0].textContent, /777 Hz/);

  customList.children[0].click();
  assert.equal(element('frequencyInput').value, '777');
  assert.equal(element('frequencyDisplay').textContent, '777');
  assert.equal(element('selectedPresetName').textContent, 'Tempo doux');

  element('playButton').click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(lastOscillator, 'audio started after the user gesture');
  element('frequencyInput').value = '888';
  element('frequencyInput').dispatch('input');
  assert.ok(lastOscillator.frequency.calls.some((call) => call[0] === 'setTargetAtTime' && call[1] === 888));
});


test('preset controls keep button semantics and announce the selected state', async () => {
  await import('../app.js?runtime-accessibility-test');
  const buttons = element('presetList').children;
  assert.equal(buttons[0].getAttribute('role'), null, 'retain the native button role');
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
  buttons[0].click();
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'true');
});
