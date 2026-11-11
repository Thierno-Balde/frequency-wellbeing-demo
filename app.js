import {
  BUILT_IN_PRESETS,
  addCustomPreset,
  loadCustomPresets,
  normalizeCustomPreset,
  validateFrequency,
} from './preset-store.js?v=6';

const frequencyInput = document.querySelector('#frequencyInput');
const frequencyDisplay = document.querySelector('#frequencyDisplay');
const selectedPresetName = document.querySelector('#selectedPresetName');
const dockFrequency = document.querySelector('#dockFrequency');
const frequencyHelp = document.querySelector('#frequencyHelp');
const customPresetCount = document.querySelector('#customPresetCount');
const volumeValue = document.querySelector('#volumeValue');
const volumeInput = document.querySelector('#volumeInput');
const playButton = document.querySelector('#playButton');
const playLabel = playButton.querySelector('span:last-child');
const playIcon = playButton.querySelector('.play-icon');
const status = document.querySelector('#status');
const orb = document.querySelector('#orb');
const presetList = document.querySelector('#presetList');
const customPresetList = document.querySelector('#customPresetList');
const customPresetName = document.querySelector('#customPresetName');
const customPresetFrequency = document.querySelector('#customPresetFrequency');
const saveCustomPresetButton = document.querySelector('#saveCustomPresetButton');
const customPresetStatus = document.querySelector('#customPresetStatus');
const customPresetEmpty = document.querySelector('#customPresetEmpty');

const themeToggle = document.querySelector('#themeToggle');
const themeIcon = document.querySelector('#themeIcon');
const themeMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(isDark));
  themeToggle.setAttribute('aria-label', isDark ? 'Activer le mode clair' : 'Activer le mode sombre');
  themeIcon.textContent = isDark ? '☀' : '☾';
  themeIcon.nextElementSibling.textContent = isDark ? 'Activer le mode clair' : 'Activer le mode sombre';
  themeMeta.content = isDark ? '#0b0b0d' : '#f5f5f7';
}

let savedTheme = null;
try { savedTheme = localStorage.getItem('frequence-theme'); } catch {}
const initialTheme = savedTheme || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(initialTheme);

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try { localStorage.setItem('frequence-theme', nextTheme); } catch {}
});

let audioContext = null;
let oscillator = null;
let gainNode = null;
let mediaDestination = null;
let audioElement = null;
let isPlaying = false;
let customPresets = [];
let presetStorage = null;
try { presetStorage = globalThis.localStorage; } catch {}

function getFrequency() {
  return validateFrequency(frequencyInput.value);
}

let activePresetSelection = null;

function renderFrequency() {
  const value = getFrequency();
  frequencyDisplay.textContent = value === null ? '—' : String(value);
  frequencyInput.setAttribute('aria-invalid', String(value === null));
  frequencyHelp.textContent = value === null
    ? 'Saisissez une fréquence entière entre 20 et 20 000 Hz.'
    : 'De 20 à 20 000 Hz';
  const matchingPreset = [...BUILT_IN_PRESETS, ...customPresets].find((preset) => preset.frequencyHz === value);
  const name = value === null
    ? 'Fréquence invalide'
    : activePresetSelection?.frequencyHz === value
      ? activePresetSelection.name
      : matchingPreset?.name ?? 'Fréquence personnalisée';
  selectedPresetName.textContent = name;
  dockFrequency.textContent = `${value === null ? '—' : value} Hz · ${name}`;
}

function setStatus(message) {
  status.textContent = message;
}

function setCustomPresetStatus(message) {
  customPresetStatus.textContent = message;
}

function setPresetState(value) {
  document.querySelectorAll('.preset').forEach((preset) => {
    const isSelected = Number(preset.dataset.frequency) === value;
    preset.classList.toggle('is-selected', isSelected);
    preset.setAttribute('aria-pressed', String(isSelected));
  });
}

function selectPreset(preset) {
  activePresetSelection = preset;
  frequencyInput.value = String(preset.frequencyHz);
  renderFrequency();
  setPresetState(preset.frequencyHz);
  updatePlayingFrequency();
}

function renderPresetButtons(container, items) {
  container.replaceChildren();
  items.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset';
    button.dataset.frequency = String(preset.frequencyHz);
    const frequencyLabel = `${preset.frequencyHz} Hz`;
    button.textContent = preset.name === frequencyLabel ? frequencyLabel : `${preset.name} — ${frequencyLabel}`;
    button.setAttribute('aria-label', `${preset.name}, ${preset.frequencyHz} Hz`);
    button.addEventListener('click', () => selectPreset(preset));
    container.appendChild(button);
  });
}

