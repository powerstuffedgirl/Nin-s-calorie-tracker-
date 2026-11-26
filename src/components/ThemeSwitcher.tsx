import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, CloudLightning, Moon, Shirt, Sparkles, UtensilsCrossed } from 'lucide-react';
import { ThemeId } from '../types/tracker';

interface ThemeSwitcherProps {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
}

const THEMES: {
  id: ThemeId;
  label: string;
  swatch: string;
  iconColor: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'unicorn',
    label: 'Unicorn & Crystals theme',
    swatch: 'linear-gradient(135deg, #fbcfe8, #fef3c7)',
    iconColor: 'rgba(15, 23, 42, 0.78)',
    icon: Sparkles,
  },
  {
    id: 'thunder',
    label: 'Thunderclouds & Rainbows theme',
    swatch: 'linear-gradient(135deg, #fef08a, #bfdbfe)',
    iconColor: 'rgba(15, 23, 42, 0.78)',
    icon: CloudLightning,
  },
  {
    id: 'soup',
    label: 'Tomatoes & Soup Bowl theme',
    swatch: 'linear-gradient(135deg, #fca5a5, #fed7aa)',
    iconColor: 'rgba(15, 23, 42, 0.78)',
    icon: UtensilsCrossed,
  },
  {
    id: 'copper',
    label: 'Cozy Knits & Copper theme',
    swatch: 'linear-gradient(135deg, #f6c4a0, #c8764b)',
    iconColor: 'rgba(15, 23, 42, 0.78)',
    icon: Shirt,
  },
  {
    id: 'dark',
    label: 'Midnight Dark theme',
    swatch: 'linear-gradient(135deg, #1e1b4b, #3b0764)',
    iconColor: '#fde68a',
    icon: Moon,
  },
];

function TulipSymbolSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Stem & delicate leaves */}
      <path
        d="M14 16.5 V25.5"
        stroke="#15803d"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 23.5 C10.5 23, 8.2 20.8, 8 18.2 C10.8 18.6, 12.8 20.5, 14 23.5 Z"
        fill="#86efac"
        fillOpacity="0.72"
        stroke="#15803d"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M14 23.5 C17.5 23, 19.8 20.8, 20 18.2 C17.2 18.6, 15.2 20.5, 14 23.5 Z"
        fill="#86efac"
        fillOpacity="0.72"
        stroke="#15803d"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Tulip bloom petals tinted by active theme accent */}
      <path
        d="M14 16.8 C9.2 16.8, 7.2 13, 8.2 7.2 C10.2 8.4, 11.4 9.6, 12 10.6 C12.4 7.4, 13.2 5, 14 3.5 C14.8 5, 15.6 7.4, 16 10.6 C16.6 9.6, 17.8 8.4, 19.8 7.2 C20.8 13, 18.8 16.8, 14 16.8 Z"
        fill="var(--accent-primary)"
        fillOpacity="0.82"
        stroke="var(--accent-primary)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Soft luminous petal highlight */}
      <path
        d="M12.2 14.2 C10.6 13.2, 10 11.4, 10.2 9.4"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme menu (${activeTheme.label})`}
        title={`Theme: ${activeTheme.label}`}
        className="glass-panel inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        <TulipSymbolSvg className="h-6 w-6 shrink-0" />
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--ink-secondary)' }}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme options"
          className="glass-panel-strong absolute top-full left-0 z-40 mt-2 flex items-center gap-1.5 rounded-2xl p-1.5 shadow-xl"
        >
          {THEMES.map((item) => {
            const active = theme === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                aria-label={item.label}
                title={item.label}
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer ${
                  active ? 'scale-105 shadow-sm' : 'opacity-80 hover:opacity-100 hover:bg-white/50 dark:hover:bg-white/10'
                }`}
                style={{
                  background: active ? 'var(--surface-block-active)' : 'transparent',
                  outline: active ? '2px solid var(--accent-primary)' : 'none',
                  outlineOffset: '-1px',
                }}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-black/15 dark:border-white/20"
                  style={{ background: item.swatch, color: item.iconColor }}
                  aria-hidden="true"
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
