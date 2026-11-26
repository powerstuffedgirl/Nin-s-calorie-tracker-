import React from 'react';

interface OrbitingUnicornBrandProps {
  onClick?: () => void;
  size?: 'header' | 'hero';
}

export const OrbitingUnicornBrand: React.FC<OrbitingUnicornBrandProps> = ({
  onClick,
  size = 'header',
}) => {
  const isHero = size === 'hero';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Nin's Calorie Tracker — Go to Home"
      className="group relative inline-flex items-center justify-center rounded-2xl px-4 py-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
      style={{ outlineColor: 'var(--accent-primary)' }}
    >
      {/* Subtle tilted crayon orbital path around "Nin" */}
      <svg
        viewBox="0 0 110 52"
        className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${
          isHero ? 'scale-125' : ''
        }`}
        aria-hidden="true"
      >
        <ellipse
          cx="55"
          cy="26"
          rx="46"
          ry="18"
          transform="rotate(-8 55 26)"
          fill="none"
          stroke="var(--accent-primary)"
          strokeOpacity="0.32"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Brand Wordmark */}
      <span
        data-testid="nin-brand-title"
        className={`font-display relative z-10 font-bold tracking-tight transition-transform duration-200 group-hover:scale-105 ${
          isHero ? 'text-4xl' : 'text-2xl'
        }`}
        style={{ color: 'var(--brand-title)' }}
      >
        Nin
      </span>

      {/* Running / Orbiting Pastel Crayon Unicorn */}
      <span
        className="animate-unicorn-orbit pointer-events-none absolute flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 34"
          className={`animate-unicorn-gallop ${isHero ? 'h-9 w-10' : 'h-6 w-7'}`}
          fill="none"
        >
          {/* Tail */}
          <path
            d="M8 18 C3 16, 2 22, 6 24"
            stroke="#ec4899"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Body */}
          <path
            d="M10 18 C13 13, 21 13, 24 15 C26 11, 29 9, 32 10 C35 11, 34 15, 31 16 C29 17, 28 19, 27 21 C24 23, 14 23, 10 18 Z"
            fill="#ffffff"
            stroke="var(--accent-primary)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Mane */}
          <path
            d="M24 11 C21 9, 20 13, 22 15"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Golden Horn */}
          <path
            d="M31 10 L37 4 L33 12 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          {/* Galloping legs */}
          <path d="M13 22 L10 29" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 22 L19 29" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M24 22 L28 28" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M26 20 L32 24" stroke="var(--accent-primary)" strokeWidth="1.8" strokeLinecap="round" />
          {/* Tiny eye */}
          <circle cx="30.5" cy="13" r="0.9" fill="#2d1b26" />
        </svg>
      </span>
    </button>
  );
};
