import type { Product } from './model.js';

export const catalog = [
  {
    id: 'hydration-duo',
    name: '保濕修護霜雙罐組',
    category: '美妝保養',
    imageUrl: './assets/hydration.jpg',
    price: { amount: 850, kind: 'fixed', original: 1080 },
    promotion: '期間特價',
    rating: { score: 4.8, count: 128 },
  },
  {
    id: 'wireless-headphones',
    name: '輕量無線降噪耳機',
    category: '3C 配件',
    imageUrl: './assets/headphones.jpg',
    price: { amount: 1290, kind: 'from' },
    rating: { score: 4.6, count: 86 },
  },
  {
    id: 'thermal-bottle',
    name: '不鏽鋼真空保溫瓶',
    category: '居家生活',
    imageUrl: './assets/bottle.jpg',
    price: { amount: 680, kind: 'fixed', original: 820 },
    promotion: '領券再折',
  },
] satisfies Product[];
