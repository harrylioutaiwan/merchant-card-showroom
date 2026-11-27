import { defaultSettings, displayFields, type DisplaySettings } from './model.js';

export function settingsKey(id: string): string {
  return `merchant-showroom:settings:${id}`;
}

export function decodeSettings(raw: string | null): DisplaySettings {
  const settings = { ...defaultSettings };
  if (!raw) return settings;

  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !data.settings || typeof data.settings !== 'object') {
      return settings;
    }

    for (const { key } of displayFields) {
      if (typeof data.settings[key] === 'boolean') settings[key] = data.settings[key];
    }
  } catch {
    // Leave the defaults available when stored JSON is invalid.
  }
  return settings;
}

export function readSettings(id: string): DisplaySettings {
  try {
    return decodeSettings(window.localStorage.getItem(settingsKey(id)));
  } catch {
    return { ...defaultSettings };
  }
}

export function writeSettings(id: string, settings: DisplaySettings): boolean {
  try {
    window.localStorage.setItem(settingsKey(id), JSON.stringify({ version: 1, settings }));
    return true;
  } catch {
    return false;
  }
}
