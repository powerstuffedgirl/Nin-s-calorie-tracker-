import React from 'react';
import { ThemeId } from '../types/tracker';

interface DoodleBackgroundProps {
  theme: ThemeId;
}

function CrayonUnicornSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Pastel mane & tail */}
        <path
          d="M28 54 C14 50, 10 64, 18 72 C24 76, 30 68, 32 62"
          fill="#fbcfe8"
          stroke="#db2777"
          strokeWidth="2.5"
        />
        <path
          d="M72 30 C64 24, 58 34, 62 42"
          fill="#ddd6fe"
          stroke="#9333ea"
          strokeWidth="2.5"
        />
        {/* Body */}
        <path
          d="M32 54 C36 42, 62 42, 72 46 C78 36, 86 28, 96 32 C104 36, 102 46, 94 48 C88 50, 84 54, 82 62 C78 68, 42 68, 32 54 Z"
          fill="#fff5f9"
          stroke="#be185d"
          strokeWidth="2.6"
        />
        {/* Horn */}
        <path
          d="M93 30 L108 14 L98 34 Z"
          fill="#fde68a"
          stroke="#d97706"
          strokeWidth="2.2"
        />
        {/* Running legs */}
        <path d="M42 66 L34 84" stroke="#be185d" strokeWidth="2.8" />
        <path d="M52 67 L56 85" stroke="#be185d" strokeWidth="2.8" />
        <path d="M72 65 L82 83" stroke="#be185d" strokeWidth="2.8" />
        <path d="M80 61 L94 74" stroke="#be185d" strokeWidth="2.8" />
        {/* Eye & rosy cheek */}
        <circle cx="91" cy="39" r="1.8" fill="#831843" />
        <circle cx="95" cy="43" r="2.8" fill="#f9a8d4" opacity="0.7" />
      </g>
    </svg>
  );
}

function CrayonCrystalSvg({ className, tint = '#f9a8d4' }: { className?: string; tint?: string }) {
  return (
    <svg viewBox="0 0 80 100" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        <polygon
          points="40,8 64,34 56,88 24,88 16,34"
          fill={tint}
          fillOpacity="0.45"
          stroke="#be185d"
          strokeWidth="2.4"
        />
        <path d="M40 8 L36 38 L56 88" stroke="#be185d" strokeWidth="1.8" opacity="0.7" />
        <path d="M16 34 L36 38 L64 34" stroke="#be185d" strokeWidth="1.8" opacity="0.7" />
        <path d="M36 38 L24 88" stroke="#be185d" strokeWidth="1.8" opacity="0.6" />
        <path d="M68 18 L71 23 L76 26 L71 29 L68 34 L65 29 L60 26 L65 23 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

function CrayonSparkleSvg({ className, color = '#ec4899' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M24 4 L28 19 L43 24 L28 29 L24 44 L20 29 L5 24 L20 19 Z"
          fill={color}
          fillOpacity="0.28"
          stroke={color}
          strokeWidth="2.2"
        />
      </g>
    </svg>
  );
}

function CrayonThundercloudSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 110" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Cloud */}
        <path
          d="M28 60 C16 60, 12 46, 22 40 C20 26, 36 18, 48 26 C56 14, 78 14, 86 28 C100 26, 112 38, 106 52 C104 58, 96 60, 88 60 Z"
          fill="#e0f2fe"
          stroke="#1d4ed8"
          strokeWidth="2.6"
        />
        {/* Lightning bolt */}
        <path
          d="M64 56 L50 78 L64 78 L54 102 L78 72 L64 72 L74 56 Z"
          fill="#facc15"
          stroke="#a16207"
          strokeWidth="2.3"
        />
        {/* Raindrops */}
        <path d="M36 70 L32 80" stroke="#3b82f6" strokeWidth="2.4" />
        <path d="M90 70 L86 80" stroke="#3b82f6" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

function CrayonRainbowSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 90" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round">
        <path d="M18 76 A52 52 0 0 1 122 76" stroke="#f43f5e" strokeWidth="6" opacity="0.65" />
        <path d="M27 76 A43 43 0 0 1 113 76" stroke="#f59e0b" strokeWidth="6" opacity="0.72" />
        <path d="M36 76 A34 34 0 0 1 104 76" stroke="#10b981" strokeWidth="6" opacity="0.6" />
        <path d="M45 76 A25 25 0 0 1 95 76" stroke="#3b82f6" strokeWidth="6" opacity="0.65" />
        {/* Little puffs */}
        <circle cx="20" cy="76" r="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="120" cy="76" r="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
      </g>
    </svg>
  );
}

function CrayonTomatoSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Plump tomato */}
        <path
          d="M50 28 C72 26, 86 42, 84 62 C82 80, 66 90, 50 88 C34 90, 18 80, 16 62 C14 42, 28 26, 50 28 Z"
          fill="#fca5a5"
          fillOpacity="0.65"
          stroke="#b91c1c"
          strokeWidth="2.8"
        />
        {/* Shine */}
        <path d="M30 44 C26 50, 26 58, 29 64" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
        {/* Leafy stem */}
        <path
          d="M50 28 L50 14 M50 28 L38 20 M50 28 L62 20 M50 28 L42 35 M50 28 L58 35"
          stroke="#15803d"
          strokeWidth="2.6"
        />
      </g>
    </svg>
  );
}

function CrayonSoupBowlSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 110" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Steam curls */}
        <path d="M44 34 C40 24, 50 20, 46 10" stroke="#b91c1c" strokeWidth="2.2" opacity="0.65" />
        <path d="M65 30 C61 20, 71 16, 67 6" stroke="#b91c1c" strokeWidth="2.2" opacity="0.7" />
        <path d="M86 34 C82 24, 92 20, 88 10" stroke="#b91c1c" strokeWidth="2.2" opacity="0.65" />
        {/* Soup surface */}
        <ellipse cx="65" cy="48" rx="44" ry="11" fill="#fde68a" stroke="#b91c1c" strokeWidth="2.5" />
        {/* Okra & herb specks */}
        <circle cx="52" cy="48" r="3.2" fill="#16a34a" opacity="0.75" />
        <circle cx="72" cy="46" r="2.8" fill="#16a34a" opacity="0.75" />
        <circle cx="62" cy="51" r="2.5" fill="#ea580c" opacity="0.75" />
        {/* Bowl */}
        <path
          d="M21 48 C22 80, 40 94, 65 94 C90 94, 108 80, 109 48"
          fill="#fecdd3"
          fillOpacity="0.72"
          stroke="#b91c1c"
          strokeWidth="2.8"
        />
        {/* Decorative Bosnian geometric band */}
        <path d="M32 68 L40 62 L48 68 L56 62 L64 68 L72 62 L80 68 L88 62 L96 68" stroke="#991b1b" strokeWidth="2" opacity="0.65" />
        {/* Wooden spoon */}
        <path d="M92 44 L112 24" stroke="#92400e" strokeWidth="3.2" />
      </g>
    </svg>
  );
}

export const DoodleBackground: React.FC<DoodleBackgroundProps> = ({ theme }) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Shared SVG filter for authentic wax-crayon texture */}
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id="crayon-texture">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Luminous dreamy blur orbs for sleek depth */}
      <div
        className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl transition-colors duration-500"
        style={{ background: 'var(--orb-1)' }}
      />
      <div
        className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl transition-colors duration-500"
        style={{ background: 'var(--orb-2)' }}
      />
      <div
        className="absolute -bottom-24 left-1/4 h-96 w-96 rounded-full blur-3xl transition-colors duration-500"
        style={{ background: 'var(--orb-3)' }}
      />

      {/* Plenty of floating theme-matched pastel crayon doodles framing the outer margins */}
      {theme === 'unicorn' && (
        <>
          <CrayonUnicornSvg className="animate-doodle-a absolute top-28 left-[1.5%] hidden w-28 opacity-45 xl:block xl:w-32" />
          <CrayonCrystalSvg className="animate-doodle-b absolute top-24 right-[2%] w-16 opacity-35 md:w-22 md:opacity-48" tint="#f9a8d4" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[44%] left-[1.5%] w-10 opacity-50" color="#db2777" />
          <CrayonCrystalSvg className="animate-doodle-a absolute bottom-24 left-[2.5%] w-18 opacity-42" tint="#ddd6fe" />
          <CrayonUnicornSvg className="animate-doodle-b absolute bottom-16 right-[2%] w-28 opacity-42 -scale-x-100" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[58%] right-[2.5%] w-12 opacity-52" color="#f59e0b" />
          <CrayonCrystalSvg className="animate-doodle-b absolute top-[14%] left-[56%] hidden w-14 opacity-30 lg:block" tint="#fde68a" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute bottom-[34%] left-[3%] hidden w-9 opacity-45 lg:block" color="#c026d3" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[22%] right-[16%] hidden w-10 opacity-45 lg:block" color="#ec4899" />
        </>
      )}

      {theme === 'thunder' && (
        <>
          <CrayonThundercloudSvg className="animate-doodle-a absolute top-28 left-[1.5%] hidden w-32 opacity-48 xl:block xl:w-36" />
          <CrayonRainbowSvg className="animate-doodle-b absolute top-24 right-[2%] w-24 opacity-40 md:w-36 md:opacity-55" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[48%] left-[2%] w-10 opacity-55" color="#ca8a04" />
          <CrayonRainbowSvg className="animate-doodle-a absolute bottom-20 left-[2%] w-32 opacity-45" />
          <CrayonThundercloudSvg className="animate-doodle-b absolute bottom-16 right-[2%] w-28 opacity-48" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[60%] right-[3%] w-11 opacity-55" color="#2563eb" />
          <CrayonThundercloudSvg className="animate-doodle-b absolute top-[14%] left-[56%] hidden w-20 opacity-30 lg:block" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute bottom-[38%] left-[3%] hidden w-9 opacity-45 lg:block" color="#d97706" />
        </>
      )}

      {theme === 'soup' && (
        <>
          <CrayonSoupBowlSvg className="animate-doodle-a absolute top-28 left-[1.5%] hidden w-32 opacity-48 xl:block xl:w-36" />
          <CrayonTomatoSvg className="animate-doodle-b absolute top-24 right-[2%] w-18 opacity-38 md:w-24 md:opacity-50" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[46%] left-[2%] w-10 opacity-50" color="#dc2626" />
          <CrayonTomatoSvg className="animate-doodle-a absolute bottom-24 left-[2.5%] w-20 opacity-45" />
          <CrayonSoupBowlSvg className="animate-doodle-b absolute bottom-14 right-[2%] w-32 opacity-46" />
          <CrayonTomatoSvg className="animate-doodle-b absolute top-[15%] left-[56%] hidden w-16 opacity-30 lg:block" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[62%] right-[3%] w-11 opacity-50" color="#ea580c" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute bottom-[36%] left-[3%] hidden w-9 opacity-45 lg:block" color="#16a34a" />
        </>
      )}
    </div>
  );
};
