import { type Product } from './model.js';

interface SupportingItem {
  className: 'sold' | 'stock' | 'shipping' | 'tag';
  text: string;
}

interface VariantPresentation {
  rank?: string;
  priceLabel?: string;
  priceNote?: string;
  supporting: SupportingItem[];
}

function rankingCard(product: Extract<Product, { kind: 'ranking' }>): VariantPresentation {
  return {
    rank: `第 ${product.rank} 名`,
    supporting: [{ className: 'sold', text: product.sold }],
  };
}

function flashSaleCard(product: Extract<Product, { kind: 'flash-sale' }>): VariantPresentation {
  return {
    priceLabel: '限搶價',
    supporting: [{ className: 'stock', text: `最後 ${product.stock} 組` }],
  };
}

function searchCard(product: Extract<Product, { kind: 'search' }>): VariantPresentation {
  const supporting: SupportingItem[] = [];
  if (product.sold) supporting.push({ className: 'sold', text: product.sold });
  if (product.shipping) supporting.push({ className: 'shipping', text: product.shipping });
  for (const tag of product.tags) supporting.push({ className: 'tag', text: tag });
  return { priceNote: product.priceNote, supporting };
}

export function getVariantPresentation(product: Product): VariantPresentation {
  switch (product.kind) {
    case 'ranking': return rankingCard(product);
    case 'flash-sale': return flashSaleCard(product);
    case 'search': return searchCard(product);
  }
}
