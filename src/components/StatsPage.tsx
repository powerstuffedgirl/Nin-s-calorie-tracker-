import React, { useState } from 'react';
import { DailyTotals, ProfileSettings, WeeklyOverview } from '../types/tracker';
import {
  calculateMacroCalorieSplit,
  formatWaterLiters,
  MEAL_TYPES,
} from '../utils/trackerLogic';

interface StatsPageProps {
  todayTotals: DailyTotals;
  weeklyOverview: WeeklyOverview;
  profile: ProfileSettings;
}

export const StatsPage: React.FC<StatsPageProps> = ({
  todayTotals,
  weeklyOverview,
  profile,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    weeklyOverview.days.length - 1
  );

  const selectedDay =
    weeklyOverview.days[selectedDayIndex] ?? weeklyOverview.days[weeklyOverview.days.length - 1];

  const macroSplit = calculateMacroCalorieSplit(todayTotals);

  // Donut segments for today's macro calorie split
  const donutRadius = 58;
  const donutCirc = 2 * Math.PI * donutRadius;
  const pLen = (macroSplit.proteinPct / 100) * donutCirc;
  const cLen = (macroSplit.carbsPct / 100) * donutCirc;
  const fLen = (macroSplit.fatPct / 100) * donutCirc;

  const maxWeeklyCal = Math.max(
    profile.dailyCalorieTarget * 1.15,
    ...weeklyOverview.days.map((d) => d.calories),
    1000
  );
  const targetLinePct = Math.min(95, (profile.dailyCalorieTarget / maxWeeklyCal) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
          style={{ color: 'var(--ink-primary)' }}
        >
          Nutrition & Weekly Stats
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Daily calorie and macro breakdown alongside your 7-day trend.
        </p>
      </div>

      {/* 4-Column Weekly KPI Strip (Clean hairline dividers, single elevation) */}
      <section
        aria-label="Weekly summary highlights"
        className="glass-panel grid grid-cols-2 divide-y divide-black/6 rounded-3xl sm:grid-cols-4 sm:divide-x sm:divide-y-0"
      >
        <div className="p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            7-Day Avg Calories
          </p>
          <p className="font-tabular mt-1.5 text-2xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            {weeklyOverview.avgCalories.toLocaleString('en-US')}
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>
              kcal
            </span>
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            7-Day Avg Water
          </p>
          <p className="font-tabular mt-1.5 text-2xl font-semibold text-sky-800">
            {formatWaterLiters(weeklyOverview.avgWaterMl)}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            Days On Target
          </p>
          <p className="font-tabular mt-1.5 text-2xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
            {weeklyOverview.daysOnTrack} / 7
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            Begova čorba Bowls
          </p>
          <p className="font-tabular mt-1.5 text-2xl font-semibold" style={{ color: 'var(--accent-primary)' }}>
            {weeklyOverview.totalBegovaBowls}
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>
              this week
            </span>
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Daily Calorie & Macro Breakdown */}
        <section
          aria-label="Daily macro breakdown"
          className="glass-panel rounded-3xl p-6 lg:col-span-5"
        >
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
            Today&apos;s Macro Breakdown
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
            Calorie share from Protein (4 kcal/g), Carbs (4 kcal/g), and Fat (9 kcal/g).
          </p>

          <div className="my-6 flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
              <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="75"
                  cy="75"
                  r={donutRadius}
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth="16"
                />
                {pLen > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={donutRadius}
                    fill="none"
                    stroke="var(--macro-protein)"
                    strokeWidth="16"
                    strokeDasharray={`${pLen} ${donutCirc}`}
                    strokeDashoffset={0}
                  />
                )}
                {cLen > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={donutRadius}
                    fill="none"
                    stroke="var(--macro-carbs)"
                    strokeWidth="16"
                    strokeDasharray={`${cLen} ${donutCirc}`}
                    strokeDashoffset={-pLen}
                  />
                )}
                {fLen > 0 && (
                  <circle
                    cx="75"
                    cy="75"
                    r={donutRadius}
                    fill="none"
                    stroke="var(--macro-fat)"
                    strokeWidth="16"
                    strokeDasharray={`${fLen} ${donutCirc}`}
                    strokeDashoffset={-(pLen + cLen)}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-tabular text-xl font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {todayTotals.calories}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  kcal today
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              {[
                {
                  name: 'Protein',
                  grams: todayTotals.protein,
                  kcal: macroSplit.proteinKcal,
                  pct: macroSplit.proteinPct,
                  color: 'var(--macro-protein)',
                },
                {
                  name: 'Carbs',
                  grams: todayTotals.carbs,
                  kcal: macroSplit.carbsKcal,
                  pct: macroSplit.carbsPct,
                  color: 'var(--macro-carbs)',
                },
                {
                  name: 'Fat',
                  grams: todayTotals.fat,
                  kcal: macroSplit.fatKcal,
                  pct: macroSplit.fatPct,
                  color: 'var(--macro-fat)',
                },
              ].map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: m.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                      {m.name}
                    </span>
                  </div>
                  <span className="font-tabular" style={{ color: 'var(--ink-secondary)' }}>
                    {m.grams}g · {m.pct}% ({m.kcal} kcal)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calories by Meal Type */}
          <div className="border-t border-black/6 pt-5">
            <h3 className="text-xs font-semibold" style={{ color: 'var(--ink-secondary)' }}>
              Today by Meal Type
            </h3>
            <div className="mt-3 space-y-2.5">
              {MEAL_TYPES.map((mt) => {
                const kcal = todayTotals.byMealType[mt.id];
                const share =
                  todayTotals.calories > 0
                    ? Math.round((kcal / todayTotals.calories) * 100)
                    : 0;
                return (
                  <div key={mt.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium" style={{ color: 'var(--ink-primary)' }}>
                        {mt.label}
                      </span>
                      <span className="font-tabular" style={{ color: 'var(--ink-muted)' }}>
                        {kcal} kcal ({share}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/6">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${share}%`,
                          backgroundColor: 'var(--accent-primary)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Weekly 7-Day Interactive Overview */}
        <section
          aria-label="Weekly calorie and hydration overview"
          className="glass-panel rounded-3xl p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                7-Day Calorie Overview
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                Select any day bar to inspect macros and water intake.
              </p>
            </div>
            <span className="font-tabular text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              Target: {profile.dailyCalorieTarget.toLocaleString('en-US')} kcal
            </span>
          </div>

          {/* Interactive Bar Chart */}
          <div className="mt-6">
            {/* Value labels row */}
            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2">
              {weeklyOverview.days.map((day, idx) => {
                const selected = idx === selectedDayIndex;
                return (
                  <span
                    key={`val-${day.date}`}
                    className="font-tabular text-center text-[11px] font-medium"
                    style={{
                      color: selected ? 'var(--accent-primary)' : 'var(--ink-muted)',
                    }}
                  >
                    {day.calories > 0 ? day.calories : '—'}
                  </span>
                );
              })}
            </div>

            {/* Plot area with accurate dashed target reference line */}
            <div className="relative h-44 border-b border-black/8">
              <div
                className="pointer-events-none absolute right-0 left-0 border-t border-dashed"
                style={{
                  bottom: `${targetLinePct}%`,
                  borderColor: 'var(--accent-primary)',
                  opacity: 0.45,
                }}
                aria-hidden="true"
              />

              <div className="grid h-full grid-cols-7 items-end gap-2 sm:gap-3">
                {weeklyOverview.days.map((day, idx) => {
                  const heightPct = Math.max(
                    6,
                    Math.min(100, (day.calories / maxWeeklyCal) * 100)
                  );
                  const selected = idx === selectedDayIndex;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDayIndex(idx)}
                      aria-label={`${day.dayShort} ${day.dayNumber}: ${day.calories} kcal`}
                      aria-pressed={selected}
                      className="group flex h-full w-full items-end justify-center cursor-pointer"
                    >
                      <div
                        className="w-full max-w-[2.5rem] rounded-t-xl transition-all duration-300 group-hover:opacity-90"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: selected
                            ? 'var(--accent-primary)'
                            : 'var(--accent-soft)',
                          border: selected
                            ? '1px solid var(--accent-primary)'
                            : '1px solid var(--border-glass)',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weekday labels row */}
            <div className="mt-2 grid grid-cols-7 gap-2 sm:gap-3">
              {weeklyOverview.days.map((day, idx) => {
                const selected = idx === selectedDayIndex;
                return (
                  <button
                    key={`lbl-${day.date}`}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className="text-center text-xs font-semibold cursor-pointer"
                    style={{
                      color: selected ? 'var(--ink-primary)' : 'var(--ink-muted)',
                    }}
                  >
                    {day.dayShort}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Detail Readout */}
          {selectedDay && (
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/6 pt-5 sm:grid-cols-4">
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Selected Day
                </p>
                <p className="font-display mt-0.5 text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                  {selectedDay.dayShort}, {selectedDay.date.slice(5)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Energy
                </p>
                <p className="font-tabular mt-0.5 text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {selectedDay.calories.toLocaleString('en-US')} kcal
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Macros (P / C / F)
                </p>
                <p className="font-tabular mt-0.5 text-sm font-semibold" style={{ color: 'var(--ink-secondary)' }}>
                  {selectedDay.protein}g / {selectedDay.carbs}g / {selectedDay.fat}g
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Hydration
                </p>
                <p className="font-tabular mt-0.5 text-base font-semibold text-sky-800">
                  {formatWaterLiters(selectedDay.waterMl)}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
