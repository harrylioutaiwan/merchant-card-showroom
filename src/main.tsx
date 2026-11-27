import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import Link from '@mui/material/Link';
import NativeSelect from '@mui/material/NativeSelect';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useLayoutEffect, useRef, useState, type AnchorHTMLAttributes, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { catalog } from './catalog.js';
import { ProductCard, type CardAction } from './ProductCard.js';
import { defaultSettings, displayFields, type DisplaySettings, type Layout, type Product } from './model.js';
import { cardHref, parseRoute, presets, type Preset } from './registry.js';
import { readSettings, settingsKey, writeSettings } from './settings.js';
import styles from './showroom.module.css';
import { ShowroomTheme } from './theme.js';

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
  return <Link underline="none" href={href} onClick={follow} {...props} />;
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
        {presets.map((preset) => {
          const product = catalog.find(({ id }) => id === preset.productId);
          if (!product) return null;
          return (
            <Paper component="section" variant="outlined" className={styles.group} data-preset={preset.key} key={preset.key} aria-labelledby={preset.key}>
              <h2 id={preset.key}>{preset.title}</h2>
              <p>{preset.description}</p>
              <div className={styles.galleryCard}>
                <ProductCard
                  product={product}
                  layout={preset.layout}
                  display={settings[settingsKey(product.id, preset.layout)]}
                  onAction={(action) => setNotice(`已觸發「${actionLabels[action]}」示意事件。`)}
                />
                <RouteLink
                  navigate={navigate}
                  href={cardHref(product.id, preset.layout)}
                  className={styles.editLink}
                  aria-label={`編輯${preset.title}：${product.name}`}
                >編輯商品卡</RouteLink>
              </div>
            </Paper>
          );
        })}
      </div>
    </section>
  );
}

