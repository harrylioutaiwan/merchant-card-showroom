import { createRoot } from 'react-dom/client';
import { ProductCard, type ProductCardProps } from './ProductCard.js';
import { ShowroomTheme } from './theme.js';

export function mountMerchantCard(container: HTMLElement, props: ProductCardProps): () => void {
  const root = createRoot(container);
  root.render(<ShowroomTheme><ProductCard {...props} /></ShowroomTheme>);
  return () => root.unmount();
}
