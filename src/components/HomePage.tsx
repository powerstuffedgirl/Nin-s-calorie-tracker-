import React, { useRef, useState } from 'react';
import {
  Flame,
  Plus,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  DailyTotals,
  MealEntry,
  MealType,
  ProfileSettings,
  WeeklyDayStat,
} from '../types/tracker';
import { BEGOVA_CORBA_PRESET, QUICK_BOSNIAN_FAVORITES } from '../data/seedData';
import {
  calculateProgressPercent,
  MEAL_TYPES,
  NormalizedAiMealItem,
  validateMealForm,
} from '../utils/trackerLogic';
import { AiMealLogger } from './AiMealLogger';

interface HomePageProps {
  selectedDate: string;
  todayKey: string;
  onChangeDate: (delta: number) => void;
  onResetToToday: () => void;
  totals: DailyTotals;
  mealsForDate: MealEntry[];
  profile: ProfileSettings;
  streak: number;
  weeklyDays: WeeklyDayStat[];
  selectedMealType: MealType;
  onSelectMealType: (type: MealType) => void;
  onQuickAddBegova: (mealType: MealType) => void;
  onLogAiItems: (items: NormalizedAiMealItem[], mealType: MealType) => string[];
  onUndoLoggedIds: (ids: string[]) => void;
  onAddMeal: (meal: {
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
  onDeleteMeal: (id: string) => void;
  showComposer: boolean;
  onToggleComposer: (open: boolean) => void;
  aiInputRef?: React.RefObject<HTMLInputElement | null>;
  onOpenProfile?: () => void;
}

function MiniSoupBowlIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="h-9 w-9 shrink-0" aria-hidden="true">
      <path d="M16 15 C15 11, 19 9, 18 5" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M24 13 C23 9, 27 7, 26 3" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path d="M32 15 C31 11, 35 9, 34 5" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="24" cy="21" rx="15" ry="4" fill="#fde68a" stroke="var(--accent-primary)" strokeWidth="2" />
      <circle cx="19" cy="21" r="1.5" fill="#15803d" />
      <circle cx="27" cy="20" r="1.4" fill="#15803d" />
      <path
        d="M9 21 C10 34, 16 40, 24 40 C32 40, 38 34, 39 21"
        fill="var(--accent-soft)"
        stroke="var(--accent-primary)"
        strokeWidth="2"
      />
      <path d="M34 19 L42 11" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export const HomePage: React.FC<HomePageProps> = ({
  selectedDate,
  todayKey,
  onChangeDate,
  onResetToToday,
  totals,
  mealsForDate,
  profile,
  streak,
  weeklyDays,
  selectedMealType,
  onSelectMealType,
  onQuickAddBegova,
  onLogAiItems,
  onUndoLoggedIds,
  onAddMeal,
  onDeleteMeal,
  showComposer,
  onToggleComposer,
  aiInputRef,
  onOpenProfile,
}) => {
  const [filterMode, setFilterMode] = useState<'selected' | 'all'>('all');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const kcalPercent = calculateProgressPercent(totals.calories, profile.dailyCalorieTarget);
  const remainingKcal = profile.dailyCalorieTarget - totals.calories;
  const isOverTarget = remainingKcal < 0;

  // SVG ring geometry
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const clampedRatio = Math.min(1, Math.max(0, totals.calories / Math.max(1, profile.dailyCalorieTarget)));
  const strokeOffset = circumference * (1 - clampedRatio);

  const visibleMeals =
    filterMode === 'all'
      ? mealsForDate
      : mealsForDate.filter((m) => m.mealType === selectedMealType);

  const handleSubmitMeal = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateMealForm({ name, calories, protein, carbs, fat });
    if (!res.valid || !res.parsed) {
      setFormError(res.error ?? 'Please check the meal fields.');
      return;
    }
    setFormError(null);
    onAddMeal({
      ...res.parsed,
      mealType: selectedMealType,
    });
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    onToggleComposer(false);
  };

  const applyQuickPreset = (preset: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    setName(preset.name);
    setCalories(String(preset.calories));
    setProtein(String(preset.protein));
    setCarbs(String(preset.carbs));
    setFat(String(preset.fat));
    setFormError(null);
    onToggleComposer(true);
    window.setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const formattedDateHeading = (() => {
    if (selectedDate === todayKey) return 'Today';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  })();

  const macros = [
    {
      label: 'Protein',
      current: totals.protein,
      target: profile.proteinTargetG,
      color: 'var(--macro-protein)',
    },
    {
      label: 'Carbs',
      current: totals.carbs,
      target: profile.carbsTargetG,
      color: 'var(--macro-carbs)',
    },
    {
      label: 'Fat',
      current: totals.fat,
      target: profile.fatTargetG,
      color: 'var(--macro-fat)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Greeting & Date Navigator */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
            style={{ color: 'var(--ink-primary)' }}
          >
            Zdravo,{' '}
            <span style={{ color: 'var(--brand-title)' }}>{profile.name}</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            Type any meal and portion for instant AI calorie & macro tracking.
          </p>
        </div>

        <div className="glass-block inline-flex items-center gap-1 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => onChangeDate(-1)}
            aria-label="Previous day"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
            style={{ color: 'var(--ink-primary)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onResetToToday}
            className="min-w-[6.5rem] px-3 py-1.5 text-center text-xs font-semibold transition-colors hover:bg-white/55 dark:hover:bg-white/10 rounded-xl cursor-pointer whitespace-nowrap"
            style={{ color: 'var(--ink-primary)' }}
          >
            {formattedDateHeading}
          </button>
          <button
            type="button"
            onClick={() => onChangeDate(1)}
            disabled={selectedDate >= todayKey}
            aria-label="Next day"
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-white/60 dark:hover:bg-white/10 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
            style={{ color: 'var(--ink-primary)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Calorie Ring + Macros + Streak */}
        <section
          aria-label="Daily calorie and macro summary"
          className="space-y-6 lg:col-span-5"
        >
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                Daily Energy
              </h2>
              <span className="font-tabular text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                Target {profile.dailyCalorieTarget.toLocaleString('en-US')} kcal
              </span>
            </div>

            {/* Calorie Ring */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative flex h-52 w-52 items-center justify-center">
                <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="var(--accent-soft)"
                    strokeWidth="14"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="var(--accent-ring)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    className="transition-[stroke-dashoffset] duration-500 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    data-testid="daily-calories-value"
                    className="font-tabular text-4xl font-semibold tracking-tight"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    {totals.calories.toLocaleString('en-US')}
                  </span>
                  <span className="mt-0.5 text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                    kcal logged · {kcalPercent}%
                  </span>
                  <span
                    className="mt-2 text-xs font-semibold"
                    style={{
                      color: isOverTarget ? 'var(--danger-ink)' : 'var(--accent-primary)',
                    }}
                  >
                    {isOverTarget
                      ? `${Math.abs(remainingKcal).toLocaleString('en-US')} kcal over target`
                      : `${remainingKcal.toLocaleString('en-US')} kcal left`}
                  </span>
                </div>
              </div>
            </div>

            {/* Macronutrient Progress Bars */}
            <div className="space-y-4 border-t pt-5" style={{ borderColor: 'var(--divider-hairline)' }}>
              {macros.map((macro) => {
                const pct = Math.min(100, calculateProgressPercent(macro.current, macro.target));
                return (
                  <div key={macro.label}>
                    <div className="mb-1.5 flex items-baseline justify-between text-xs">
                      <span className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        {macro.label}
                      </span>
                      <span className="font-tabular" style={{ color: 'var(--ink-secondary)' }}>
                        {macro.current}g / {macro.target}g
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ backgroundColor: 'var(--track-bg)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: macro.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Streak Counter */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
                >
                  <Flame className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
                    Daily Streak
                  </p>
                  <p
                    data-testid="streak-count"
                    className="font-display text-2xl font-bold leading-tight"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    {streak} {streak === 1 ? 'day' : 'days'}
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium text-right" style={{ color: 'var(--ink-secondary)' }}>
                {streak >= 7 ? 'Full week strong' : 'Keep it glowing'}
              </span>
            </div>

            <div
              className="mt-5 grid grid-cols-7 gap-2 border-t pt-4"
              style={{ borderColor: 'var(--divider-hairline)' }}
            >
              {weeklyDays.map((day) => {
                const logged = day.calories > 0 || day.waterMl > 0 || day.burnedCalories > 0;
                const isToday = day.date === todayKey;
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                      {day.dayShort}
                    </span>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold"
                      style={{
                        background: logged ? 'var(--accent-primary)' : 'var(--surface-block)',
                        color: logged ? 'var(--accent-contrast)' : 'var(--ink-muted)',
                        outline: isToday ? '2px solid var(--accent-primary)' : 'none',
                        outlineOffset: '2px',
                      }}
                      title={`${day.dayShort}: ${day.calories} kcal`}
                    >
                      {logged ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : day.dayNumber}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: AI Meal Tracker + Begova čorba Quick-Add + Meal Selector & Log */}
        <section
          aria-label="Meal logging and food journal"
          className="space-y-6 lg:col-span-7"
        >
          {/* AI-Automated Natural Language Meal Tracker */}
          <AiMealLogger
            selectedMealType={selectedMealType}
            inputRef={aiInputRef}
            onLogAiItems={onLogAiItems}
            onUndoLoggedIds={onUndoLoggedIds}
            onOpenProfile={onOpenProfile}
          />

          {/* Featured One-Tap Quick-Add: Begova čorba (~290 kcal) */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <MiniSoupBowlIcon />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
                    One-tap Bosnian favorite
                  </p>
                  <h2
                    className="font-display text-lg font-bold leading-snug"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    {BEGOVA_CORBA_PRESET.name} (~{BEGOVA_CORBA_PRESET.calories} kcal)
                  </h2>
                  <p className="font-tabular mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                    {BEGOVA_CORBA_PRESET.protein}g Protein · {BEGOVA_CORBA_PRESET.carbs}g Carbs · {BEGOVA_CORBA_PRESET.fat}g Fat
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onQuickAddBegova(selectedMealType)}
                className="btn-theme-gradient inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Add Begova čorba
              </button>
            </div>
          </div>

          {/* Meal-Type Selector & Food Log */}
          <div className="glass-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                Meals
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode(filterMode === 'all' ? 'selected' : 'all')}
                  className="min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/50 dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  {filterMode === 'all' ? 'Showing all meals' : `Filtering: ${selectedMealType}`}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleComposer(!showComposer)}
                  className="glass-block inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/70 dark:hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
                  style={{
                    color: showComposer ? 'var(--ink-primary)' : 'var(--accent-primary)',
                  }}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  {showComposer ? 'Close manual' : 'Manual entry'}
                </button>
              </div>
            </div>

            {/* Meal-Type Blurred Rectangular Selector Blocks */}
            <div
              role="tablist"
              aria-label="Meal type selector"
              className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            >
              {MEAL_TYPES.map((mt) => {
                const active = selectedMealType === mt.id;
                const kcal = totals.byMealType[mt.id];
                return (
                  <button
                    key={mt.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      onSelectMealType(mt.id);
                      setFilterMode('selected');
                    }}
                    className={`flex min-h-[56px] flex-col items-start justify-center rounded-2xl px-3.5 py-2 text-left transition-all duration-150 cursor-pointer ${
                      active ? 'glass-block-active' : 'glass-block hover:bg-white/65 dark:hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="text-xs font-semibold whitespace-nowrap"
                      style={{ color: active ? 'var(--accent-primary)' : 'var(--ink-primary)' }}
                    >
                      {mt.label}
                    </span>
                    <span
                      className="font-tabular mt-0.5 text-xs"
                      style={{ color: 'var(--ink-muted)' }}
                    >
                      {kcal.toLocaleString('en-US')} kcal
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inline Manual Meal Form (Blurred Block) */}
            {showComposer && (
              <form
                onSubmit={handleSubmitMeal}
                noValidate
                className="glass-block mt-5 space-y-4 rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Manual entry for {MEAL_TYPES.find((m) => m.id === selectedMealType)?.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_BOSNIAN_FAVORITES.map((fav) => (
                      <button
                        key={fav.name}
                        type="button"
                        onClick={() => applyQuickPreset(fav)}
                        className="glass-block rounded-lg px-2.5 py-1 text-[11px] font-medium hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        {fav.name.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="meal-name"
                      className="mb-1 block text-xs font-semibold"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      Food or meal name
                    </label>
                    <input
                      ref={nameInputRef}
                      id="meal-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Burek sa sirom or Yogurt bowl"
                      className="glass-block w-full min-h-[42px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                      style={{ color: 'var(--ink-primary)' }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="meal-calories"
                      className="mb-1 block text-xs font-semibold"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      Calories (kcal)
                    </label>
                    <input
                      id="meal-calories"
                      type="number"
                      min="1"
                      max="5000"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="320"
                      className="font-tabular glass-block w-full min-h-[42px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                      style={{ color: 'var(--ink-primary)' }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label
                        htmlFor="meal-protein"
                        className="mb-1 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Protein (g)
                      </label>
                      <input
                        id="meal-protein"
                        type="number"
                        min="0"
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        placeholder="18"
                        className="font-tabular glass-block w-full min-h-[42px] rounded-xl px-2.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="meal-carbs"
                        className="mb-1 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Carbs (g)
                      </label>
                      <input
                        id="meal-carbs"
                        type="number"
                        min="0"
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        placeholder="30"
                        className="font-tabular glass-block w-full min-h-[42px] rounded-xl px-2.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="meal-fat"
                        className="mb-1 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Fat (g)
                      </label>
                      <input
                        id="meal-fat"
                        type="number"
                        min="0"
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        placeholder="12"
                        className="font-tabular glass-block w-full min-h-[42px] rounded-xl px-2.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">
                    {formError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      onToggleComposer(false);
                    }}
                    className="min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-theme-gradient min-h-[40px] rounded-xl px-5 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    Save meal
                  </button>
                </div>
              </form>
            )}

            {/* Logged Meal Entries */}
            <div className="mt-5 divide-y divide-black/6 dark:divide-white/10">
              {visibleMeals.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium" style={{ color: 'var(--ink-secondary)' }}>
                    No meals logged in this view yet.
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Type any meal in the AI tracker above or tap Begova čorba to log instantly.
                  </p>
                </div>
              ) : (
                visibleMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between gap-4 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-semibold"
                        style={{ color: 'var(--ink-primary)' }}
                      >
                        {meal.name}
                        {meal.portion && (
                          <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>
                            · {meal.portion}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                        <span className="capitalize">{meal.mealType}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-tabular">{meal.time}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-tabular">
                          {meal.protein}g P / {meal.carbs}g C / {meal.fat}g F
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="font-tabular text-sm font-semibold"
                        style={{ color: 'var(--ink-primary)' }}
                      >
                        {meal.calories} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteMeal(meal.id)}
                        aria-label={`Delete ${meal.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-400 cursor-pointer"
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
