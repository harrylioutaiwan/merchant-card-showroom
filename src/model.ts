export type Layout = 'grid' | 'list';
export type CardKind = 'ranking' | 'flash-sale' | 'search';

interface ProductDetails {
  id: string;
  name: string;
  imageUrl: string;
  price: { amount: number; original?: number };
  promotion?: string;
  campaign?: string;
  rating?: { score: number; count: number };
}

export type Product = ProductDetails & (
  | { kind: 'ranking'; rank: number; sold: string }
  | { kind: 'flash-sale'; stock: number }
  | { kind: 'search'; sponsored?: boolean; priceNote?: string; shipping?: string; tags: string[]; sold?: string }
);

export const displayFields = [
  { key: 'showOriginalPrice', label: '顯示原價' },
  { key: 'showPromotion', label: '顯示促銷文案' },
  { key: 'showRating', label: '顯示評價' },
  { key: 'showRank', label: '顯示排名' },
  { key: 'showSold', label: '顯示銷量' },
  { key: 'showStock', label: '顯示剩餘組數' },
  { key: 'showShipping', label: '顯示配送' },
  { key: 'showTags', label: '顯示活動標籤' },
] as const;

export type DisplayKey = (typeof displayFields)[number]['key'];
export type DisplaySettings = Record<DisplayKey, boolean>;

export const defaultSettings: Readonly<DisplaySettings> = Object.freeze({
  showOriginalPrice: true,
  showPromotion: true,
  showRating: true,
  showRank: true,
  showSold: true,
  showStock: true,
  showShipping: true,
  showTags: true,
});

const twd = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return `$${twd.format(amount)}`;
}
