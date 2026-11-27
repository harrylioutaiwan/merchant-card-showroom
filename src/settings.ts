import { defaultSettings, displayFields, type DisplaySettings, type Layout } from './model.js';

export function settingsKey(id: string, layout: Layout = 'grid'): string {
  const base = `merchant-showroom:settings:${id}`;
  return layout === 'list' ? `${base}:list` : base;
}

export function decodeSettings(raw: string | null): DisplaySettings {
  const settings = { ...defaultSettings };
  if (!raw) return settings;

  try {
    const data = JSON.parse(raw);
    if ((data?.version !== 1 && data?.version !== 2) ||
      !data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) {
      return settings;
    }
    for (const { key } of displayFields) {
      if (typeof data.settings[key] === 'boolean') settings[key] = data.settings[key];
    }
  } catch {
    // Leave defaults available when stored JSON is invalid.
  }
  return settings;
}

export function readSettings(id: string, layout: Layout = 'grid'): DisplaySettings {
  try {
    return decodeSettings(window.localStorage.getItem(settingsKey(id, layout)));
  } catch {
    return { ...defaultSettings };
  }
}

export function writeSettings(id: string, settings: DisplaySettings, layout: Layout = 'grid'): boolean {
  try {
    window.localStorage.setItem(settingsKey(id, layout), JSON.stringify({ version: 2, settings }));
    return true;
  } catch {
    return false;
  }
}
