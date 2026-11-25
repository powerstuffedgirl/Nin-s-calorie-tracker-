import React, { useState } from 'react';
import { Droplets, Plus, Trash2 } from 'lucide-react';
import { ProfileSettings, WaterEntry } from '../types/tracker';
import {
  calculateProgressPercent,
  formatWaterLiters,
} from '../utils/trackerLogic';

interface WaterPageProps {
  todayWaterMl: number;
  waterEntriesToday: WaterEntry[];
  profile: ProfileSettings;
  onAddWater: (amountMl: number, label: string) => void;
  onDeleteWater: (id: string) => void;
}

const METRIC_PRESETS = [
  { amountMl: 150, label: 'Fildžan tea / small cup' },
  { amountMl: 250, label: 'Glass of water' },
  { amountMl: 500, label: 'Water bottle' },
  { amountMl: 750, label: 'Large bottle' },
];

export const WaterPage: React.FC<WaterPageProps> = ({
  todayWaterMl,
  waterEntriesToday,
  profile,
  onAddWater,
  onDeleteWater,
}) => {
  const [customMl, setCustomMl] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const percent = calculateProgressPercent(todayWaterMl, profile.dailyWaterTargetMl);
  const clampedFill = Math.min(100, Math.max(4, percent));
  const remainingMl = Math.max(0, profile.dailyWaterTargetMl - todayWaterMl);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customMl);
    if (!customMl.trim() || Number.isNaN(amount) || amount < 25 || amount > 3000) {
      setError('Enter an amount between 25 ml and 3,000 ml.');
      return;
    }
    setError(null);
    onAddWater(Math.round(amount), customLabel.trim() || 'Custom drink');
    setCustomMl('');
    setCustomLabel('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
          style={{ color: 'var(--ink-primary)' }}
        >
          Water Tracker
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Steady metric hydration in milliliters (ml) and liters (L).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Hydration Glass Vessel */}
        <section
          aria-label="Daily hydration progress"
          className="glass-panel rounded-3xl p-6 lg:col-span-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
              Today&apos;s Hydration
            </h2>
            <span className="font-tabular text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
              Goal {formatWaterLiters(profile.dailyWaterTargetMl)}
            </span>
          </div>

          <div className="my-7 flex flex-col items-center">
            {/* Sleek frosted carafe vessel */}
            <div className="relative h-64 w-52 overflow-hidden rounded-[2.25rem] border-2 border-sky-600/25 bg-white/80 shadow-inner">
              {/* Rising water level */}
              <div
                className="absolute right-0 bottom-0 left-0 transition-all duration-500 ease-out"
                style={{
                  height: `${clampedFill}%`,
                  background:
                    'linear-gradient(180deg, rgba(125,211,252,0.52) 0%, rgba(14,165,233,0.68) 100%)',
                }}
              >
                {/* Gentle top wave */}
                <svg
                  viewBox="0 0 240 20"
                  className="animate-wave-slide absolute -top-3 left-0 h-4 w-[200%]"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 10 Q 30 0, 60 10 T 120 10 T 180 10 T 240 10 V 20 H 0 Z"
                    fill="rgba(125,211,252,0.52)"
                  />
                </svg>
              </div>

              {/* Subtle carafe graduation tick marks along right edge (non-overlapping) */}
              <div
                className="pointer-events-none absolute inset-y-6 right-2.5 flex flex-col justify-between items-end opacity-45"
                aria-hidden="true"
              >
                <span className="block h-[1.5px] w-3 rounded-full bg-sky-900" />
                <span className="block h-[1.5px] w-2 rounded-full bg-sky-900" />
                <span className="block h-[1.5px] w-3 rounded-full bg-sky-900" />
                <span className="block h-[1.5px] w-2 rounded-full bg-sky-900" />
              </div>

              {/* Center readout in a subtle frosted pill for guaranteed legibility */}
              <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center">
                <div className="rounded-2xl bg-white/75 px-4 py-3 backdrop-blur-md shadow-xs">
                  <Droplets className="mx-auto mb-1 h-5 w-5 text-sky-700" aria-hidden="true" />
                  <span
                    data-testid="water-liters-value"
                    className="font-tabular block text-3xl font-semibold leading-none"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    {formatWaterLiters(todayWaterMl)}
                  </span>
                  <span
                    data-testid="water-ml-value"
                    className="font-tabular mt-1.5 block text-[11px] font-semibold"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    {todayWaterMl.toLocaleString('en-US')} / {profile.dailyWaterTargetMl.toLocaleString('en-US')} ml
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
              {remainingMl === 0
                ? 'Daily hydration goal reached!'
                : `${remainingMl.toLocaleString('en-US')} ml (${formatWaterLiters(remainingMl)}) remaining`}
            </p>
            <p className="font-tabular mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
              {percent}% of {formatWaterLiters(profile.dailyWaterTargetMl)} target
            </p>
          </div>
        </section>

        {/* Quick-Add Controls & Daily Log */}
        <section
          aria-label="Add water and hydration log"
          className="space-y-6 lg:col-span-7"
        >
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
              Quick Add (Metric)
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
              Tap a vessel size to log instantly.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {METRIC_PRESETS.map((preset) => (
                <button
                  key={preset.amountMl}
                  type="button"
                  onClick={() => onAddWater(preset.amountMl, preset.label)}
                  className="glass-block flex min-h-[76px] flex-col items-start justify-between rounded-2xl p-3.5 text-left transition-all hover:bg-white/75 active:scale-[0.98] cursor-pointer"
                >
                  <span className="font-tabular text-base font-semibold text-sky-800">
                    +{preset.amountMl} ml
                  </span>
                  <span className="text-[11px] leading-snug" style={{ color: 'var(--ink-secondary)' }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom ml form */}
            <form
              onSubmit={handleCustomSubmit}
              noValidate
              className="mt-5 border-t border-black/6 pt-5"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="custom-water-ml"
                    className="mb-1 block text-xs font-semibold"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    Custom amount (ml)
                  </label>
                  <input
                    id="custom-water-ml"
                    type="number"
                    min="25"
                    max="3000"
                    value={customMl}
                    onChange={(e) => setCustomMl(e.target.value)}
                    placeholder="330"
                    className="font-tabular glass-block w-full min-h-[42px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-sky-600"
                    style={{ color: 'var(--ink-primary)' }}
                  />
                </div>
                <div className="sm:col-span-5">
                  <label
                    htmlFor="custom-water-label"
                    className="mb-1 block text-xs font-semibold"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    Drink note (optional)
                  </label>
                  <input
                    id="custom-water-label"
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Mint tea or sparkling water"
                    className="glass-block w-full min-h-[42px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-sky-600"
                    style={{ color: 'var(--ink-primary)' }}
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-sky-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-800 whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add ml
                  </button>
                </div>
              </div>
              {error && (
                <p role="alert" className="mt-2 text-xs font-semibold text-red-700">
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* Hydration Log */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                Today&apos;s Drinks
              </h2>
              <span className="font-tabular text-xs" style={{ color: 'var(--ink-muted)' }}>
                {waterEntriesToday.length} {waterEntriesToday.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            <div className="mt-4 divide-y divide-black/6">
              {waterEntriesToday.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
                  No water logged yet today — start with a fresh 250 ml glass.
                </p>
              ) : (
                waterEntriesToday.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        {entry.label}
                      </p>
                      <p className="font-tabular text-xs" style={{ color: 'var(--ink-muted)' }}>
                        {entry.time} · {(entry.amountMl / 1000).toFixed(2)} L
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-tabular text-sm font-semibold text-sky-800">
                        +{entry.amountMl} ml
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteWater(entry.id)}
                        aria-label={`Delete ${entry.amountMl} ml ${entry.label}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-red-50 hover:text-red-700 cursor-pointer"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
