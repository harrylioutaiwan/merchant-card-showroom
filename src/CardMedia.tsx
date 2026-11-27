import * as Dialog from '@radix-ui/react-dialog';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useState, type ReactNode } from 'react';
import type { Product, YouTubeVideo } from './model.js';
import styles from './merchant-card.module.css';

function CardVideo({ video }: { video: YouTubeVideo }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={styles.playButton} aria-label="播放商品影片" />
      <Dialog.Portal>
        <Dialog.Overlay className={styles.videoOverlay} />
        <Dialog.Content className={styles.videoDialog} aria-describedby={undefined}>
          <div className={styles.videoHeader}>
            <Dialog.Title>{video.title}</Dialog.Title>
            <Dialog.Close>關閉影片</Dialog.Close>
          </div>
          <iframe
            className={styles.videoFrame}
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <a className={styles.videoLink} href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank" rel="noreferrer">在 YouTube 上觀看</a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CardMedia({ product, banner, children, showCarousel, showVideo }: {
  product: Product;
  banner?: string;
  showCarousel: boolean;
  showVideo: boolean;
  children?: ReactNode;
}) {
  const images = [product.imageUrl, ...(showCarousel ? product.media?.additionalImages ?? [] : [])];
  const video = showVideo ? product.media?.video : undefined;
  const playableVideo = video && /^[A-Za-z0-9_-]{11}$/.test(video.id) ? video : undefined;
  const multiple = images.length > 1;
  const [viewportRef, carousel] = useEmblaCarousel({
    watchFocus: false,
    breakpoints: { '(prefers-reduced-motion: reduce)': { duration: 0 } },
  });
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, images.length - 1);

  useEffect(() => {
    if (!carousel) return;
    const syncSelection = () => setSelected(carousel.selectedScrollSnap());
    syncSelection();
    carousel.on('select', syncSelection).on('reInit', syncSelection);
    return () => {
      carousel.off('select', syncSelection).off('reInit', syncSelection);
    };
  }, [carousel]);

  return (
    <div className={styles.media}>
      <div className={styles.mediaFrame} data-carousel={multiple || undefined}>
        <div className={styles.viewport} ref={multiple ? viewportRef : undefined}
          role={multiple ? 'group' : undefined} aria-label={multiple ? '商品照片輪播' : undefined}
          tabIndex={multiple ? 0 : undefined}
          onKeyDown={(event) => {
            // Direction keys navigate focused media. Interactive overlays handle their own keys.
            if (event.target !== event.currentTarget || !carousel ||
              (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
            event.preventDefault();
            if (event.key === 'ArrowLeft') carousel.scrollPrev();
            else carousel.scrollNext();
          }}>
          <div className={styles.track}>
            {images.map((src, position) => (
              <img key={`${position}:${src}`} src={src} alt="" width="580" height="580"
                draggable={false} loading={position === 0 ? undefined : 'lazy'} aria-hidden={position !== index}
                data-active={position === index} />
            ))}
          </div>
          {children}
          {playableVideo && <CardVideo video={playableVideo} />}
        </div>
      </div>
      {banner && <div className={styles.banner}>{banner}</div>}
      {multiple && (
        <div className={styles.dots} role="group" aria-label="選擇商品照片">
          <span className={styles.imageStatus} role="status">第 {index + 1} 張，共 {images.length} 張</span>
          {images.map((src, position) => (
            <button key={`${position}:${src}`} type="button" aria-label={`第 ${position + 1} 張照片`}
              aria-pressed={index === position} onClick={() => carousel?.scrollTo(position)} />
          ))}
        </div>
      )}
    </div>
  );
}
