import React, { useMemo, useState } from 'react';
import { Check, Dumbbell, Pencil, Plus, Trash2, Utensils, X } from 'lucide-react';
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
import {
  DailyTotals,
  MealEntry,
  MealType,
  ProfileSettings,
  WeeklyDayStat,
  WeeklyOverview,
  WorkoutEntry,
} from '../types/tracker';
import {
  calculateMacroCalorieSplit,
  calculateNetCalories,
  calculateProgressPercent,
  formatWaterLiters,
  getNetCalorieStatus,
  isEditablePastDate,
  MEAL_TYPES,
  summarizeWeeklyHydration,
} from '../utils/trackerLogic';

interface StatsPageProps {
  todayKey: string;
  todayTotals: DailyTotals;
  todayBurnedKcal: number;
  todayWorkoutCount: number;
  weeklyOverview: WeeklyOverview;
  profile: ProfileSettings;
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  onUpdateMeal: (
    id: string,
    updates: {
      name: string;
      mealType: MealType;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  ) => void;
  onDeleteMeal: (id: string) => void;
  onUpdateWorkout: (
    id: string,
    updates: {
      name: string;
      caloriesBurned: number;
      durationMin: number;
      details?: string;
    }
  ) => void;
  onDeleteWorkout: (id: string) => void;
  onLogMealsForDate: (dateKey: string) => void;
  onLogWorkoutsForDate: (dateKey: string) => void;
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

interface WeeklyHydrationDatum extends WeeklyDayStat {
  index: number;
  waterGoalMl: number;
  waterDeltaMl: number;
  waterGoalPct: number;
}

interface CustomHydrationTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: WeeklyHydrationDatum }>;
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
        className="font-tabular mt-1.5 flex items-center gap-3 border-t pt-1.5 text-[11px]"
        style={{ color: 'var(--ink-muted)', borderColor: 'var(--divider-hairline)' }}
      >
        <span>
          {datum.protein}g P · {datum.carbs}g C · {datum.fat}g F
        </span>
        <span style={{ color: 'var(--water-ink)' }}>{formatWaterLiters(datum.waterMl)}</span>
      </div>
    </div>
  );
};

const WeeklyHydrationTooltip: React.FC<CustomHydrationTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  const delta = datum.waterDeltaMl;
  const deltaLabel =
    datum.waterMl === 0
      ? 'No water logged'
      : delta >= 0
      ? `+${delta.toLocaleString('en-US')} ml above goal (${datum.waterGoalPct}%)`
      : `${Math.abs(delta).toLocaleString('en-US')} ml under goal (${datum.waterGoalPct}%)`;

  return (
    <div className="glass-panel-strong rounded-2xl px-3.5 py-2.5 text-xs shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <span className="font-display font-bold" style={{ color: 'var(--ink-primary)' }}>
          {datum.dayShort}, {datum.date.slice(5)}
        </span>
        <span className="font-tabular font-semibold" style={{ color: 'var(--water-ink)' }}>
          {datum.waterMl.toLocaleString('en-US')} ml
        </span>
      </div>
      <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
        {deltaLabel}
      </p>
      <div
        className="font-tabular mt-1.5 flex items-center justify-between gap-3 border-t pt-1.5 text-[11px]"
        style={{ color: 'var(--ink-muted)', borderColor: 'var(--divider-hairline)' }}
      >
        <span>{formatWaterLiters(datum.waterMl)} logged</span>
        <span>Goal {datum.waterGoalMl.toLocaleString('en-US')} ml</span>
      </div>
    </div>
  );
};

