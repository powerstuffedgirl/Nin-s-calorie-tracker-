import React, { useEffect, useMemo } from 'react';
import { Sparkles, X } from 'lucide-react';
import { MilestoneEvent, ThemeId } from '../types/tracker';

interface MilestoneCelebrationProps {
  milestone: MilestoneEvent | null;
  theme: ThemeId;
  onDismiss: () => void;
}

const THEME_CONFETTI: Record<ThemeId, string[]> = {
  unicorn: ['#ec4899', '#f472b6', '#c084fc', '#fbbf24', '#38bdf8'],
  thunder: ['#f59e0b', '#facc15', '#3b82f6', '#ec4899', '#10b981'],
  soup: ['#ef4444', '#fb7185', '#f59e0b', '#22c55e', '#fde047'],
};

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  theme,
  onDismiss,
}) => {
  useEffect(() => {
    if (!milestone) return;
    const timer = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timer);
  }, [milestone, onDismiss]);

  const particles = useMemo(() => {
    if (!milestone) return [];
    const palette = THEME_CONFETTI[theme];
    return Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2;
      const spread = 90 + (i % 5) * 42;
      const tx = Math.round(Math.cos(angle) * spread);
      const ty = Math.round(Math.sin(angle) * spread * 0.7 + 90);
      const rot = (i % 2 === 0 ? 1 : -1) * (180 + (i % 4) * 90);
      const left = 25 + ((i * 19) % 50);
      const top = 12 + ((i * 7) % 24);
      const shape = i % 3 === 0 ? 'sparkle' : i % 3 === 1 ? 'dot' : 'ribbon';
      return {
        key: `${milestone.id}-${i}`,
        color: palette[i % palette.length],
        tx: `${tx}px`,
        ty: `${ty}px`,
        rot: `${rot}deg`,
        left: `${left}%`,
        top: `${top}%`,
        delay: `${(i % 6) * 45}ms`,
        shape,
      };
    });
  }, [milestone, theme]);

  if (!milestone) return null;

  return (
    <>
      {/* Non-blocking sparkle & confetti burst */}
      <div
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        aria-hidden="true"
      >
        {particles.map((p) => (
          <span
            key={p.key}
            className="animate-confetti-piece absolute block"
            style={
              {
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                '--tx': p.tx,
                '--ty': p.ty,
                '--rot': p.rot,
              } as React.CSSProperties
            }
          >
            {p.shape === 'sparkle' ? (
              <svg viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="M10 1 L12 8 L19 10 L12 12 L10 19 L8 12 L1 10 L8 8 Z"
                  fill={p.color}
                />
              </svg>
            ) : p.shape === 'dot' ? (
              <span
                className="block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
            ) : (
              <span
                className="block h-3 w-1.5 rounded-sm"
                style={{ backgroundColor: p.color }}
              />
            )}
          </span>
        ))}
      </div>

      {/* Sleek frosted milestone toast */}
      <div
        role="status"
        aria-live="polite"
        data-testid="milestone-toast"
        className="glass-panel-strong fixed top-[4.75rem] right-4 z-50 flex w-[min(92vw,23rem)] items-start gap-3 rounded-2xl px-4 py-3 sm:right-6"
      >
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
            {milestone.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
            {milestone.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss milestone celebration"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5 cursor-pointer"
          style={{ color: 'var(--ink-muted)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};
