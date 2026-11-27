import { useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { Product, YouTubeVideo } from './model.js';
import styles from './merchant-card.module.css';

function VideoDialog({ video, onClose }: { video: YouTubeVideo; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog ref={dialog} className={styles.videoDialog} aria-labelledby={titleId} onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
      <div className={styles.videoPanel}>
        <div className={styles.videoHeader}>
          <h2 id={titleId}>{video.title}</h2>
          <button type="button" onClick={() => dialog.current?.close()}>關閉影片</button>
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
      </div>
    </dialog>
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
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, images.length - 1);
  const multiple = images.length > 1;
  const [videoOpen, setVideoOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const suppressPlay = useRef(false);

  function step(direction: number) {
    setSelected(Math.max(0, Math.min(images.length - 1, index + direction)));
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!multiple || !event.isPrimary || event.button !== 0) return;
    suppressPlay.current = false;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };

    if (event.target instanceof Element && !event.target.closest('button')) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragOffset(0);
    }
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.current.x;
    if (!suppressPlay.current && Math.abs(distance) < Math.max(6, Math.abs(event.clientY - drag.current.y))) return;
    suppressPlay.current = true;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const width = event.currentTarget.clientWidth;
    const outgoing = (index === 0 && distance > 0) || (index === images.length - 1 && distance < 0);
    setDragOffset(outgoing ? 0 : Math.max(-width, Math.min(width, distance)));
  }

  function clearDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    setDragOffset(null);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.current.x;
    const threshold = Math.min(60, event.currentTarget.clientWidth * 0.18);
    if (suppressPlay.current && Math.abs(distance) >= threshold) step(distance < 0 ? 1 : -1);
    clearDrag(event);
  }

  return (
    <div className={styles.media}>
      <div className={styles.mediaFrame} data-carousel={multiple || undefined}
        onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
        onPointerCancel={clearDrag} onLostPointerCapture={(event) => {
          if (event.currentTarget === event.target) clearDrag(event);
        }}>
        <div className={styles.viewport}
          role={multiple ? 'group' : undefined} aria-label={multiple ? '商品照片輪播' : undefined}
          tabIndex={multiple ? 0 : undefined}
          onKeyDown={(event) => {
            if (!multiple || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
            event.preventDefault();
            step(event.key === 'ArrowLeft' ? -1 : 1);
          }}>
          <div className={styles.track} data-dragging={dragOffset !== null}
            style={{ transform: `translateX(calc(${-index * 100}% + ${dragOffset ?? 0}px))` }}>
            {images.map((src, position) => (
              <img key={`${position}:${src}`} src={src} alt="" width="580" height="580"
                draggable={false} loading={position === 0 ? undefined : 'lazy'} aria-hidden={position !== index}
                data-active={position === index} />
            ))}
          </div>
        </div>
        {children}
        {playableVideo && (
          <button type="button" className={styles.playButton} aria-label="播放商品影片" aria-haspopup="dialog"
            onClick={(event) => {
              if (!suppressPlay.current || event.detail === 0) setVideoOpen(true);
            }} />
        )}
      </div>
      {banner && <div className={styles.banner}>{banner}</div>}
      {multiple && (
        <div className={styles.dots} role="group" aria-label="選擇商品照片">
          <span className={styles.imageStatus} role="status">第 {index + 1} 張，共 {images.length} 張</span>
          {images.map((src, position) => (
            <button key={`${position}:${src}`} type="button" aria-label={`第 ${position + 1} 張照片`}
              aria-pressed={index === position} onClick={() => setSelected(position)} />
          ))}
        </div>
      )}
      {playableVideo && videoOpen && <VideoDialog video={playableVideo} onClose={() => setVideoOpen(false)} />}
    </div>
  );
}
