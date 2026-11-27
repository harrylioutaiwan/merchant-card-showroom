export type Layout = 'grid' | 'list';

export interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: { amount: number; kind: 'fixed' | 'from'; original?: number };
  promotion?: string;
  rating?: { score: number; count: number };
}

export const displayFields = [
  { key: 'showOriginalPrice', label: '顯示原價' },
  { key: 'showPromotion', label: '顯示促銷標籤' },
  { key: 'showRating', label: '顯示評價' },
] as const;

export type DisplayKey = (typeof displayFields)[number]['key'];
export type DisplaySettings = Record<DisplayKey, boolean>;

export const defaultSettings: Readonly<DisplaySettings> = Object.freeze({
  showOriginalPrice: true,
  showPromotion: true,
  showRating: true,
});

const twd = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return `NT$ ${twd.format(amount)}`;
}
