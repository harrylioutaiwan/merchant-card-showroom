import './merchant-card.js';
import { catalog } from './catalog.js';
import { defaultSettings, displayFields, type DisplaySettings, type Layout, type Product } from './model.js';
import { readSettings, settingsKey, writeSettings } from './settings.js';

function attachLayoutControls(section: HTMLElement, onChange: (layout: Layout) => void): void {
  const buttons = section.querySelectorAll<HTMLButtonElement>('button[data-layout]');
  for (const button of buttons) {
    button.addEventListener('click', () => {
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      onChange(button.dataset.layout === 'list' ? 'list' : 'grid');
    });
  }
}

function renderOverview(): void {
  const section = document.querySelector<HTMLElement>('#overview')!;
  const list = document.querySelector<HTMLUListElement>('#cards')!;
  document.querySelector('#card-count')!.textContent = `${catalog.length} 張示例商品卡`;

  const cards = catalog.map((product) => {
    const entry = document.createElement('li');
    const link = document.createElement('a');
    const card = document.createElement('merchant-card');
    const label = document.createElement('span');

    link.className = 'card-link';
    link.href = `?card=${encodeURIComponent(product.id)}`;
    link.setAttribute('aria-label', `編輯${product.name}`);
    label.textContent = '編輯商品卡';
    label.className = 'card-action';
    card.product = product;
    link.append(card, label);
    entry.append(link);
    list.append(entry);
    return { card, id: product.id };
  });

  function refresh(): void {
    for (const { card, id } of cards) card.settings = readSettings(id);
  }

  attachLayoutControls(section, (layout) => {
    list.dataset.layout = layout;
    for (const { card } of cards) card.setAttribute('layout', layout);
  });

  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', refresh);
  refresh();
  section.hidden = false;
}

function renderDetail(product: Product): void {
  const section = document.querySelector<HTMLElement>('#detail')!;
  const frame = document.querySelector<HTMLElement>('#preview-frame')!;
  const preview = document.querySelector('merchant-card')!;
  const fields = document.querySelector('#settings-fields')!;
  const status = document.querySelector('#save-status')!;
  let settings = readSettings(product.id);
  let unsaved = false;

  preview.product = product;
  document.querySelector('#detail-title')!.textContent = product.name;
  document.title = `${product.name} · Merchant Card Showroom`;

  const applicableFields = {
    showOriginalPrice: product.price.original !== undefined,
    showPromotion: Boolean(product.promotion),
    showRating: Boolean(product.rating),
  };

  const inputs = displayFields.filter(({ key }) => applicableFields[key]).map(({ key, label }) => {
    const row = document.createElement('label');
    const caption = document.createElement('span');
    const input = document.createElement('input');
    caption.textContent = label;
    input.type = 'checkbox';
    input.name = key;
    row.className = 'setting-row';
    row.append(caption, input);
    fields.append(row);

    input.addEventListener('change', () => save({ ...settings, [key]: input.checked }));
    return { input, key };
  });

  function render(): void {
    preview.settings = settings;
    for (const { input, key } of inputs) input.checked = settings[key];
  }

  function save(next: DisplaySettings, message = '設定已儲存。'): void {
    settings = next;
    unsaved = !writeSettings(product.id, settings);
    status.textContent = unsaved ? '瀏覽器無法儲存設定，目前變更只會套用到預覽。' : message;
    render();
  }

  attachLayoutControls(section, (layout) => {
    frame.dataset.layout = layout;
    preview.setAttribute('layout', layout);
  });

  document.querySelector('#reset')!.addEventListener('click', () =>
    save({ ...defaultSettings }, '已恢復並儲存預設值。'),
  );

  window.addEventListener('storage', (event) => {
    if (unsaved || (event.key !== null && event.key !== settingsKey(product.id))) return;
    settings = readSettings(product.id);
    status.textContent = '已同步此卡片的瀏覽器設定。';
    render();
  });

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted || unsaved) return;
    settings = readSettings(product.id);
    status.textContent = '';
    render();
  });

  render();
  section.hidden = false;
}

const id = new URLSearchParams(window.location.search).get('card');
const product = catalog.find((entry) => entry.id === id);

if (id === null) {
  renderOverview();
} else if (product) {
  renderDetail(product);
} else {
  document.querySelector<HTMLElement>('#missing')!.hidden = false;
  document.title = '找不到商品卡 · Merchant Card Showroom';
}
