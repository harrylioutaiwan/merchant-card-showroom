import type { Product } from './model.js';

// Snapshot fixtures transcribed from reference screenshots with generic names.
export const catalog: Product[] = [
  {
    id: 'rank-drinks',
    kind: 'ranking',
    name: '中杯飲料 買一送一（好禮即享券）',
    imageUrl: './assets/drinks.jpg',
    price: { amount: 38, original: 76 },
    promotion: '電子票券・即買即用',
    campaign: '票券活動優惠',
    rating: { score: 4.5, count: 43 },
    rank: 1,
    sold: '總銷量超過 1.5 萬',
  },
  {
    id: 'flash-cream',
    kind: 'flash-sale',
    name: '全效合一水凝霜 3 入組',
    imageUrl: './assets/hydration.jpg',
    price: { amount: 2511, original: 4740 },
    promotion: '下單送 100 點',
    campaign: '11/27 限定優惠',
    stock: 389,
  },
  {
    id: 'search-toothpaste',
    kind: 'search',
    name: '專業抗敏護齦牙膏 100g × 8 入',
    imageUrl: './assets/toothpaste.jpg',
    media: {
      additionalImages: ['./assets/toothpaste-detail.jpg'],
      video: { id: 'fyNzdn9yHVE', title: '抗敏牙膏影片示例' },
    },
    price: { amount: 1078 },
    priceNote: '售價已折',
    sponsored: true,
    promotion: '滿 1 件折 111',
    rating: { score: 4.5, count: 2954 },
    shipping: '最快今天',
    tags: ['登記', '贈品'],
    sold: '總銷量超過 1 萬',
  },
];
