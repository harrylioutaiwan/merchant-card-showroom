import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../.test-build/catalog.js';
import { getVariantPresentation } from '../.test-build/card-variants.js';
import { applyOverrides, defaultSettings, formatPrice } from '../.test-build/model.js';
import { cardHref, parseRoute, presets } from '../.test-build/registry.js';
import { createDefaults, decodeConfig, readConfig, writeConfig } from '../.test-build/settings.js';

test('invalid, absent and unknown-version data use defaults', () => {
  for (const raw of [null, '{', 'null', '{"version":2,"settings":{"showRating":false}}']) {
    assert.deepEqual(decodeConfig(raw), createDefaults());
  }
});

test('only valid settings and overrides are applied, including falsy values', () => {
  const config = decodeConfig(JSON.stringify({
    version: 1,
    settings: { showOriginalPrice: false, showPromotion: 0 },
    overrides: { name: '  ', price: 0, promotion: '' },
  }));
  assert.deepEqual(config, {
    settings: { ...defaultSettings, showOriginalPrice: false },
    overrides: { price: 0, promotion: '' },
  });
  const effective = applyOverrides(catalog[0], config.overrides);
  assert.equal(effective.price.amount, 0);
  assert.equal(effective.price.original, catalog[0].price.original);
  assert.equal(effective.promotion, '');
  assert.equal(catalog[0].price.amount, 38);
});

test('legacy settings without overrides remain usable', () => {
  assert.deepEqual(decodeConfig('{"version":1,"settings":{"showRating":false}}'), {
    settings: { ...defaultSettings, showRating: false },
    overrides: {},
  });
});

test('malformed overrides are ignored', () => {
  const config = decodeConfig('{"version":1,"settings":{},"overrides":{"name":5,"price":-1,"promotion":[]}}');
  assert.deepEqual(config, createDefaults());
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

  const edited = { settings: { ...defaultSettings, showPromotion: false }, overrides: { price: 999 } };
  assert.equal(writeConfig(catalog[0].id, edited), true);
  assert.deepEqual(readConfig(catalog[0].id), edited);
  assert.deepEqual(readConfig(catalog[1].id), createDefaults());
  assert.equal(writeConfig(catalog[0].id, createDefaults()), true);
  assert.deepEqual(readConfig(catalog[0].id), createDefaults());
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
  assert.deepEqual(readConfig('example'), createDefaults());
  assert.equal(writeConfig('example', createDefaults()), false);
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
