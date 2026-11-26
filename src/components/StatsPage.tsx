import React, { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyTotals, ProfileSettings, WeeklyDayStat, WeeklyOverview } from '../types/tracker';
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

interface WeeklyTrendDatum extends WeeklyDayStat {
  index: number;
  goal: number;
  deltaFromGoal: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: WeeklyTrendDatum }>;
}

const WeeklyTrendsTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  const delta = datum.deltaFromGoal;
  const deltaLabel =
    datum.calories === 0
      ? 'No meals logged'
      : delta === 0
      ? 'Exact daily goal'
      : delta > 0
      ? `+${delta.toLocaleString('en-US')} kcal over goal`
      : `${Math.abs(delta).toLocaleString('en-US')} kcal under goal`;

  return (
    <div className="glass-panel-strong rounded-2xl px-3.5 py-2.5 text-xs shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <span className="font-display font-bold" style={{ color: 'var(--ink-primary)' }}>
          {datum.dayShort}, {datum.date.slice(5)}
        </span>
        <span
          className="font-tabular font-semibold"
          style={{ color: 'var(--accent-primary)' }}
        >
          {datum.calories.toLocaleString('en-US')} kcal
        </span>
      </div>
      <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
        {deltaLabel}
      </p>
      <div
        className="font-tabular mt-1.5 flex items-center gap-3 border-t border-black/6 pt-1.5 text-[11px]"
        style={{ color: 'var(--ink-muted)' }}
      >
        <span>
          {datum.protein}g P · {datum.carbs}g C · {datum.fat}g F
        </span>
        <span className="text-sky-800">{formatWaterLiters(datum.waterMl)}</span>
      </div>
    </div>
  );
};

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

  const chartData: WeeklyTrendDatum[] = useMemo(
    () =>
      weeklyOverview.days.map((day, index) => ({
        ...day,
        index,
        goal: profile.dailyCalorieTarget,
        deltaFromGoal: day.calories - profile.dailyCalorieTarget,
      })),
    [weeklyOverview.days, profile.dailyCalorieTarget]
  );

  const yAxisMax = useMemo(() => {
    const peak = Math.max(
      profile.dailyCalorieTarget * 1.15,
      ...weeklyOverview.days.map((d) => d.calories),
      1000
    );
    return Math.ceil(peak / 250) * 250;
  }, [profile.dailyCalorieTarget, weeklyOverview.days]);

  const loggedDays = weeklyOverview.days.filter((d) => d.calories > 0);
  const avgDelta = weeklyOverview.avgCalories - profile.dailyCalorieTarget;
  const patternSummary =
    loggedDays.length === 0
      ? 'Start logging meals to uncover your 7-day calorie intake trend against your daily goal.'
      : Math.abs(avgDelta) <= 120
      ? `Your 7-day average (${weeklyOverview.avgCalories.toLocaleString('en-US')} kcal) tracks right along your daily goal.`
      : avgDelta < 0
      ? `Your 7-day average is ${Math.abs(avgDelta).toLocaleString('en-US')} kcal under your daily goal across ${loggedDays.length} logged day${loggedDays.length === 1 ? '' : 's'}.`
      : `Your 7-day average is ${avgDelta.toLocaleString('en-US')} kcal above your daily goal across ${loggedDays.length} logged day${loggedDays.length === 1 ? '' : 's'}.`;

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
          Daily calorie and macro breakdown alongside your 7-day intake trend vs goal.
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

        {/* Weekly 7-Day Interactive Trends Chart (Recharts) */}
        <section
          aria-label="Weekly calorie trends chart"
          className="glass-panel rounded-3xl p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                Weekly Calorie Trends
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                {patternSummary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                  aria-hidden="true"
                />
                Daily intake
              </span>
              <span className="inline-flex items-center gap-1.5 font-tabular">
                <span
                  className="inline-block w-4 border-t-2 border-dashed"
                  style={{ borderColor: 'var(--accent-primary)' }}
                  aria-hidden="true"
                />
                Goal {profile.dailyCalorieTarget.toLocaleString('en-US')} kcal
              </span>
            </div>
          </div>

          {/* Recharts Weekly Trends Composed Chart */}
          <div className="mt-5 h-64 w-full" role="img" aria-label="7-day daily calorie consumption compared against daily calorie goal">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 18, right: 12, left: -6, bottom: 4 }}
                onClick={(state) => {
                  const idx =
                    typeof state?.activeTooltipIndex === 'number'
                      ? state.activeTooltipIndex
                      : Number(state?.activeTooltipIndex);
                  if (!Number.isNaN(idx) && idx >= 0 && idx < chartData.length) {
                    setSelectedDayIndex(idx);
                  }
                }}
              >
                <defs>
                  <linearGradient id="weeklyCalorieTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.26} />
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(45, 27, 38, 0.08)"
                  strokeDasharray="3 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="dayShort"
                  axisLine={{ stroke: 'rgba(45, 27, 38, 0.1)' }}
                  tickLine={false}
                  tick={{
                    fill: 'var(--ink-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                  dy={6}
                />
                <YAxis
                  domain={[0, yAxisMax]}
                  axisLine={false}
                  tickLine={false}
                  width={46}
                  tick={{
                    fill: 'var(--ink-muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                  }}
                  tickFormatter={(value: number) =>
                    value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `${value}`
                  }
                />
                <Tooltip
                  content={<WeeklyTrendsTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.25)' }}
                />
                <ReferenceLine
                  y={profile.dailyCalorieTarget}
                  stroke="var(--accent-primary)"
                  strokeWidth={1.75}
                  strokeDasharray="6 4"
                  label={{
                    value: `Goal ${profile.dailyCalorieTarget.toLocaleString('en-US')}`,
                    position: 'insideTopRight',
                    fill: 'var(--accent-primary)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="calories"
                  barSize={26}
                  radius={[8, 8, 2, 2]}
                  isAnimationActive={false}
                  onClick={(_data, idx) => {
                    if (typeof idx === 'number') setSelectedDayIndex(idx);
                  }}
                >
                  {chartData.map((entry, idx) => {
                    const isSelected = idx === selectedDayIndex;
                    const overGoal = entry.calories > profile.dailyCalorieTarget * 1.12;
                    const fill = isSelected
                      ? 'var(--accent-primary)'
                      : overGoal
                      ? 'rgba(220, 38, 38, 0.36)'
                      : 'var(--accent-soft)';
                    return (
                      <Cell
                        key={entry.date}
                        fill={fill}
                        stroke={isSelected ? 'var(--accent-primary)' : 'var(--border-glass)'}
                        strokeWidth={1}
                        className="cursor-pointer"
                      />
                    );
                  })}
                </Bar>
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="var(--accent-primary)"
                  strokeWidth={2.25}
                  fill="url(#weeklyCalorieTrendFill)"
                  isAnimationActive={false}
                  dot={(dotProps) => {
                    const { cx, cy, index } = dotProps;
                    if (typeof cx !== 'number' || typeof cy !== 'number' || typeof index !== 'number') {
                      return <g key={`empty-${String(index)}`} />;
                    }
                    const isSelected = index === selectedDayIndex;
                    return (
                      <circle
                        key={`dot-${chartData[index]?.date ?? index}`}
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 5 : 3.5}
                        fill={isSelected ? 'var(--accent-primary)' : '#ffffff'}
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        className="cursor-pointer"
                        onClick={() => setSelectedDayIndex(index)}
                      />
                    );
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'var(--accent-primary)',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Day Selector Chips */}
          <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="Select a day to inspect">
            {chartData.map((day, idx) => {
              const selected = idx === selectedDayIndex;
              return (
                <button
                  key={`day-select-${day.date}`}
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  aria-pressed={selected}
                  className={`${
                    selected ? 'glass-block-active' : 'glass-block'
                  } rounded-xl px-1 py-1.5 text-center transition-all cursor-pointer`}
                >
                  <span
                    className="block text-[11px] font-semibold"
                    style={{ color: selected ? 'var(--accent-primary)' : 'var(--ink-secondary)' }}
                  >
                    {day.dayShort}
                  </span>
                  <span
                    className="font-tabular block text-[10px]"
                    style={{ color: selected ? 'var(--ink-primary)' : 'var(--ink-muted)' }}
                  >
                    {day.calories > 0 ? day.calories : '0'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Day Detail Readout */}
          {selectedDay && (
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/6 pt-5 sm:grid-cols-4">
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
                  Energy vs Goal
                </p>
                <p className="font-tabular mt-0.5 text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {selectedDay.calories.toLocaleString('en-US')} kcal
                </p>
                <p className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  {selectedDay.calories === 0
                    ? `${profile.dailyCalorieTarget.toLocaleString('en-US')} left`
                    : selectedDay.calories > profile.dailyCalorieTarget
                    ? `+${(selectedDay.calories - profile.dailyCalorieTarget).toLocaleString('en-US')} over`
                    : `${(profile.dailyCalorieTarget - selectedDay.calories).toLocaleString('en-US')} under`}
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
