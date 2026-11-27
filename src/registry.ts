import { catalog } from './catalog.js';
import type { CardKind, Layout, Product } from './model.js';

export const presets = [
  { key: 'search-grid', title: '搜尋方格', kind: 'search', layout: 'grid', previewWidth: '320', productId: 'search-toothpaste', description: '搜尋結果 · 直式版型' },
  { key: 'search-list', title: '搜尋橫列', kind: 'search', layout: 'list', previewWidth: 'auto', productId: 'search-toothpaste', description: '搜尋結果 · 水平版型' },
  { key: 'ranking', title: '精選排行', kind: 'ranking', layout: 'grid', previewWidth: '240', productId: 'rank-drinks', description: '首頁精選 · 排名、評價與銷量' },
  { key: 'flash-sale', title: '限時搶購', kind: 'flash-sale', layout: 'grid', previewWidth: '240', productId: 'flash-cream', description: '限搶活動 · 優惠價與剩餘組數' },
] as const satisfies readonly {
  key: string;
  title: string;
  kind: CardKind;
  layout: Layout;
  previewWidth: '240' | '320' | 'auto';
  productId: string;
  description: string;
}[];

export type Preset = (typeof presets)[number];

export function cardHref(id: string, layout: Layout): string {
  const params = new URLSearchParams({ card: id });
  if (layout === 'list') params.set('layout', layout);
  return `?${params}`;
}

export function parseRoute(search: string):
  | { type: 'overview' }
  | { type: 'missing' }
  | { type: 'card'; product: Product; preset: Preset } {
  const query = new URLSearchParams(search);
  const id = query.get('card');
  if (id === null) return { type: 'overview' };
  const product = catalog.find((entry) => entry.id === id);
  if (!product) return { type: 'missing' };
  const layout = product.kind === 'search' && query.get('layout') === 'list' ? 'list' : 'grid';
  const preset = presets.find((item) => item.kind === product.kind && item.layout === layout)!;
  return { type: 'card', product, preset };
}
