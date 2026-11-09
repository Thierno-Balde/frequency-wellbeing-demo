const MIN_FREQUENCY = 20;
const MAX_FREQUENCY = 20000;

const frequencyInput = document.querySelector('#frequencyInput');
const frequencyDisplay = document.querySelector('#frequencyDisplay');
const volumeInput = document.querySelector('#volumeInput');
const playButton = document.querySelector('#playButton');
const playLabel = playButton.querySelector('span:last-child');
const playIcon = playButton.querySelector('.play-icon');
const status = document.querySelector('#status');
const orb = document.querySelector('#orb');
const presets = [...document.querySelectorAll('.preset')];

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
let isPlaying = false;

function getFrequency() {
  const value = Number(frequencyInput.value);
  return Number.isFinite(value) && value >= MIN_FREQUENCY && value <= MAX_FREQUENCY ? value : null;
}

function renderFrequency() {
  const value = getFrequency();
  frequencyDisplay.textContent = value === null ? '—' : String(value);
  frequencyInput.setAttribute('aria-invalid', String(value === null));
}

function setStatus(message) {
  status.textContent = message;
}

function setPresetState(value) {
  presets.forEach((preset) => {
    preset.classList.toggle('is-selected', Number(preset.dataset.frequency) === value);
  });
}

function cleanupAudio() {
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
    setStatus(`Choisissez une fréquence entre ${MIN_FREQUENCY} et ${MAX_FREQUENCY} Hz`);
    frequencyInput.focus();
    return;
  }

  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === 'suspended') await audioContext.resume();

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(Number(volumeInput.value), audioContext.currentTime + 0.18);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
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

function stopAudio() {
  if (!oscillator || !audioContext) return;
  const now = audioContext.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setTargetAtTime(0, now, 0.06);
  oscillator.stop(now + 0.24);
  setStatus('Écoute arrêtée');
}

function updatePlayingFrequency() {
  const frequency = getFrequency();
  if (isPlaying && frequency !== null) {
    oscillator.frequency.setTargetAtTime(frequency, audioContext.currentTime, 0.03);
    setStatus(`Lecture en cours à ${frequency} Hz`);
  }
}

frequencyInput.addEventListener('input', () => {
  renderFrequency();
  setPresetState(Number(frequencyInput.value));
  updatePlayingFrequency();
});

presets.forEach((preset) => {
  preset.addEventListener('click', () => {
    frequencyInput.value = preset.dataset.frequency;
    renderFrequency();
    setPresetState(Number(preset.dataset.frequency));
    updatePlayingFrequency();
  });
});

volumeInput.addEventListener('input', () => {
  if (isPlaying && gainNode) {
    gainNode.gain.setTargetAtTime(Number(volumeInput.value), audioContext.currentTime, 0.03);
  }
});

playButton.addEventListener('click', () => {
  if (isPlaying) stopAudio();
  else startAudio();
});

renderFrequency();
setPresetState(Number(frequencyInput.value));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
