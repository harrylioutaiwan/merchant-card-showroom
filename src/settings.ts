import {
  defaultSettings,
  displayFields,
  type CardConfiguration,
  type ProductOverrides,
} from './model.js';

export const maxPrice = 99_999_999;

export function settingsKey(id: string): string {
  return `merchant-showroom:settings:${id}`;
}

export function createDefaults(): CardConfiguration {
  return { settings: { ...defaultSettings }, overrides: {} };
}

function parseOverrides(value: ProductOverrides | undefined): ProductOverrides {
  const overrides: ProductOverrides = {};
  if (typeof value?.name === 'string' && value.name.trim() && value.name.length <= 100) {
    overrides.name = value.name.trim();
  }
  if (typeof value?.price === 'number' && Number.isInteger(value.price) && value.price >= 0 && value.price <= maxPrice) {
    overrides.price = value.price;
  }
  if (typeof value?.promotion === 'string' && value.promotion.length <= 80) {
    overrides.promotion = value.promotion;
  }
  return overrides;
}

export function decodeConfig(raw: string | null): CardConfiguration {
  const config = createDefaults();
  if (!raw) return config;

  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || typeof data.settings !== 'object' || !data.settings) return config;
    for (const { key } of displayFields) {
      if (typeof data.settings[key] === 'boolean') config.settings[key] = data.settings[key];
    }
    config.overrides = parseOverrides(data.overrides);
  } catch {
    // Leave defaults available when stored JSON is invalid.
  }
  return config;
}

export function readConfig(id: string): CardConfiguration {
  try {
    return decodeConfig(window.localStorage.getItem(settingsKey(id)));
  } catch {
    return createDefaults();
  }
}

export function writeConfig(id: string, config: CardConfiguration): boolean {
  try {
    window.localStorage.setItem(settingsKey(id), JSON.stringify({ version: 1, ...config }));
    return true;
  } catch {
    return false;
  }
}
