import { defaultSettings, formatPrice, type DisplaySettings, type Product } from './model.js';

const template = document.createElement('template');
template.innerHTML = `
  <link rel="stylesheet" href="${new URL('../card.css', import.meta.url).href}">
  <article>
    <div class="media">
      <img alt="" width="580" height="580">
      <span class="promotion" hidden></span>
    </div>
    <div class="body">
      <div class="info">
        <p class="category"></p>
        <h2></h2>
      </div>
      <div class="price-row">
        <span class="price"></span>
        <del hidden></del>
      </div>
      <p class="rating" hidden><span class="star" aria-hidden="true">★</span> <span class="review"></span></p>
    </div>
  </article>
`;

export class MerchantCard extends HTMLElement {
  private currentProduct?: Product;
  private currentSettings: DisplaySettings = { ...defaultSettings };
  private readonly root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.append(template.content.cloneNode(true));
  }

  connectedCallback(): void {
    // Preserve values assigned when a host creates the element before importing its module.
    this.upgradeProperty('product');
    this.upgradeProperty('settings');
    this.render();
  }

  get product(): Product | undefined {
    return this.currentProduct;
  }

  set product(product: Product | undefined) {
    this.currentProduct = product;
    this.render();
  }

  get settings(): DisplaySettings {
    return { ...this.currentSettings };
  }

  set settings(settings: Partial<DisplaySettings>) {
    this.currentSettings = { ...defaultSettings, ...settings };
    this.render();
  }

  private upgradeProperty(name: 'product' | 'settings'): void {
    const property = Object.getOwnPropertyDescriptor(this, name);
    if (!property) return;
    Reflect.deleteProperty(this, name);
    this[name] = property.value;
  }

  private render(): void {
    const article = this.root.querySelector('article')!;
    const product = this.currentProduct;
    article.hidden = !product;
    if (!product) return;

    const image = this.root.querySelector('img')!;
    if (image.getAttribute('src') !== product.imageUrl) image.src = product.imageUrl;
    this.root.querySelector('h2')!.textContent = product.name;
    this.root.querySelector('.category')!.textContent = product.category;

    const price = formatPrice(product.price.amount);
    this.root.querySelector('.price')!.textContent = product.price.kind === 'from' ? `${price} 起` : price;

    const promotion = this.root.querySelector<HTMLElement>('.promotion')!;
    promotion.hidden = !this.currentSettings.showPromotion || !product.promotion;
    promotion.textContent = product.promotion ?? '';

    const originalPrice = this.root.querySelector('del')!;
    const original = product.price.original;
    originalPrice.hidden = !this.currentSettings.showOriginalPrice || original === undefined;
    originalPrice.textContent = original === undefined ? '' : formatPrice(original);

    const review = this.root.querySelector<HTMLElement>('.rating')!;
    review.hidden = !this.currentSettings.showRating || !product.rating;
    this.root.querySelector('.review')!.textContent = product.rating
      ? `${product.rating.score.toFixed(1)}（${product.rating.count} 則評價）`
      : '';
  }
}

if (!customElements.get('merchant-card')) customElements.define('merchant-card', MerchantCard);

declare global {
  interface HTMLElementTagNameMap {
    'merchant-card': MerchantCard;
  }
}