function renderPresets() {
  renderPresetButtons(presetList, BUILT_IN_PRESETS);
  renderPresetButtons(customPresetList, customPresets);
  customPresetEmpty.hidden = customPresets.length > 0;
  customPresetCount.textContent = customPresets.length === 0
    ? 'Aucun enregistré'
    : `${customPresets.length} enregistré${customPresets.length === 1 ? '' : 's'}`;
  setPresetState(getFrequency());
}

function cleanupAudio() {
  if (audioElement) { audioElement.pause(); audioElement.srcObject = null; }
  if (oscillator) oscillator.disconnect();
  if (gainNode) gainNode.disconnect();
  oscillator = null;
  gainNode = null;
  isPlaying = false;
  playButton.classList.remove('is-playing');
  playButton.setAttribute('aria-pressed', 'false');
  playLabel.textContent = 'Écouter';
  playIcon.textContent = '▶';
  orb.classList.remove('is-playing');
}

async function startAudio() {
  const frequency = getFrequency();
  if (frequency === null) {
    setStatus('Saisissez une fréquence entière entre 20 et 20 000 Hz.');
    frequencyInput.focus();
    return;
  }

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    mediaDestination = audioContext.createMediaStreamDestination();
    audioElement = document.querySelector('#audioOutput');
    audioElement.srcObject = mediaDestination.stream;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(Number(volumeInput.value), audioContext.currentTime + 0.18);
    oscillator.connect(gainNode);
    gainNode.connect(mediaDestination);
    await audioElement.play();
    oscillator.addEventListener('ended', cleanupAudio, { once: true });
    oscillator.start();
    isPlaying = true;
    playButton.classList.add('is-playing');
    playButton.setAttribute('aria-pressed', 'true');
    playLabel.textContent = 'Arrêter';
    playIcon.textContent = '■';
    orb.classList.add('is-playing');
    setStatus(`Lecture en cours à ${frequency} Hz`);
  } catch (error) {
    cleanupAudio();
    setStatus('Le navigateur a bloqué le son. Appuyez à nouveau sur Écouter.');
    console.error(error);
  }
}

function updatePlayingFrequency() {
  const frequency = getFrequency();
  if (!isPlaying || frequency === null || !oscillator || !audioContext) return;
  oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.015);
  setStatus(`Lecture en cours à ${frequency} Hz`);
}

function stopAudio(reason = 'Écoute arrêtée') {
  if (!oscillator || !audioContext || !gainNode) return;
  const now = audioContext.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setTargetAtTime(0, now, 0.06);
  oscillator.stop(now + 0.24);
  setStatus(reason);
}

function saveCustomPreset() {
  const normalized = normalizeCustomPreset(customPresetName.value, customPresetFrequency.value);
  if (!normalized) {
    setCustomPresetStatus('Saisissez un nom et une fréquence entière entre 20 et 20 000 Hz.');
    if (!String(customPresetName.value).trim()) customPresetName.focus();
    else customPresetFrequency.focus();
    return;
  }

  const result = addCustomPreset(presetStorage, normalized.name, normalized.frequencyHz);
  if (!result.ok) {
    setCustomPresetStatus('Enregistrement indisponible dans ce navigateur. Aucun preset n’a été sauvegardé.');
    return;
  }

  customPresets = loadCustomPresets(presetStorage);
  renderPresets();
  customPresetName.value = '';
  customPresetFrequency.value = '';
  setCustomPresetStatus(`Preset « ${result.preset.name} » enregistré sur cet appareil.`);
}

frequencyInput.addEventListener('input', () => {
  activePresetSelection = null;
  renderFrequency();
  setPresetState(getFrequency());
  updatePlayingFrequency();
});

saveCustomPresetButton.addEventListener('click', saveCustomPreset);

function renderVolumeValue() {
  volumeValue.textContent = `${Math.round(Number(volumeInput.value) * 200)} %`;
}

volumeInput.addEventListener('input', () => {
  renderVolumeValue();
  if (isPlaying && gainNode) {
    gainNode.gain.setTargetAtTime(Number(volumeInput.value), audioContext.currentTime, 0.03);
  }
});

playButton.addEventListener('click', () => {
  if (isPlaying) stopAudio();
  else startAudio();
});

customPresets = loadCustomPresets(presetStorage);
renderPresets();
renderFrequency();
renderVolumeValue();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js?v=6', { updateViaCache: 'none' }).catch(() => {}));
}
