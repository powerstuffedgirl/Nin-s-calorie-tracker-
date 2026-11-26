import React, { useEffect, useRef, useState } from 'react';
import { GripHorizontal, Heart, Minimize2, Maximize2, RefreshCw, X } from 'lucide-react';
import { LAUREL_NOTES } from '../data/seedData';
import { clampBubblePosition } from '../utils/trackerLogic';

interface LaurelBubbleProps {
  dismissed: boolean;
  minimized: boolean;
  noteIndex: number;
  onNextNote: () => void;
  onToggleMinimize: () => void;
  onDismiss: () => void;
}

export const LaurelBubble: React.FC<LaurelBubbleProps> = ({
  dismissed,
  minimized,
  noteIndex,
  onNextNote,
  onToggleMinimize,
  onDismiss,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const note = LAUREL_NOTES[noteIndex % LAUREL_NOTES.length];

  const [mobileOverrideExpanded, setMobileOverrideExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Clamp position safely on viewport resize and track mobile width
  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768);
      if (!position || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition((prev) =>
        prev
          ? clampBubblePosition(
              prev.x,
              prev.y,
              rect.width,
              rect.height,
              window.innerWidth,
              window.innerHeight,
              12
            )
          : null
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  if (dismissed) return null;

  const effectiveMinimized = minimized || (isMobileViewport && !mobileOverrideExpanded);

  const handleToggleMin = () => {
    if (isMobileViewport && !minimized) {
      setMobileOverrideExpanded((prev) => !prev);
      return;
    }
    onToggleMinimize();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = {
      dx: e.clientX - rect.left,
      dy: e.clientY - rect.top,
    };
    setPosition({ x: rect.left, y: rect.top });
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragOffset.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nextX = e.clientX - dragOffset.current.dx;
    const nextY = e.clientY - dragOffset.current.dy;
    const clamped = clampBubblePosition(
      nextX,
      nextY,
      rect.width,
      rect.height,
      window.innerWidth,
      window.innerHeight,
      12
    );
    setPosition(clamped);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    dragOffset.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const stylePos: React.CSSProperties = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        bottom: 'auto',
        transform: 'translate3d(0, 0, 0)',
      }
    : {
        transform: 'translate3d(0, 0, 0)',
      };

  return (
    <aside
      ref={containerRef}
      aria-label="Message from Laurel"
      data-testid="laurel-bubble"
      style={stylePos}
      className={`glass-panel-strong fixed z-40 transition-shadow ${
        position ? '' : 'right-3 bottom-[4.5rem] md:right-5 md:bottom-5'
      } ${effectiveMinimized ? 'w-auto rounded-full' : 'w-[min(88vw,18.5rem)] rounded-3xl'} ${
        dragging ? 'shadow-2xl select-none' : ''
      }`}
    >
      {effectiveMinimized ? (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center gap-2 py-1.5 pr-1.5 pl-3.5 cursor-grab active:cursor-grabbing touch-none"
        >
          <Heart className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--ink-primary)' }}>
            Message from Laurel
          </span>
          <button
            type="button"
            onClick={handleToggleMin}
            aria-label="Expand Message from Laurel"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            style={{ color: 'var(--ink-secondary)' }}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss Message from Laurel"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            style={{ color: 'var(--ink-muted)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-3.5">
          {/* Drag header */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="mb-2 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
              >
                <Heart className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p
                  className="font-display truncate text-xs font-bold"
                  style={{ color: 'var(--ink-primary)' }}
                >
                  Message from Laurel
                </p>
                <p className="truncate text-[11px] whitespace-nowrap" style={{ color: 'var(--ink-muted)' }}>
                  {note.category} · Drag
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <span className="mr-0.5 opacity-40" aria-hidden="true">
                <GripHorizontal className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={handleToggleMin}
                aria-label="Minimize Message from Laurel"
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                style={{ color: 'var(--ink-secondary)' }}
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss Message from Laurel"
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                style={{ color: 'var(--ink-muted)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--ink-primary)' }}
          >
            {note.text}
          </p>

          <div
            className="mt-3 flex items-center justify-between border-t pt-2.5"
            style={{ borderColor: 'var(--divider-hairline)' }}
          >
            <span className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
              {(noteIndex % LAUREL_NOTES.length) + 1} / {LAUREL_NOTES.length}
            </span>
            <button
              type="button"
              onClick={onNextNote}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer whitespace-nowrap"
              style={{ color: 'var(--accent-primary)' }}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Next note
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