export const StatsPage: React.FC<StatsPageProps> = ({
  todayKey,
  todayTotals,
  todayBurnedKcal,
  todayWorkoutCount,
  weeklyOverview,
  profile,
  meals,
  workouts,
  onUpdateMeal,
  onDeleteMeal,
  onUpdateWorkout,
  onDeleteWorkout,
  onLogMealsForDate,
  onLogWorkoutsForDate,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    weeklyOverview.days.length - 1
  );
  const [yesterdayEditorOpen, setYesterdayEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<'meals' | 'workouts'>('meals');

  // Inline meal edit state
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealType, setEditMealType] = useState<MealType>('lunch');
  const [editMealKcal, setEditMealKcal] = useState('');
  const [editMealP, setEditMealP] = useState('');
  const [editMealC, setEditMealC] = useState('');
  const [editMealF, setEditMealF] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Inline workout edit state
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editWkName, setEditWkName] = useState('');
  const [editWkKcal, setEditWkKcal] = useState('');
  const [editWkDuration, setEditWkDuration] = useState('');

  const selectedDay =
    weeklyOverview.days[selectedDayIndex] ?? weeklyOverview.days[weeklyOverview.days.length - 1];

  const selectedDayIsEditable = Boolean(
    selectedDay && isEditablePastDate(selectedDay.date, todayKey)
  );

  const selectedDayMeals = useMemo(
    () => (selectedDay ? meals.filter((m) => m.date === selectedDay.date) : []),
    [meals, selectedDay]
  );

  const selectedDayWorkouts = useMemo(
    () => (selectedDay ? workouts.filter((w) => w.date === selectedDay.date) : []),
    [workouts, selectedDay]
  );

  const handleSelectDay = (idx: number) => {
    const picked = weeklyOverview.days[idx];
    setSelectedDayIndex(idx);
    setEditingMealId(null);
    setEditingWorkoutId(null);
    setEditError(null);
    if (picked && isEditablePastDate(picked.date, todayKey)) {
      setYesterdayEditorOpen(true);
    } else {
      setYesterdayEditorOpen(false);
    }
  };

  const startEditingMeal = (meal: MealEntry) => {
    setEditingMealId(meal.id);
    setEditMealName(meal.name);
    setEditMealType(meal.mealType);
    setEditMealKcal(String(meal.calories));
    setEditMealP(String(meal.protein));
    setEditMealC(String(meal.carbs));
    setEditMealF(String(meal.fat));
    setEditError(null);
  };

  const saveMealEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealId) return;
    const trimmed = editMealName.trim();
    const kcal = Number(editMealKcal);
    const p = editMealP.trim() === '' ? 0 : Number(editMealP);
    const c = editMealC.trim() === '' ? 0 : Number(editMealC);
    const f = editMealF.trim() === '' ? 0 : Number(editMealF);
    if (trimmed.length < 2) {
      setEditError('Enter a meal name (at least 2 characters).');
      return;
    }
    if (Number.isNaN(kcal) || kcal < 0 || kcal > 5000) {
      setEditError('Calories must be between 0 and 5,000 kcal.');
      return;
    }
    if (Number.isNaN(p) || p < 0 || Number.isNaN(c) || c < 0 || Number.isNaN(f) || f < 0) {
      setEditError('Macros cannot be negative.');
      return;
    }
    onUpdateMeal(editingMealId, {
      name: trimmed,
      mealType: editMealType,
      calories: kcal,
      protein: p,
      carbs: c,
      fat: f,
    });
    setEditingMealId(null);
    setEditError(null);
  };

  const startEditingWorkout = (wk: WorkoutEntry) => {
    setEditingWorkoutId(wk.id);
    setEditWkName(wk.name);
    setEditWkKcal(String(wk.caloriesBurned));
    setEditWkDuration(String(wk.durationMin));
    setEditError(null);
  };

  const saveWorkoutEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkoutId) return;
    const trimmed = editWkName.trim();
    const kcal = Number(editWkKcal);
    const dur = Number(editWkDuration);
    if (trimmed.length < 2) {
      setEditError('Enter a workout name (at least 2 characters).');
      return;
    }
    if (Number.isNaN(kcal) || kcal < 1 || kcal > 4000) {
      setEditError('Calories burnt must be between 1 and 4,000 kcal.');
      return;
    }
    if (Number.isNaN(dur) || dur < 1 || dur > 480) {
      setEditError('Duration must be between 1 and 480 minutes.');
      return;
    }
    onUpdateWorkout(editingWorkoutId, {
      name: trimmed,
      caloriesBurned: kcal,
      durationMin: dur,
    });
    setEditingWorkoutId(null);
    setEditError(null);
  };

  const macroSplit = calculateMacroCalorieSplit(todayTotals);

  // Net Calorie Intake circle math (Food Intake - Calories Burnt)
  const netCalories = calculateNetCalories(todayTotals.calories, todayBurnedKcal);
  const netRemaining = profile.dailyCalorieTarget - netCalories;
  const netStatus = getNetCalorieStatus(netCalories, profile.dailyCalorieTarget);
  const netOverGoal = netStatus === 'over';
  const netGoalPct = calculateProgressPercent(Math.max(0, netCalories), profile.dailyCalorieTarget);
  const netRingRadius = 64;
  const netRingCirc = 2 * Math.PI * netRingRadius;
  const netClampedRatio = Math.min(
    1,
    Math.max(0, netCalories / Math.max(1, profile.dailyCalorieTarget))
  );
  const netRingOffset = netRingCirc * (1 - netClampedRatio);

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

  const hydrationSummary = useMemo(
    () => summarizeWeeklyHydration(weeklyOverview.days, profile.dailyWaterTargetMl),
    [weeklyOverview.days, profile.dailyWaterTargetMl]
  );

  const hydrationChartData: WeeklyHydrationDatum[] = useMemo(
    () =>
      weeklyOverview.days.map((day, index) => ({
        ...day,
        index,
        waterGoalMl: profile.dailyWaterTargetMl,
        waterDeltaMl: day.waterMl - profile.dailyWaterTargetMl,
        waterGoalPct:
          profile.dailyWaterTargetMl > 0
            ? Math.round((day.waterMl / profile.dailyWaterTargetMl) * 100)
            : 0,
      })),
    [weeklyOverview.days, profile.dailyWaterTargetMl]
  );

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

  const hydrationPatternSummary =
    hydrationSummary.loggedDaysCount === 0
      ? 'Log water in the Water tab to track your 7-day daily intake (ml) against your hydration goal.'
      : hydrationSummary.goalMetDays > 0
      ? `Hit your ${profile.dailyWaterTargetMl.toLocaleString('en-US')} ml daily goal on ${hydrationSummary.goalMetDays} of the last 7 days · avg ${hydrationSummary.avgWaterMl.toLocaleString('en-US')} ml/day.`
      : `Averaging ${hydrationSummary.avgWaterMl.toLocaleString('en-US')} ml/day across ${hydrationSummary.loggedDaysCount} logged day${hydrationSummary.loggedDaysCount === 1 ? '' : 's'} (${Math.abs(hydrationSummary.avgDeltaMl).toLocaleString('en-US')} ml shy of your daily goal).`;

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
          Net calorie balance, daily macro breakdown, and 7-day nutrition &amp; hydration trends.
        </p>
      </div>

      {/* FIRST RECTANGLE: Net Calorie Intake Circle */}
      <section
        aria-label="Net calorie intake"
        data-testid="stats-net-calorie-card"
        className="glass-panel rounded-3xl p-6"
      >
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            {/* Net Calorie Circle Ring — Green when in range, Red when over daily limit */}
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
              <svg
                viewBox="0 0 160 160"
                className="h-full w-full -rotate-90"
                aria-hidden="true"
                data-testid="stats-net-calorie-ring"
                data-status={netStatus}
              >
                <circle
                  cx="80"
                  cy="80"
                  r={netRingRadius}
                  fill="none"
                  stroke={netOverGoal ? 'var(--danger-soft)' : 'var(--success-soft)'}
                  strokeWidth="14"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={netRingRadius}
                  fill="none"
                  stroke={netOverGoal ? 'var(--danger-ring)' : 'var(--success-ring)'}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={netRingCirc}
                  strokeDashoffset={netRingOffset}
                  className="transition-[stroke-dashoffset,stroke] duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                <span
                  data-testid="stats-net-calories-value"
                  className="font-tabular text-3xl font-semibold tracking-tight leading-none"
                  style={{ color: 'var(--ink-primary)' }}
                >
                  {netCalories.toLocaleString('en-US')}
                </span>
                <span className="mt-1 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                  kcal net
                </span>
                <span
                  data-testid="stats-net-status-label"
                  className="font-tabular mt-1 text-[11px] font-semibold"
                  style={{ color: netOverGoal ? 'var(--danger-ink)' : 'var(--success-ink)' }}
                >
                  {netOverGoal
                    ? `+${Math.abs(netRemaining).toLocaleString('en-US')} over`
                    : `${netRemaining.toLocaleString('en-US')} left`}
                </span>
              </div>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--ink-primary)' }}>
                Net Calorie Intake
              </h2>
              <p className="mt-1 text-xs leading-relaxed max-w-md" style={{ color: 'var(--ink-secondary)' }}>
                Today&apos;s food intake minus workout calories burnt against your{' '}
                <span className="font-tabular font-semibold">
                  {profile.dailyCalorieTarget.toLocaleString('en-US')} kcal
                </span>{' '}
                daily limit ({netGoalPct}% ·{' '}
                <span
                  className="font-semibold"
                  style={{ color: netOverGoal ? 'var(--danger-ink)' : 'var(--success-ink)' }}
                >
                  {netOverGoal ? 'over limit' : 'in range'}
                </span>
                ).
              </p>
              <p className="font-tabular mt-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
                {todayWorkoutCount === 0
                  ? 'No workouts logged today yet'
                  : `${todayWorkoutCount} workout ${todayWorkoutCount === 1 ? 'session' : 'sessions'} logged today`}
              </p>
            </div>
          </div>

          {/* Clean Unboxed Energy Equation Readout */}
          <div
            className="grid w-full grid-cols-3 divide-x divide-black/6 dark:divide-white/10 border-t pt-4 md:w-auto md:min-w-[21rem] md:border-t-0 md:border-l md:pt-0 md:pl-6"
            style={{ borderColor: 'var(--divider-hairline)' }}
          >
            <div className="px-3 first:pl-0 text-center md:text-left">
              <p className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                Food Intake
              </p>
              <p className="font-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--ink-primary)' }}>
                {todayTotals.calories.toLocaleString('en-US')}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                kcal
              </p>
            </div>

            <div className="px-3 text-center md:text-left">
              <p className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                Burned
              </p>
              <p className="font-tabular mt-1 text-lg font-semibold" style={{ color: 'var(--burn-ink)' }}>
                −{todayBurnedKcal.toLocaleString('en-US')}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                kcal
              </p>
            </div>

            <div className="px-3 last:pr-0 text-center md:text-left">
              <p className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                Net Intake
              </p>
              <p
                className="font-tabular mt-1 text-lg font-semibold"
                style={{ color: netOverGoal ? 'var(--danger-ink)' : 'var(--success-ink)' }}
              >
                {netCalories.toLocaleString('en-US')}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                kcal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Weekly KPI Strip (Clean hairline dividers, single elevation) */}
      <section
        aria-label="Weekly summary highlights"
        className="glass-panel grid grid-cols-2 divide-y divide-black/6 dark:divide-white/10 rounded-3xl sm:grid-cols-4 sm:divide-x sm:divide-y-0"
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
          <p className="font-tabular mt-1.5 text-2xl font-semibold" style={{ color: 'var(--water-ink)' }}>
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
                  stroke="var(--track-bg)"
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
          <div className="border-t pt-5" style={{ borderColor: 'var(--divider-hairline)' }}>
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
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: 'var(--track-bg)' }}
                    >
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

        {/* Right Column: Weekly Calorie Trends + Weekly Hydration Trend stacked */}
        <div className="space-y-6 lg:col-span-7">
          {/* Weekly 7-Day Interactive Calorie Trends Chart (Recharts) */}
          <section
            aria-label="Weekly calorie trends chart"
            className="glass-panel rounded-3xl p-6"
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
                    handleSelectDay(idx);
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
                  stroke="var(--chart-grid)"
                  strokeDasharray="3 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="dayShort"
                  axisLine={{ stroke: 'var(--chart-axis)' }}
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
                  cursor={{ fill: 'var(--chart-cursor)' }}
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
                    if (typeof idx === 'number') handleSelectDay(idx);
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
                        fill={isSelected ? 'var(--accent-primary)' : 'var(--chart-dot-bg)'}
                        stroke="var(--accent-primary)"
                        strokeWidth={2}
                        className="cursor-pointer"
                        onClick={() => handleSelectDay(index)}
                      />
                    );
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'var(--accent-primary)',
                    stroke: 'var(--chart-dot-bg)',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Day Selector Chips — Yesterday (1 day before today) shows small pencil icon while editable */}
          <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label="Select a day to inspect">
            {chartData.map((day, idx) => {
              const selected = idx === selectedDayIndex;
              const isEditable = isEditablePastDate(day.date, todayKey);
              return (
                <button
                  key={`day-select-${day.date}`}
                  type="button"
                  data-testid={isEditable ? 'stats-editable-date-chip' : `stats-date-chip-${idx}`}
                  onClick={() => handleSelectDay(idx)}
                  aria-pressed={selected}
                  title={
                    isEditable
                      ? `Click to edit ${day.dayShort}, ${day.date.slice(5)} meals or workouts`
                      : `Inspect ${day.dayShort}, ${day.date.slice(5)}`
                  }
                  className={`${
                    selected ? 'glass-block-active' : 'glass-block'
                  } relative rounded-xl px-1 py-1.5 text-center transition-all cursor-pointer`}
                >
                  {isEditable && (
                    <Pencil
                      data-testid="stats-date-pencil-icon"
                      className="absolute top-1 right-1 h-2.5 w-2.5 shrink-0 sm:hidden"
                      style={{ color: 'var(--accent-primary)' }}
                      aria-label="Editable date"
                    />
                  )}
                  <span
                    className="inline-flex items-center justify-center gap-0.5 text-[11px] font-semibold"
                    style={{ color: selected ? 'var(--accent-primary)' : 'var(--ink-secondary)' }}
                  >
                    {day.dayShort}
                    {isEditable && (
                      <Pencil
                        className="hidden h-2.5 w-2.5 shrink-0 sm:inline-block"
                        style={{ color: 'var(--accent-primary)' }}
                        aria-hidden="true"
                      />
                    )}
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
            <div
              className="mt-5 grid grid-cols-2 gap-4 border-t pt-5 sm:grid-cols-4"
              style={{ borderColor: 'var(--divider-hairline)' }}
            >
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Selected Day
                </p>
                {selectedDayIsEditable ? (
                  <button
                    type="button"
                    data-testid="stats-selected-date-edit-btn"
                    onClick={() => setYesterdayEditorOpen((prev) => !prev)}
                    aria-expanded={yesterdayEditorOpen}
                    className="font-display mt-0.5 inline-flex items-center gap-1.5 rounded-lg text-base font-bold transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--accent-primary)' }}
                    title="Edit yesterday's meals or workouts"
                  >
                    {selectedDay.dayShort}, {selectedDay.date.slice(5)}
                    <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </button>
                ) : (
                  <p className="font-display mt-0.5 text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                    {selectedDay.dayShort}, {selectedDay.date.slice(5)}
                  </p>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Energy &amp; Net
                </p>
                <p className="font-tabular mt-0.5 text-base font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {selectedDay.calories.toLocaleString('en-US')} kcal
                </p>
                <p className="font-tabular text-[11px] leading-snug" style={{ color: 'var(--ink-muted)' }}>
                  {selectedDay.burnedCalories > 0
                    ? `−${selectedDay.burnedCalories} burnt · ${selectedDay.netCalories} net`
                    : selectedDay.calories === 0
                    ? `${profile.dailyCalorieTarget.toLocaleString('en-US')} left`
                    : selectedDay.calories > profile.dailyCalorieTarget
                    ? `+${(selectedDay.calories - profile.dailyCalorieTarget).toLocaleString('en-US')} over`
                    : `${(profile.dailyCalorieTarget - selectedDay.calories).toLocaleString('en-US')} under`}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Macros (P / C / F)
                </p>
                <p className="font-tabular mt-0.5 text-sm font-semibold leading-snug" style={{ color: 'var(--ink-secondary)' }}>
                  {selectedDay.protein}g / {selectedDay.carbs}g / {selectedDay.fat}g
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Hydration
                </p>
                <p className="font-tabular mt-0.5 text-base font-semibold" style={{ color: 'var(--water-ink)' }}>
                  {formatWaterLiters(selectedDay.waterMl)}
                </p>
              </div>
            </div>
          )}

          {/* Inline Yesterday Editor (only available for 1 day before today) */}
          {selectedDay && selectedDayIsEditable && yesterdayEditorOpen && (
            <div
              data-testid="stats-yesterday-editor"
              className="mt-5 border-t pt-5"
              style={{ borderColor: 'var(--divider-hairline)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold" style={{ color: 'var(--ink-primary)' }}>
                    Edit Yesterday ({selectedDay.dayShort}, {selectedDay.date.slice(5)})
                  </h3>
                  <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    Update or log meals and workouts for 1 day before today.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    role="tablist"
                    aria-label="Edit yesterday category"
                    className="glass-block inline-flex items-center gap-1 rounded-xl p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={editorTab === 'meals'}
                      onClick={() => {
                        setEditorTab('meals');
                        setEditError(null);
                      }}
                      className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        editorTab === 'meals' ? 'glass-block-active' : ''
                      }`}
                      style={{
                        color: editorTab === 'meals' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                      }}
                    >
                      <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
                      Meals ({selectedDayMeals.length})
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={editorTab === 'workouts'}
                      onClick={() => {
                        setEditorTab('workouts');
                        setEditError(null);
                      }}
                      className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        editorTab === 'workouts' ? 'glass-block-active' : ''
                      }`}
                      style={{
                        color: editorTab === 'workouts' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                      }}
                    >
                      <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
                      Workouts ({selectedDayWorkouts.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setYesterdayEditorOpen(false)}
                    aria-label="Close yesterday editor"
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editError && (
                <p role="alert" className="mt-3 text-xs font-semibold" style={{ color: 'var(--danger-ink)' }}>
                  {editError}
                </p>
              )}

              {editorTab === 'meals' ? (
                <div className="mt-4 space-y-3">
                  <div className="divide-y divide-black/6 dark:divide-white/10">
                    {selectedDayMeals.length === 0 ? (
                      <p className="py-4 text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                        No meals logged for yesterday yet.
                      </p>
                    ) : (
                      selectedDayMeals.map((meal) =>
                        editingMealId === meal.id ? (
                          <form
                            key={meal.id}
                            onSubmit={saveMealEdit}
                            className="py-3 space-y-2.5"
                          >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                              <input
                                type="text"
                                aria-label="Meal name"
                                value={editMealName}
                                onChange={(e) => setEditMealName(e.target.value)}
                                className="glass-block sm:col-span-7 min-h-[38px] rounded-xl px-3 py-1.5 text-xs outline-none"
                                style={{ color: 'var(--ink-primary)' }}
                              />
                              <select
                                aria-label="Meal type"
                                value={editMealType}
                                onChange={(e) => setEditMealType(e.target.value as MealType)}
                                className="glass-block sm:col-span-5 min-h-[38px] rounded-xl px-3 py-1.5 text-xs outline-none"
                                style={{ color: 'var(--ink-primary)' }}
                              >
                                {MEAL_TYPES.map((mt) => (
                                  <option key={mt.id} value={mt.id}>
                                    {mt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  kcal
                                </label>
                                <input
                                  type="number"
                                  aria-label="Meal calories"
                                  value={editMealKcal}
                                  onChange={(e) => setEditMealKcal(e.target.value)}
                                  className="font-tabular glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Protein (g)
                                </label>
                                <input
                                  type="number"
                                  aria-label="Meal protein"
                                  value={editMealP}
                                  onChange={(e) => setEditMealP(e.target.value)}
                                  className="font-tabular glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Carbs (g)
                                </label>
                                <input
                                  type="number"
                                  aria-label="Meal carbs"
                                  value={editMealC}
                                  onChange={(e) => setEditMealC(e.target.value)}
                                  className="font-tabular glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Fat (g)
                                </label>
                                <input
                                  type="number"
                                  aria-label="Meal fat"
                                  value={editMealF}
                                  onChange={(e) => setEditMealF(e.target.value)}
                                  className="font-tabular glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMealId(null);
                                  setEditError(null);
                                }}
                                className="min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                                style={{ color: 'var(--ink-secondary)' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn-theme-gradient inline-flex min-h-[34px] items-center gap-1 rounded-lg px-3.5 py-1 text-xs font-semibold cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div key={meal.id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                {meal.name}
                              </p>
                              <p className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                                {meal.mealType} · {meal.time} · {meal.protein}g P / {meal.carbs}g C / {meal.fat}g F
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-tabular text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                {meal.calories} kcal
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditingMeal(meal)}
                                aria-label={`Edit ${meal.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteMeal(meal.id)}
                                aria-label={`Delete ${meal.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-400 cursor-pointer"
                                style={{ color: 'var(--ink-muted)' }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onLogMealsForDate(selectedDay.date)}
                      className="btn-theme-gradient inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Log Meal for Yesterday
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="divide-y divide-black/6 dark:divide-white/10">
                    {selectedDayWorkouts.length === 0 ? (
                      <p className="py-4 text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                        No workouts logged for yesterday yet.
                      </p>
                    ) : (
                      selectedDayWorkouts.map((wk) =>
                        editingWorkoutId === wk.id ? (
                          <form
                            key={wk.id}
                            onSubmit={saveWorkoutEdit}
                            className="py-3 space-y-2.5"
                          >
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                              <div className="sm:col-span-6">
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Workout name
                                </label>
                                <input
                                  type="text"
                                  aria-label="Workout name"
                                  value={editWkName}
                                  onChange={(e) => setEditWkName(e.target.value)}
                                  className="glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Burnt (kcal)
                                </label>
                                <input
                                  type="number"
                                  aria-label="Calories burnt"
                                  value={editWkKcal}
                                  onChange={(e) => setEditWkKcal(e.target.value)}
                                  className="font-tabular glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-semibold" style={{ color: 'var(--ink-muted)' }}>
                                  Time (min)
                                </label>
                                <input
                                  type="number"
                                  aria-label="Workout duration"
                                  value={editWkDuration}
                                  onChange={(e) => setEditWkDuration(e.target.value)}
                                  className="font-tabular glass-block mt-0.5 w-full min-h-[36px] rounded-lg px-2.5 py-1 text-xs outline-none"
                                  style={{ color: 'var(--ink-primary)' }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingWorkoutId(null);
                                  setEditError(null);
                                }}
                                className="min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                                style={{ color: 'var(--ink-secondary)' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn-theme-gradient inline-flex min-h-[34px] items-center gap-1 rounded-lg px-3.5 py-1 text-xs font-semibold cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                Save
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div key={wk.id} className="flex items-center justify-between gap-3 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                                {wk.name}
                              </p>
                              <p className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                                {wk.time} · {wk.details}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-tabular text-xs font-semibold" style={{ color: 'var(--burn-ink)' }}>
                                −{wk.caloriesBurned} kcal
                              </span>
                              <button
                                type="button"
                                onClick={() => startEditingWorkout(wk)}
                                aria-label={`Edit ${wk.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteWorkout(wk.id)}
                                aria-label={`Delete ${wk.name}`}
                                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-400 cursor-pointer"
                                style={{ color: 'var(--ink-muted)' }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onLogWorkoutsForDate(selectedDay.date)}
                      className="btn-theme-gradient inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Log Workout for Yesterday
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

          {/* Weekly 7-Day Interactive Hydration Trend Chart (Recharts) */}
          <section
            aria-label="Weekly hydration trend chart"
            className="glass-panel rounded-3xl p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                  Weekly Hydration Trend
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  {hydrationPatternSummary}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium" style={{ color: 'var(--ink-secondary)' }}>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-xs"
                    style={{ backgroundColor: 'var(--water-fill)' }}
                    aria-hidden="true"
                  />
                  Water intake (ml)
                </span>
                <span className="inline-flex items-center gap-1.5 font-tabular">
                  <span
                    className="inline-block w-4 border-t-2 border-dashed"
                    style={{ borderColor: 'var(--water-fill)' }}
                    aria-hidden="true"
                  />
                  Goal {profile.dailyWaterTargetMl.toLocaleString('en-US')} ml
                </span>
              </div>
            </div>

            {/* Recharts Weekly Hydration Composed Chart */}
            <div
              className="mt-5 h-60 w-full"
              role="img"
              aria-label="7-day daily water intake in milliliters compared against daily hydration goal"
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={hydrationChartData}
                  margin={{ top: 18, right: 12, left: 2, bottom: 4 }}
                  onClick={(state) => {
                    const idx =
                      typeof state?.activeTooltipIndex === 'number'
                        ? state.activeTooltipIndex
                        : Number(state?.activeTooltipIndex);
                    if (!Number.isNaN(idx) && idx >= 0 && idx < hydrationChartData.length) {
                      setSelectedDayIndex(idx);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="weeklyHydrationTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--water-fill)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--water-fill)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--chart-grid)"
                    strokeDasharray="3 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dayShort"
                    axisLine={{ stroke: 'var(--chart-axis)' }}
                    tickLine={false}
                    tick={{
                      fill: 'var(--ink-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, hydrationSummary.yAxisMaxMl]}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tick={{
                      fill: 'var(--ink-muted)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                    tickFormatter={(value: number) => `${value.toLocaleString('en-US')}`}
                  />
                  <Tooltip
                    content={<WeeklyHydrationTooltip />}
                    cursor={{ fill: 'var(--chart-cursor)' }}
                  />
                  <ReferenceLine
                    y={profile.dailyWaterTargetMl}
                    stroke="var(--water-fill)"
                    strokeWidth={1.75}
                    strokeDasharray="6 4"
                    label={{
                      value: `Goal ${profile.dailyWaterTargetMl.toLocaleString('en-US')} ml`,
                      position: 'insideTopRight',
                      fill: 'var(--water-ink)',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="waterMl"
                    barSize={26}
                    radius={[8, 8, 2, 2]}
                    isAnimationActive={false}
                    onClick={(_data, idx) => {
                      if (typeof idx === 'number') setSelectedDayIndex(idx);
                    }}
                  >
                    {hydrationChartData.map((entry, idx) => {
                      const isSelected = idx === selectedDayIndex;
                      const metGoal = entry.waterMl >= profile.dailyWaterTargetMl;
                      const fill = isSelected
                        ? 'var(--water-fill)'
                        : metGoal
                        ? 'rgba(14, 165, 233, 0.42)'
                        : 'var(--water-soft)';
                      return (
                        <Cell
                          key={`water-bar-${entry.date}`}
                          fill={fill}
                          stroke={isSelected ? 'var(--water-fill)' : 'var(--border-glass)'}
                          strokeWidth={1}
                          className="cursor-pointer"
                        />
                      );
                    })}
                  </Bar>
                  <Area
                    type="monotone"
                    dataKey="waterMl"
                    stroke="var(--water-fill)"
                    strokeWidth={2.25}
                    fill="url(#weeklyHydrationTrendFill)"
                    isAnimationActive={false}
                    dot={(dotProps) => {
                      const { cx, cy, index } = dotProps;
                      if (typeof cx !== 'number' || typeof cy !== 'number' || typeof index !== 'number') {
                        return <g key={`water-empty-${String(index)}`} />;
                      }
                      const isSelected = index === selectedDayIndex;
                      return (
                        <circle
                          key={`water-dot-${hydrationChartData[index]?.date ?? index}`}
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 5 : 3.5}
                          fill={isSelected ? 'var(--water-fill)' : 'var(--chart-dot-bg)'}
                          stroke="var(--water-fill)"
                          strokeWidth={2}
                          className="cursor-pointer"
                          onClick={() => setSelectedDayIndex(index)}
                        />
                      );
                    }}
                    activeDot={{
                      r: 6,
                      fill: 'var(--water-fill)',
                      stroke: 'var(--chart-dot-bg)',
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Hydration Day Selector Chips (ml readout) */}
            <div
              className="mt-3 grid grid-cols-7 gap-1.5"
              role="group"
              aria-label="Select a day to inspect hydration"
            >
              {hydrationChartData.map((day, idx) => {
                const selected = idx === selectedDayIndex;
                return (
                  <button
                    key={`water-day-select-${day.date}`}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    aria-pressed={selected}
                    className={`${
                      selected ? 'glass-block-active' : 'glass-block'
                    } rounded-xl px-1 py-1.5 text-center transition-all cursor-pointer`}
                  >
                    <span
                      className="block text-[11px] font-semibold"
                      style={{ color: selected ? 'var(--water-ink)' : 'var(--ink-secondary)' }}
                    >
                      {day.dayShort}
                    </span>
                    <span
                      className="font-tabular block text-[10px]"
                      style={{ color: selected ? 'var(--ink-primary)' : 'var(--ink-muted)' }}
                    >
                      {day.waterMl > 0 ? `${day.waterMl}` : '0'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Hydration Summary Row */}
            {selectedDay && (
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs"
                style={{ borderColor: 'var(--divider-hairline)' }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--ink-muted)' }}>
                    {selectedDay.dayShort}, {selectedDay.date.slice(5)}:
                  </span>
                  <span className="font-tabular font-semibold" style={{ color: 'var(--water-ink)' }}>
                    {selectedDay.waterMl.toLocaleString('en-US')} ml ({formatWaterLiters(selectedDay.waterMl)})
                  </span>
                </div>
                <span className="font-tabular font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  {selectedDay.waterMl >= profile.dailyWaterTargetMl
                    ? `Goal met (+${(selectedDay.waterMl - profile.dailyWaterTargetMl).toLocaleString('en-US')} ml)`
                    : `${(profile.dailyWaterTargetMl - selectedDay.waterMl).toLocaleString('en-US')} ml remaining to goal`}
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
