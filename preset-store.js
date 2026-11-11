export const MIN_FREQUENCY = 20;
export const MAX_FREQUENCY = 20000;
export const CUSTOM_PRESETS_STORAGE_KEY = 'frequence-custom-presets:v1';

export const BUILT_IN_PRESETS = Object.freeze([
  Object.freeze({ id: 'default-256', name: '256 Hz', frequencyHz: 256 }),
  Object.freeze({ id: 'default-432', name: '432 Hz', frequencyHz: 432 }),
  Object.freeze({ id: 'chakra-root', name: 'Racine', frequencyHz: 396 }),
  Object.freeze({ id: 'chakra-sacral', name: 'Sacré', frequencyHz: 417 }),
  Object.freeze({ id: 'chakra-solar-plexus', name: 'Plexus solaire', frequencyHz: 528 }),
  Object.freeze({ id: 'chakra-heart', name: 'Cœur', frequencyHz: 639 }),
  Object.freeze({ id: 'chakra-throat', name: 'Gorge', frequencyHz: 741 }),
  Object.freeze({ id: 'chakra-third-eye', name: 'Troisième œil', frequencyHz: 852 }),
  Object.freeze({ id: 'chakra-crown', name: 'Couronne', frequencyHz: 963 }),
  Object.freeze({ id: 'default-768', name: '768 Hz', frequencyHz: 768 }),
]);

export function validateFrequency(value) {
  if (typeof value === 'string' && value.trim() === '') return null;
  const frequencyHz = Number(value);
  return Number.isInteger(frequencyHz) && frequencyHz >= MIN_FREQUENCY && frequencyHz <= MAX_FREQUENCY
    ? frequencyHz
    : null;
}

export function normalizeCustomPreset(name, frequencyHz) {
  if (typeof name !== 'string') return null;
  const cleanName = name.trim();
  const cleanFrequency = validateFrequency(frequencyHz);
  if (!cleanName || cleanFrequency === null) return null;
  return { name: cleanName, frequencyHz: cleanFrequency };
}

function parseStoredPresets(raw) {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.presets)) return [];
    return data.presets
      .map((preset) => normalizeCustomPreset(preset?.name, preset?.frequencyHz))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function loadCustomPresets(storage = globalThis.localStorage) {
  try {
    return parseStoredPresets(storage.getItem(CUSTOM_PRESETS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function addCustomPreset(storage, name, frequencyHz) {
  const preset = normalizeCustomPreset(name, frequencyHz);
  if (!preset) return { ok: false, reason: 'invalid' };

  try {
    const current = parseStoredPresets(storage.getItem(CUSTOM_PRESETS_STORAGE_KEY));
    storage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify({ version: 1, presets: [...current, preset] }));
    return { ok: true, preset };
  } catch {
    return { ok: false, reason: 'storage' };
  }
}
