import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
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
  const price = formatPrice(product.price.amount);
  const hasActions = product.kind === 'flash-sale' || isList;
  const items = variant.supporting.filter(({ className }) => settings[supportingFields[className]]);

  return (
    <Card component="article" variant="outlined" className={styles.card} data-kind={product.kind} data-layout={isList ? 'list' : 'grid'}>
      <CardMedia key={product.id} product={product} showCarousel={settings.showCarousel} showVideo={settings.showVideo}
        banner={settings.showPromotion ? product.campaign : undefined}>
        {settings.showRank && variant.rank && (
          <span className={styles.rank} role="img" aria-label={variant.rank}>
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
          <strong className={styles.price}><span className={styles.currency}>{price[0]}</span>{price.slice(1)}</strong>
          {settings.showOriginalPrice && product.price.original !== undefined && <del>{formatPrice(product.price.original)}</del>}
          {variant.priceNote && <span className={styles.priceNote}>{variant.priceNote}</span>}
        </div>
        {settings.showRating && review && (
          <div className={styles.rating} role="img" aria-label={`${review.score} 分，共 ${review.count} 則評價`}>
            <Rating aria-hidden="true" className={styles.stars} value={review.score} precision={0.5} size="small" readOnly />
            <span aria-hidden="true">({review.count.toLocaleString('zh-TW')})</span>
          </div>
        )}
        {items.length > 0 && (
          <div className={styles.supporting}>
            {items.map(({ className, text }) => {
              const key = `${className}:${text}`;
              if (className === 'sold') return <span className={styles.sold} key={key}>{text}</span>;
              const label = className === 'shipping'
                ? <><span className={styles.speedMark} aria-hidden="true">速</span><span>{text}</span></>
                : text;
              return <Chip className={styles[className]} key={key} label={label} size="small" />;
            })}
          </div>
        )}
        {hasActions && onAction && (
          <div className={styles.actions} aria-label="商品操作示意">
            {isList ? (
              <>
                <Button size="small" onClick={() => onAction('favorite')}>加入追蹤</Button>
                <Button className={styles.cart} size="small" onClick={() => onAction('cart')}>放入購物車</Button>
              </>
            ) : (
              <Button className={styles.purchase} size="small" onClick={() => onAction('purchase')}>搶購</Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