function CardEditor({ product, preset, settings, status, save, navigate }: {
  product: Product;
  preset: Preset;
  settings: DisplaySettings;
  status: string;
  save: (settings: DisplaySettings, reset?: boolean) => void;
  navigate: Navigate;
}) {
  const [width, setWidth] = useState<string>(preset.previewWidth);
  const [notice, setNotice] = useState('');
  const applicableFields = {
    showCarousel: Boolean(product.media?.additionalImages?.length),
    showVideo: Boolean(product.media?.video),
    showOriginalPrice: product.price.original !== undefined,
    showPromotion: true,
    showRating: Boolean(product.rating),
    showRank: product.kind === 'ranking',
    showSold: 'sold' in product && Boolean(product.sold),
    showStock: product.kind === 'flash-sale',
    showShipping: product.kind === 'search' && Boolean(product.shipping),
    showTags: product.kind === 'search' && product.tags.length > 0,
  };
  const hiddenMedia = [
    applicableFields.showCarousel && !settings.showCarousel ? '照片輪播' : '',
    applicableFields.showVideo && !settings.showVideo ? '影片入口' : '',
  ].filter(Boolean);

  return (
    <div className={styles.editor}>
      <section className={styles.preview} aria-labelledby="preview-title">
        <RouteLink className={styles.editorBack} navigate={navigate} href="./">
          <span aria-hidden="true">←</span> 返回所有卡片
        </RouteLink>
        <h1 id="preview-title">{preset.title}</h1>
        <p className={styles.description}>{preset.description}</p>
        {hiddenMedia.length > 0 && (
          <p className={styles.description}>此版型已隱藏{hiddenMedia.join('與')}，可在展示設定開啟。</p>
        )}
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
          <FormLabel htmlFor="preview-width">最大預覽寬度</FormLabel>
          <NativeSelect input={<Input disableUnderline />} inputProps={{ id: 'preview-width' }} value={width} onChange={(event) => setWidth(event.target.value)}>
            <option value="240">240 px</option>
            <option value="320">320 px</option>
            <option value="480">480 px</option>
            <option value="640">640 px</option>
            <option value="auto">填滿預覽區</option>
          </NativeSelect>
        </div>
        <p className={styles.actionNotice} role="status">{notice}</p>
      </section>
      <section className={styles.settings} aria-labelledby="settings-title">
        <h2 id="settings-title">展示設定</h2>
        <p className={styles.description}>選擇這個版型要顯示的區塊。變更會儲存在此瀏覽器。</p>
        <form onSubmit={(event) => event.preventDefault()}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">顯示選項</FormLabel>
            {displayFields.filter(({ key }) => applicableFields[key]).map(({ key, label }) => (
              <FormControlLabel className={styles.settingRow} key={key} label={label} labelPlacement="start"
                control={<Switch size="small" checked={settings[key]} slotProps={{ input: { role: 'switch' } }}
                  onChange={(event) => save({ ...settings, [key]: event.target.checked })} />} />
            ))}
          </FormControl>
          <div className={styles.settingsFooter}>
            <p role="status">{status || '變更後自動儲存'}</p>
            <Button type="button" onClick={() => save({ ...defaultSettings }, true)}>重設設定</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const headerRef = useRef<HTMLElement>(null);
  const [typesOpen, setTypesOpen] = useState(true);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [search, setSearch] = useState(window.location.search);
  const [settings, setSettings] = useState<SettingsMap>(() =>
    Object.fromEntries(catalog.flatMap((product) =>
      presets.filter(({ kind }) => kind === product.kind).map(({ layout }) =>
        [settingsKey(product.id, layout), readSettings(product.id, layout)] as const,
      ),
    )),
  );
  const [status, setStatus] = useState<SaveStatus>({});
  const route = parseRoute(search);
  const activeSettingsKey = route.type === 'card' ? settingsKey(route.product.id, route.preset.layout) : '';
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

  function save(id: string, layout: Layout, display: DisplaySettings, reset: boolean | undefined) {
    const key = settingsKey(id, layout);
    const stored = writeSettings(id, display, layout);
    setSettings((current) => ({ ...current, [key]: display }));
    setStatus((current) => ({
      ...current,
      [key]: stored ? (reset ? '已恢復並儲存預設值' : '已儲存至此瀏覽器') : '無法儲存，變更僅保留於本次工作階段。',
    }));
  }

  return (
    <>
      <header ref={headerRef} className={styles.header}>
        <div>
          <RouteLink navigate={navigate} href="./" className={styles.wordmark}>Merchant Card Showroom</RouteLink>
          <p>momo 商品卡研究</p>
        </div>
        <Link underline="none" className={styles.guide} href="./sample.html">整合指南</Link>
      </header>
      <div className={styles.workbench}>
        <aside className={styles.sidebar}>
          <nav aria-label="Showroom">
            <h2>Showroom</h2>
            <div className={styles.showroomSection}>
              <div className={styles.showroomRow}>
                <RouteLink navigate={navigate} href="./" aria-current={activeView === 'all' ? 'page' : undefined}>所有卡片</RouteLink>
                <IconButton className={styles.showroomToggle} size="small"
                  aria-expanded={typesOpen} aria-controls="card-type-links"
                  onClick={() => setTypesOpen((open) => !open)}
                  aria-label={typesOpen ? '收合商品卡類型' : '展開商品卡類型'}>
                  <span aria-hidden="true" />
                </IconButton>
              </div>
              <Collapse id="card-type-links" in={typesOpen} timeout={reduceMotion ? 0 : 160}>
                <ul className={styles.showroomLinks} aria-label="商品卡類型">
                  {presets.map((preset) => (
                    <li key={preset.key}>
                      <RouteLink navigate={navigate} href={cardHref(preset.productId, preset.layout)}
                        aria-current={activeView === preset.key ? 'page' : undefined}>{preset.title}</RouteLink>
                    </li>
                  ))}
                </ul>
              </Collapse>
            </div>
            <h2>文件</h2>
            <Link underline="none" href="./sample.html#card-schema">卡片資料結構</Link>
            <Link underline="none" href="./sample.html">HTML 嵌入範例</Link>
          </nav>
        </aside>
        <main className={styles.main}>
          {route.type === 'overview' && <Gallery settings={settings} navigate={navigate} />}
          {route.type === 'card' && (
            <CardEditor key={`${route.product.id}:${route.preset.key}`} product={route.product} preset={route.preset}
              settings={settings[activeSettingsKey]} status={status[activeSettingsKey]} navigate={navigate}
              save={(display, reset) => save(route.product.id, route.preset.layout, display, reset)} />
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

createRoot(document.querySelector('#app')!).render(<ShowroomTheme><App /></ShowroomTheme>);
