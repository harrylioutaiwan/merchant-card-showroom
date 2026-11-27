import { useEffect, useLayoutEffect, useRef, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { catalog } from './catalog.js';
import { ProductCard, type CardAction } from './ProductCard.js';
import { defaultSettings, displayFields, type DisplaySettings, type Product } from './model.js';
import { cardHref, parseRoute, presets, type Preset } from './registry.js';
import { readSettings, writeSettings } from './settings.js';
import styles from './showroom.module.css';

type SettingsMap = Record<string, DisplaySettings>;
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

function Gallery({ settings, navigate }: { settings: SettingsMap; navigate: Navigate }) {
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
                return (
                  <li key={product.id}>
                    <ProductCard
                      product={product}
                      layout={preset.layout}
                      display={settings[product.id]}
                      onAction={(action) => setNotice(`已觸發「${actionLabels[action]}」示意事件。`)}
                    />
                    <RouteLink
                      navigate={navigate}
                      href={cardHref(product.id, preset.layout)}
                      className={styles.editLink}
                      aria-label={`編輯${preset.title}：${product.name}`}
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

function CardEditor({ product, preset, settings, status, save }: {
  product: Product;
  preset: Preset;
  settings: DisplaySettings;
  status: string;
  save: (settings: DisplaySettings, reset?: boolean) => void;
}) {
  const [width, setWidth] = useState<string>(preset.layout === 'list' ? 'auto' : '320');
  const [notice, setNotice] = useState('');
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

  return (
    <div className={styles.editor}>
      <section className={styles.preview} aria-labelledby="preview-title">
        <h1 id="preview-title">{preset.title}</h1>
        <p className={styles.description}>{preset.description}</p>
        <div className={styles.previewFrame}>
          <div className={styles.previewCard} style={{ width: width === 'auto' ? '100%' : `min(100%, ${width}px)` }}>
            <ProductCard
              product={product}
              layout={preset.layout}
              display={settings}
              onAction={(action) => setNotice(`已觸發「${actionLabels[action]}」示意事件。`)}
            />
          </div>
        </div>
        <div className={styles.viewportControls}>
          <label htmlFor="preview-width">最大預覽寬度</label>
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
        <h2 id="settings-title">展示設定</h2>
        <p className={styles.description}>選擇卡片要顯示的區塊。設定會套用至這個商品的各種版型。</p>
        <form onSubmit={(event) => event.preventDefault()}>
          <fieldset className={styles.displayFields}>
            <legend>顯示選項</legend>
            {displayFields.filter(({ key }) => applicableFields[key]).map(({ key, label }) => (
              <label className={styles.settingRow} key={key}>
                <span>{label}</span>
                <input type="checkbox" role="switch" checked={settings[key]} onChange={(event) =>
                  save({ ...settings, [key]: event.target.checked })
                } />
              </label>
            ))}
          </fieldset>
          <div className={styles.settingsFooter}>
            <p role="status">{status || '變更後自動儲存'}</p>
            <button type="button" onClick={() => save({ ...defaultSettings }, true)}>重設設定</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const headerRef = useRef<HTMLElement>(null);
  const [search, setSearch] = useState(window.location.search);
  const [settings, setSettings] = useState<SettingsMap>(() =>
    Object.fromEntries(catalog.map(({ id }) => [id, readSettings(id)])),
  );
  const [status, setStatus] = useState<SaveStatus>({});
  const route = parseRoute(search);
  const activeView = route.type === 'card' ? route.preset.key : route.type === 'overview' ? 'all' : '';

  useLayoutEffect(() => {
    const header = headerRef.current;
    const workbenchRoot = header?.parentElement;
    if (!header || !workbenchRoot) return;

    const updateHeaderHeight = () => {
      workbenchRoot.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    };

    updateHeaderHeight();
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(header);
    return () => resizeObserver.disconnect();
  }, []);

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

  function save(id: string, display: DisplaySettings, reset: boolean | undefined) {
    const stored = writeSettings(id, display);
    setSettings((current) => ({ ...current, [id]: display }));
    setStatus((current) => ({
      ...current,
      [id]: stored ? (reset ? '已恢復並儲存預設值' : '已儲存至此瀏覽器') : '無法儲存，變更僅保留於本次工作階段。',
    }));
  }

  return (
    <>
      <header ref={headerRef} className={styles.header}>
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
          {route.type === 'overview' && <Gallery settings={settings} navigate={navigate} />}
          {route.type === 'card' && (
            <CardEditor key={`${route.product.id}:${route.preset.key}`} product={route.product} preset={route.preset}
              settings={settings[route.product.id]} status={status[route.product.id]}
              save={(display, reset) => save(route.product.id, display, reset)} />
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
