import { CardMedia } from './CardMedia.js';
import { getVariantPresentation } from './card-variants.js';
import { defaultSettings, formatPrice, type DisplayKey, type DisplaySettings, type Layout, type Product } from './model.js';
import styles from './merchant-card.module.css';

const supportingFields = {
  sold: 'showSold',
  shipping: 'showShipping',
  tag: 'showTags',
  stock: 'showStock',
} satisfies Record<string, DisplayKey>;

export type CardAction = 'favorite' | 'cart' | 'purchase';

export interface ProductCardProps {
  product: Product;
  layout?: Layout;
  display?: Partial<DisplaySettings>;
  onAction?: (action: CardAction) => void;
}

export function ProductCard({ product, layout = 'grid', display, onAction }: ProductCardProps) {
  const settings = { ...defaultSettings, ...display };
  const variant = getVariantPresentation(product);
  const isList = product.kind === 'search' && layout === 'list';
  const review = product.rating;
  const filled = review ? Math.round(Math.max(0, Math.min(5, review.score))) : 0;
  const hasActions = product.kind === 'flash-sale' || isList;
  const items = variant.supporting.filter(({ className }) => settings[supportingFields[className]]);

  return (
    <article className={styles.card} data-kind={product.kind} data-layout={isList ? 'list' : 'grid'}>
      <CardMedia key={product.id} product={product} showCarousel={settings.showCarousel} showVideo={settings.showVideo}
        banner={settings.showPromotion ? product.campaign : undefined}>
        {settings.showRank && variant.rank && (
          <span className={styles.rank} aria-label={variant.rank}>
            <span aria-hidden="true">TOP</span><strong aria-hidden="true">{product.kind === 'ranking' && product.rank}</strong>
          </span>
        )}
        {product.kind === 'search' && product.sponsored && <span className={styles.ad}>廣告</span>}
      </CardMedia>
      <div className={styles.body}>
        <div className={styles.title}>
          {settings.showPromotion && product.promotion && <p className={styles.promotion}>{product.promotion}</p>}
          <h2>{product.name}</h2>
        </div>
        <div className={styles.priceRow}>
          {variant.priceLabel && <span className={styles.priceLabel}>{variant.priceLabel}</span>}
          <strong className={styles.price}>{formatPrice(product.price.amount)}</strong>
          {settings.showOriginalPrice && product.price.original !== undefined && <del>{formatPrice(product.price.original)}</del>}
          {variant.priceNote && <span className={styles.priceNote}>{variant.priceNote}</span>}
        </div>
        {settings.showRating && review && (
          <p className={styles.rating} role="img" aria-label={`${review.score} 分，共 ${review.count} 則評價`}>
            <span aria-hidden="true" className={styles.stars}>{'★'.repeat(filled)}{'☆'.repeat(5 - filled)}</span>
            <span aria-hidden="true"> ({review.count.toLocaleString('zh-TW')})</span>
          </p>
        )}
        {items.length > 0 && (
          <div className={styles.supporting}>
            {items.map(({ className, text }) => <span className={styles[className]} key={`${className}:${text}`}>{text}</span>)}
          </div>
        )}
        {hasActions && onAction && (
          <div className={styles.actions} aria-label="商品操作示意">
            {isList ? (
              <>
                <button type="button" onClick={() => onAction('favorite')}>加入追蹤</button>
                <button className={styles.cart} type="button" onClick={() => onAction('cart')}>放入購物車</button>
              </>
            ) : (
              <button className={styles.purchase} type="button" onClick={() => onAction('purchase')}>搶購</button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
