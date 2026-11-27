import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../.test-build/catalog.js';
import { getVariantPresentation } from '../.test-build/card-variants.js';
import { defaultSettings, formatPrice } from '../.test-build/model.js';
import { cardHref, parseRoute, presets } from '../.test-build/registry.js';
import { decodeSettings, readSettings, writeSettings } from '../.test-build/settings.js';

test('invalid, absent and unknown-version data use defaults', () => {
  for (const raw of [null, '{', 'null', '{"version":3,"settings":{"showRating":false}}']) {
    assert.deepEqual(decodeSettings(raw), defaultSettings);
  }
});

test('v2 accepts boolean display values and fills defaults', () => {
  const raw = '{"version":2,"settings":{"showOriginalPrice":false,"showPromotion":0,"unrecognized":true}}';
  assert.deepEqual(decodeSettings(raw), { ...defaultSettings, showOriginalPrice: false });
});

test('v1 migrates preferences and discards product overrides', () => {
  const raw = '{"version":1,"settings":{"showRating":false},"overrides":{"name":"ignored","price":0}}';
  assert.deepEqual(decodeSettings(raw), { ...defaultSettings, showRating: false });
});

test('storage tolerates malformed settings containers', () => {
  for (const settings of [null, [], 'bad', 1]) {
    assert.deepEqual(decodeSettings(JSON.stringify({ version: 2, settings })), defaultSettings);
  }
});

test('storage round-trips by product ID and reset restores defaults', (context) => {
  const data = new Map();
  const previous = globalThis.window;
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  };
  context.after(() => {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });

  const edited = { ...defaultSettings, showPromotion: false };
  assert.equal(writeSettings(catalog[0].id, edited), true);
  assert.deepEqual(readSettings(catalog[0].id), edited);
  assert.deepEqual(JSON.parse([...data.values()][0]), { version: 2, settings: edited });
  assert.deepEqual(readSettings(catalog[1].id), defaultSettings);
  assert.equal(writeSettings(catalog[0].id, defaultSettings), true);
  assert.deepEqual(readSettings(catalog[0].id), defaultSettings);
});

test('storage denial recovers from reads and reports failed writes', (context) => {
  const previous = globalThis.window;
  globalThis.window = {
    get localStorage() { throw new Error('Storage unavailable'); },
  };
  context.after(() => {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
  assert.deepEqual(readSettings('example'), defaultSettings);
  assert.equal(writeSettings('example', defaultSettings), false);
});

test('all presets resolve and search variants share the same product', () => {
  assert.equal(new Set(catalog.map(({ id }) => id)).size, catalog.length);
  assert.equal(presets.length, 4);
  for (const preset of presets) {
    const route = parseRoute(cardHref(preset.productId, preset.layout));
    assert.equal(route.type, 'card');
    assert.equal(route.preset.key, preset.key);
  }
  assert.equal(presets[0].productId, presets[1].productId);
  assert.equal(parseRoute('?card=invalid').type, 'missing');
  assert.equal(parseRoute('?card=rank-drinks&layout=list').preset.key, 'ranking');
});

test('variant presentation maps distinct commerce metadata', () => {
  assert.equal(getVariantPresentation(catalog[0]).rank, '第 1 名');
  assert.equal(getVariantPresentation(catalog[2]).priceLabel, '限搶價');
  assert.ok(getVariantPresentation(catalog[2]).supporting.some((item) => item.text === '最後 389 組'));
  assert.ok(getVariantPresentation(catalog[4]).supporting.some((item) => item.className === 'shipping'));
  assert.equal(formatPrice(1078), '$1,078');
});
