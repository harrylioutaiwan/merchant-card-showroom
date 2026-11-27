import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { catalog } from './catalog.js';
import { ProductCard, type CardAction } from './ProductCard.js';
import { applyOverrides, displayFields, type CardConfiguration, type Product, type ProductOverrides } from './model.js';
import { cardHref, parseRoute, presets, type Preset } from './registry.js';
import { createDefaults, maxPrice, readConfig, writeConfig } from './settings.js';
import styles from './showroom.module.css';

type ConfigurationMap = Record<string, CardConfiguration>;
type SaveStatus = Record<string, string>;
type Navigate = (href: string) => void;

const actionLabels: Record<CardAction, string> = {
  favorite: '加入追蹤',
  cart: '放入購物車',
  purchase: '搶購',
};

function RouteLink({ navigate, href = './', ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { navigate: Navigate }) {
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  }
  return <a href={href} onClick={follow} {...props} />;
}

function Gallery({ configurations, navigate }: { configurations: ConfigurationMap; navigate: Navigate }) {
  const [notice, setNotice] = useState('');

  return (
    <section className={styles.overview}>
      <div className={styles.intro}>
        <h1>所有卡片</h1>
        <p>依 momo 官網截圖整理的四種卡片呈現方式。選擇卡片以查看與調整展示細節。</p>
      </div>
      <p className={styles.galleryNotice} role="status">{notice}</p>
      <div className={styles.groups}>
        {presets.map((preset) => (
          <section className={styles.group} data-preset={preset.key} key={preset.key} aria-labelledby={preset.key}>
            <h2 id={preset.key}>{preset.title}</h2>
            <p>{preset.description}</p>
            <ul className={styles.cards}>
              {catalog.filter(({ kind }) => kind === preset.kind).map((product) => {
                const config = configurations[product.id];
                const effective = applyOverrides(product, config.overrides);
                return (
                  <li key={product.id}>
                    <ProductCard
                      product={effective}
                      layout={preset.layout}
                      display={config.settings}
                      onAction={(action) => setNotice(`已觸發「${actionLabels[action]}」示意事件。`)}
                    />
                    <RouteLink
                      navigate={navigate}
                      href={cardHref(product.id, preset.layout)}
                      className={styles.editLink}
                      aria-label={`編輯${preset.title}：${effective.name}`}
                    >編輯商品卡</RouteLink>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function CardEditor({ product, preset, config, status, save }: {
  product: Product;
  preset: Preset;
  config: CardConfiguration;
  status: string;
  save: (config: CardConfiguration, reset?: boolean) => void;
}) {
  const [width, setWidth] = useState<string>(preset.layout === 'list' ? 'auto' : '320');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<{ name?: string; price?: string }>({});
  const effective = applyOverrides(product, config.overrides);
  const name = draft.name ?? effective.name;
  const price = draft.price ?? String(effective.price.amount);
  const amount = Number(price);
  const nameInvalid = !name.trim();
  const priceInvalid = !/^\d+$/.test(price) || !Number.isSafeInteger(amount) || amount > maxPrice;
  const applicableFields = {
    showOriginalPrice: product.price.original !== undefined,
    showPromotion: true,
    showRating: Boolean(product.rating),
    showRank: product.kind === 'ranking',
    showSold: 'sold' in product && Boolean(product.sold),
    showStock: product.kind === 'flash-sale',
    showShipping: product.kind === 'search' && Boolean(product.shipping),
    showTags: product.kind === 'search' && product.tags.length > 0,
  };

  function updateOverrides(values: ProductOverrides) {
    save({ ...config, overrides: { ...config.overrides, ...values } });
  }

  return (
    <div className={styles.editor}>
      <section className={styles.preview} aria-labelledby="preview-title">
        <h1 id="preview-title">{preset.title}</h1>
        <p className={styles.description}>{preset.description}</p>
        <div className={styles.previewFrame}>
          <div className={styles.previewCard} style={{ width: width === 'auto' ? '100%' : `${width}px` }}>
            <ProductCard
              product={effective}
              layout={preset.layout}
              display={config.settings}
              onAction={(action) => setNotice(`已觸發「${actionLabels[action]}」示意事件。`)}
            />
          </div>
        </div>
        <div className={styles.viewportControls}>
          <label htmlFor="preview-width">預覽寬度</label>
          <select id="preview-width" value={width} onChange={(event) => setWidth(event.target.value)}>
            <option value="240">240 px</option>
            <option value="320">320 px</option>
            <option value="480">480 px</option>
            <option value="640">640 px</option>
            <option value="auto">填滿預覽區</option>
          </select>
        </div>
        <p className={styles.actionNotice} role="status">{notice}</p>
      </section>
      <section className={styles.settings} aria-labelledby="settings-title">
        <h2 id="settings-title">設定</h2>
        <form onSubmit={(event) => event.preventDefault()}>
          <fieldset className={styles.productFields}>
            <legend>商品資料</legend>
            <label htmlFor="product-name">商品名稱</label>
            <input id="product-name" type="text" maxLength={100} required value={name}
              aria-invalid={nameInvalid}
              aria-describedby={nameInvalid ? 'product-error' : undefined}
              onChange={(event) => {
                const input = event.target.value;
                setDraft({ ...draft, name: input });
                const value = input.trim();
                if (value && value.length <= 100) updateOverrides({ name: value === product.name ? undefined : value });
              }} />
            <label htmlFor="product-price">售價（新臺幣）</label>
            <input id="product-price" type="text" inputMode="numeric" maxLength={8} required value={price}
              aria-invalid={priceInvalid}
              aria-describedby={priceInvalid ? 'product-error' : undefined}
              onChange={(event) => {
                const input = event.target.value;
                setDraft({ ...draft, price: input });
                const value = Number(input);
                if (/^\d+$/.test(input) && Number.isSafeInteger(value) && value <= maxPrice) {
                  updateOverrides({ price: value === product.price.amount ? undefined : value });
                }
              }} />
            <label htmlFor="product-promotion">促銷文案</label>
            <input id="product-promotion" type="text" maxLength={80}
              value={config.overrides.promotion ?? product.promotion ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                updateOverrides({ promotion: value === (product.promotion ?? '') ? undefined : value });
              }} />
            {(nameInvalid || priceInvalid) && (
              <p id="product-error" className={styles.error} role="status">
                {nameInvalid ? '請輸入商品名稱。' : '請輸入有效的非負整數金額。'}
              </p>
            )}
          </fieldset>
          <fieldset className={styles.displayFields}>
            <legend>顯示選項</legend>
            {displayFields.filter(({ key }) => applicableFields[key]).map(({ key, label }) => (
              <label className={styles.settingRow} key={key}>
                <span>{label}</span>
                <input type="checkbox" role="switch" checked={config.settings[key]} onChange={(event) =>
                  save({ ...config, settings: { ...config.settings, [key]: event.target.checked } })
                } />
              </label>
            ))}
          </fieldset>
          <div className={styles.settingsFooter}>
            <p role="status">{status || '變更後自動儲存'}</p>
            <button type="button" onClick={() => {
              setDraft({});
              save(createDefaults(), true);
            }}>重設設定</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [search, setSearch] = useState(window.location.search);
  const [configurations, setConfigurations] = useState<ConfigurationMap>(() =>
    Object.fromEntries(catalog.map(({ id }) => [id, readConfig(id)])),
  );
  const [status, setStatus] = useState<SaveStatus>({});
  const route = parseRoute(search);
  const activeView = route.type === 'card' ? route.preset.key : route.type === 'overview' ? 'all' : '';

  useEffect(() => {
    const onPop = () => setSearch(window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const title = route.type === 'card' ? route.preset.title : route.type === 'missing' ? '找不到這張商品卡' : '所有卡片';
    document.title = `${title} · Merchant Card Showroom`;
  }, [route.type, activeView]);

  function navigate(href: string) {
    const next = new URL(href, window.location.href);
    if (next.search === window.location.search) return;
    window.history.pushState(null, '', next);
    setSearch(next.search);
    window.scrollTo(0, 0);
  }

  function save(id: string, config: CardConfiguration, reset: boolean | undefined) {
    const stored = writeConfig(id, config);
    setConfigurations((current) => ({ ...current, [id]: config }));
    setStatus((current) => ({
      ...current,
      [id]: stored ? (reset ? '已恢復並儲存預設值' : '已儲存至此瀏覽器') : '無法儲存，變更僅保留於本次工作階段。',
    }));
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <RouteLink navigate={navigate} href="./" className={styles.wordmark}>Merchant Card Showroom</RouteLink>
          <p>momo 商品卡研究</p>
        </div>
        <a className={styles.guide} href="./sample.html">整合指南</a>
      </header>
      <div className={styles.workbench}>
        <aside className={styles.sidebar}>
          <nav aria-label="Showroom">
            <h2>Showroom</h2>
            <RouteLink navigate={navigate} href="./" aria-current={activeView === 'all' ? 'page' : undefined}>所有卡片</RouteLink>
            {presets.map((preset) => (
              <RouteLink key={preset.key} navigate={navigate} href={cardHref(preset.productId, preset.layout)}
                aria-current={activeView === preset.key ? 'page' : undefined}>{preset.title}</RouteLink>
            ))}
            <h2>文件</h2>
            <a href="./sample.html#card-schema">卡片資料結構</a>
            <a href="./sample.html">HTML 嵌入範例</a>
          </nav>
        </aside>
        <main className={styles.main}>
          {route.type === 'overview' && <Gallery configurations={configurations} navigate={navigate} />}
          {route.type === 'card' && (
            <CardEditor key={`${route.product.id}:${route.preset.key}`} product={route.product} preset={route.preset}
              config={configurations[route.product.id]} status={status[route.product.id]}
              save={(config, reset) => save(route.product.id, config, reset)} />
          )}
          {route.type === 'missing' && (
            <section className={styles.overview}>
              <h1>找不到這張商品卡</h1>
              <RouteLink navigate={navigate} href="./">返回所有卡片</RouteLink>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

createRoot(document.querySelector('#app')!).render(<App />);
