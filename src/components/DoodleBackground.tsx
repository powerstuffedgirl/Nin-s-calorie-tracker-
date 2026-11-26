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

function CrayonKnittedSockSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 120" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Ribbed cuff */}
        <rect
          x="44"
          y="12"
          width="36"
          height="16"
          rx="5"
          fill="#fef3c7"
          fillOpacity="0.78"
          stroke="#7c2d12"
          strokeWidth="2.6"
        />
        <path d="M52 14 V26 M60 14 V26 M68 14 V26 M74 14 V26" stroke="#9a3412" strokeWidth="1.8" opacity="0.75" />
        {/* Sock leg & cozy foot */}
        <path
          d="M46 28 V66 L24 80 C14 86, 14 102, 26 106 C36 110, 50 104, 62 96 L74 86 C78 82, 80 76, 80 68 V28 Z"
          fill="#fed7aa"
          fillOpacity="0.72"
          stroke="#7c2d12"
          strokeWidth="2.8"
        />
        {/* Contrasting toe & heel patches */}
        <path
          d="M27 78 C20 84, 18 96, 26 104 C33 106, 38 102, 41 96 C36 90, 32 84, 27 78 Z"
          fill="#c26438"
          fillOpacity="0.55"
          stroke="#7c2d12"
          strokeWidth="2.2"
        />
        <path
          d="M78 68 C70 68, 65 74, 67 82 C72 86, 77 82, 79 76 Z"
          fill="#c26438"
          fillOpacity="0.5"
          stroke="#7c2d12"
          strokeWidth="2"
        />
        {/* Knitted fair-isle zig-zag stripes */}
        <path d="M47 42 L53 37 L59 42 L65 37 L71 42 L79 37" stroke="#9a3412" strokeWidth="2.3" />
        <path d="M47 54 L53 49 L59 54 L65 49 L71 54 L79 49" stroke="#b45309" strokeWidth="2.1" opacity="0.85" />
        <circle cx="56" cy="64" r="2" fill="#7c2d12" opacity="0.65" />
        <circle cx="66" cy="62" r="2" fill="#7c2d12" opacity="0.65" />
      </g>
    </svg>
  );
}

function CrayonKnittedSweaterSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 120" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Sweater body & sleeves */}
        <path
          d="M48 24 L26 36 L12 78 L28 84 L40 54 V102 H100 V54 L112 84 L128 78 L114 36 L92 24 C84 32, 56 32, 48 24 Z"
          fill="#fde6d2"
          fillOpacity="0.72"
          stroke="#7c2d12"
          strokeWidth="2.8"
        />
        {/* Ribbed turtleneck collar */}
        <path
          d="M48 24 C54 14, 86 14, 92 24 C84 32, 56 32, 48 24 Z"
          fill="#e7a67c"
          fillOpacity="0.7"
          stroke="#7c2d12"
          strokeWidth="2.6"
        />
        <path d="M58 18 V27 M66 17 V29 M74 17 V29 M82 18 V27" stroke="#7c2d12" strokeWidth="1.7" opacity="0.7" />
        {/* Ribbed cuffs & hem */}
        <path d="M15 71 L31 77" stroke="#9a3412" strokeWidth="2.2" />
        <path d="M125 71 L109 77" stroke="#9a3412" strokeWidth="2.2" />
        <path d="M40 92 H100" stroke="#9a3412" strokeWidth="2.2" />
        <path d="M50 93 V101 M60 93 V101 M70 93 V101 M80 93 V101 M90 93 V101" stroke="#9a3412" strokeWidth="1.7" opacity="0.7" />
        {/* Nordic fair-isle diamond chest band */}
        <path d="M42 46 H98" stroke="#9a3412" strokeWidth="2" opacity="0.75" />
        <path d="M42 62 H98" stroke="#9a3412" strokeWidth="2" opacity="0.75" />
        <path
          d="M46 54 L53 48 L60 54 L53 60 Z M63 54 L70 48 L77 54 L70 60 Z M80 54 L87 48 L94 54 L87 60 Z"
          fill="#c26438"
          fillOpacity="0.45"
          stroke="#7c2d12"
          strokeWidth="1.9"
        />
        {/* Vertical cable knit lines */}
        <path d="M54 68 C51 74, 57 80, 54 87" stroke="#b45309" strokeWidth="2" opacity="0.75" />
        <path d="M70 68 C67 74, 73 80, 70 87" stroke="#b45309" strokeWidth="2" opacity="0.75" />
        <path d="M86 68 C83 74, 89 80, 86 87" stroke="#b45309" strokeWidth="2" opacity="0.75" />
      </g>
    </svg>
  );
}

function CrayonWinterCapSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 110" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        {/* Fluffy pom-pom */}
        <circle
          cx="60"
          cy="22"
          r="12"
          fill="#fff7ed"
          fillOpacity="0.88"
          stroke="#7c2d12"
          strokeWidth="2.4"
        />
        <path d="M53 16 L60 22 L67 16 M52 24 L60 22 L68 25" stroke="#c26438" strokeWidth="1.7" opacity="0.65" />
        {/* Beanie dome */}
        <path
          d="M22 72 C22 44, 38 30, 60 30 C82 30, 98 44, 98 72 Z"
          fill="#f2b890"
          fillOpacity="0.74"
          stroke="#7c2d12"
          strokeWidth="2.8"
        />
        {/* Knit stitch pattern on dome */}
        <path d="M36 46 C44 40, 52 38, 60 38 C68 38, 76 40, 84 46" stroke="#9a3412" strokeWidth="2" opacity="0.7" />
        <path d="M28 58 L36 52 L44 58 L52 52 L60 58 L68 52 L76 58 L84 52 L92 58" stroke="#9a3412" strokeWidth="2.2" />
        <circle cx="44" cy="46" r="2" fill="#7c2d12" opacity="0.65" />
        <circle cx="60" cy="45" r="2" fill="#7c2d12" opacity="0.65" />
        <circle cx="76" cy="46" r="2" fill="#7c2d12" opacity="0.65" />
        {/* Folded ribbed cuff */}
        <rect
          x="16"
          y="68"
          width="88"
          height="22"
          rx="10"
          fill="#fde6d2"
          fillOpacity="0.85"
          stroke="#7c2d12"
          strokeWidth="2.8"
        />
        <path
          d="M28 70 V88 M40 70 V88 M52 70 V88 M64 70 V88 M76 70 V88 M88 70 V88"
          stroke="#9a3412"
          strokeWidth="2"
          opacity="0.72"
        />
      </g>
    </svg>
  );
}

function CrayonCrescentMoonSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 110" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M68 18 C44 22, 28 42, 32 66 C36 88, 58 98, 82 90 C62 88, 50 74, 50 56 C50 38, 58 26, 68 18 Z"
          fill="#fde68a"
          fillOpacity="0.34"
          stroke="#fde68a"
          strokeWidth="2.6"
        />
        <path
          d="M78 30 L81 36 L87 39 L81 42 L78 48 L75 42 L69 39 L75 36 Z"
          fill="#f9a8d4"
          fillOpacity="0.5"
          stroke="#f9a8d4"
          strokeWidth="1.6"
        />
        <circle cx="88" cy="60" r="2.2" fill="#c4b5fd" />
      </g>
    </svg>
  );
}

function CrayonNightCloudSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 90" fill="none" className={className} aria-hidden="true">
      <g filter="url(#crayon-texture)" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M28 62 C16 62, 12 48, 22 42 C22 28, 38 20, 52 28 C60 16, 82 16, 92 28 C106 26, 118 38, 114 52 C112 58, 104 62, 94 62 Z"
          fill="#818cf8"
          fillOpacity="0.16"
          stroke="#c4b5fd"
          strokeWidth="2.3"
        />
        <path d="M40 72 L42 76 L46 78 L42 80 L40 84 L38 80 L34 78 L38 76 Z" fill="#fde68a" opacity="0.8" />
        <path d="M96 68 L98 71 L101 73 L98 75 L96 78 L94 75 L91 73 L94 71 Z" fill="#f9a8d4" opacity="0.8" />
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

      {theme === 'copper' && (
        <>
          <CrayonKnittedSweaterSvg className="animate-doodle-a absolute top-28 left-[1.2%] hidden w-32 opacity-52 xl:block xl:w-36" />
          <CrayonWinterCapSvg className="animate-doodle-b absolute top-24 right-[1.8%] w-22 opacity-44 md:w-28 md:opacity-55" />
          <CrayonKnittedSockSvg className="animate-doodle-b absolute top-[44%] left-[1.4%] w-20 opacity-46 xl:w-24" />
          <CrayonWinterCapSvg className="animate-doodle-a absolute bottom-20 left-[2%] w-26 opacity-48 -rotate-6" />
          <CrayonKnittedSweaterSvg className="animate-doodle-b absolute bottom-14 right-[1.6%] w-32 opacity-48 rotate-3" />
          <CrayonKnittedSockSvg className="animate-doodle-a absolute top-[54%] right-[2%] w-22 opacity-48 -scale-x-100" />
          <CrayonKnittedSockSvg className="animate-doodle-b absolute top-[14%] left-[56%] hidden w-16 opacity-34 lg:block" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute bottom-[34%] left-[3.2%] hidden w-9 opacity-50 lg:block" color="#9a3412" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[24%] right-[16%] hidden w-9 opacity-48 lg:block" color="#b45309" />
        </>
      )}

      {theme === 'dark' && (
        <>
          <CrayonCrescentMoonSvg className="animate-doodle-a absolute top-28 left-[1.8%] hidden w-28 opacity-55 xl:block xl:w-32" />
          <CrayonNightCloudSvg className="animate-doodle-b absolute top-24 right-[2%] w-24 opacity-45 md:w-34 md:opacity-55" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[46%] left-[2%] w-10 opacity-65" color="#fde68a" />
          <CrayonNightCloudSvg className="animate-doodle-a absolute bottom-20 left-[2%] w-32 opacity-45" />
          <CrayonCrescentMoonSvg className="animate-doodle-b absolute bottom-16 right-[2%] w-24 opacity-50 -scale-x-100" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[58%] right-[2.8%] w-11 opacity-65" color="#f472b6" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[16%] left-[55%] hidden w-9 opacity-50 lg:block" color="#c4b5fd" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute bottom-[35%] left-[3%] hidden w-8 opacity-55 lg:block" color="#38bdf8" />
          <CrayonSparkleSvg className="animate-doodle-twinkle absolute top-[24%] right-[17%] hidden w-9 opacity-55 lg:block" color="#fde68a" />
        </>
      )}
    </div>
  );
};
