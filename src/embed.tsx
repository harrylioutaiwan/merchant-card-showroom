import { createRoot } from 'react-dom/client';
import { ProductCard, type ProductCardProps } from './ProductCard.js';

export function mountMerchantCard(container: HTMLElement, props: ProductCardProps): () => void {
  const root = createRoot(container);
  root.render(<ProductCard {...props} />);
  return () => root.unmount();
}
