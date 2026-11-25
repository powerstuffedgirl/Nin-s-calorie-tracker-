import React from 'react';
import { CloudLightning, Shirt, Sparkles, UtensilsCrossed } from 'lucide-react';
import { ThemeId } from '../types/tracker';

interface ThemeSwitcherProps {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
}

const THEMES: {
  id: ThemeId;
  label: string;
  swatch: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'unicorn',
    label: 'Unicorn & Crystals theme',
    swatch: 'linear-gradient(135deg, #fbcfe8, #fef3c7)',
    icon: Sparkles,
  },
  {
    id: 'thunder',
    label: 'Thunderclouds & Rainbows theme',
    swatch: 'linear-gradient(135deg, #fef08a, #bfdbfe)',
    icon: CloudLightning,
  },
  {
    id: 'soup',
    label: 'Tomatoes & Soup Bowl theme',
    swatch: 'linear-gradient(135deg, #fca5a5, #fed7aa)',
    icon: UtensilsCrossed,
  },
  {
    id: 'copper',
    label: 'Cozy Knits & Copper theme',
    swatch: 'linear-gradient(135deg, #f6c4a0, #c8764b)',
    icon: Shirt,
  },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onChange }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Theme switcher"
      className="glass-panel inline-flex items-center gap-1.5 rounded-2xl p-1.5"
    >
      {THEMES.map((item) => {
        const active = theme === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={item.label}
            title={item.label}
            onClick={() => onChange(item.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
              active ? 'scale-105 shadow-sm' : 'opacity-75 hover:opacity-100 hover:bg-white/40'
            }`}
            style={{
              background: active ? 'rgba(255,255,255,0.85)' : 'transparent',
              outline: active ? '2px solid var(--accent-primary)' : 'none',
              outlineOffset: '-1px',
            }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10"
              style={{ background: item.swatch }}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5 text-black/75" />
            </span>
          </button>
        );
      })}
    </div>
  );
};
