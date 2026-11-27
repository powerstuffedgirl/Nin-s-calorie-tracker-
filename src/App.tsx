import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Droplets, Dumbbell, Home, Plus, User } from 'lucide-react';
import {
  AppState,
  ExerciseOption,
  MealEntry,
  MealType,
  MilestoneEvent,
  PageId,
  ProfileSettings,
  ThemeId,
  WaterEntry,
  WorkoutEntry,
} from './types/tracker';
import {
  BEGOVA_CORBA_PRESET,
  formatLocalDateKey,
  LAUREL_NOTES,
} from './data/seedData';
import {
  clearTrackerDataToZero,
  loadAppState,
  resetAppState,
  saveAppState,
} from './utils/storage';
import {
  calculateDailyBurnedKcal,
  calculateDailyTotals,
  calculateDailyWaterMl,
  calculateStreak,
  calculateWeeklyOverview,
  detectCalorieMilestone,
  detectWaterMilestone,
  NormalizedAiMealItem,
  shiftDateKey,
} from './utils/trackerLogic';
import { DoodleBackground } from './components/DoodleBackground';
import { OrbitingUnicornBrand } from './components/OrbitingUnicornBrand';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { LaurelBubble } from './components/LaurelBubble';
import { MilestoneCelebration } from './components/MilestoneCelebration';
import { HomePage } from './components/HomePage';
import { WaterPage } from './components/WaterPage';
import { WorkoutPage } from './components/WorkoutPage';
import { StatsPage } from './components/StatsPage';
import { ProfilePage } from './components/ProfilePage';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const THEME_META_COLORS: Record<ThemeId, { light: string; dark: string }> = {
  unicorn: { light: '#fce4ef', dark: '#170b14' },
  thunder: { light: '#fef4b0', dark: '#151209' },
  soup: { light: '#ffd6da', dark: '#1a0c0e' },
  copper: { light: '#f4cfb4', dark: '#170e0a' },
};

function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const NAV_ITEMS: { id: PageId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function App() {
  const todayKey = useMemo(() => formatLocalDateKey(new Date()), []);
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activePage, setActivePage] = useState<PageId>('home');
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [workoutDate, setWorkoutDate] = useState<string>(todayKey);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [showMealComposer, setShowMealComposer] = useState<boolean>(false);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneEvent | null>(null);
  const aiInputRef = useRef<HTMLInputElement | null>(null);

  const hasAppliedThemeRef = useRef(false);

  // Sync theme attribute, dark mode class & mobile browser theme-color atomically to <html>
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (hasAppliedThemeRef.current) {
      root.classList.add('theme-switching');
    }
    root.setAttribute('data-theme', state.theme);
    root.classList.toggle('dark', state.darkMode);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        state.darkMode ? THEME_META_COLORS[state.theme].dark : THEME_META_COLORS[state.theme].light
      );
    }
    if (hasAppliedThemeRef.current) {
      // Force synchronous style flush so every token updates in one atomic frame
      void root.offsetHeight;
      const rafId = window.requestAnimationFrame(() => {
        root.classList.remove('theme-switching');
      });
      return () => {
        window.cancelAnimationFrame(rafId);
        root.classList.remove('theme-switching');
      };
    }
    hasAppliedThemeRef.current = true;
  }, [state.theme, state.darkMode]);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const triggerMilestone = useCallback(
    (event: MilestoneEvent) => {
      if (!state.profile.celebrationsEnabled) return;
      setActiveMilestone(event);
    },
    [state.profile.celebrationsEnabled]
  );

  const selectedDayTotals = useMemo(
    () => calculateDailyTotals(state.meals, selectedDate),
    [state.meals, selectedDate]
  );

  const todayTotals = useMemo(
    () => calculateDailyTotals(state.meals, todayKey),
    [state.meals, todayKey]
  );

  const mealsForSelectedDate = useMemo(
    () => state.meals.filter((m) => m.date === selectedDate),
    [state.meals, selectedDate]
  );

  const todayWaterLogs = useMemo(
    () => state.waterLogs.filter((w) => w.date === todayKey),
    [state.waterLogs, todayKey]
  );

  const todayWaterMl = useMemo(
    () => calculateDailyWaterMl(state.waterLogs, todayKey),
    [state.waterLogs, todayKey]
  );

  const todayWorkouts = useMemo(
    () => state.workouts.filter((w) => w.date === todayKey),
    [state.workouts, todayKey]
  );

  const todayBurnedKcal = useMemo(
    () => calculateDailyBurnedKcal(state.workouts, todayKey),
    [state.workouts, todayKey]
  );

  const workoutsForWorkoutDate = useMemo(
    () => state.workouts.filter((w) => w.date === workoutDate),
    [state.workouts, workoutDate]
  );

  const intakeForWorkoutDate = useMemo(
    () => calculateDailyTotals(state.meals, workoutDate).calories,
    [state.meals, workoutDate]
  );

  const streak = useMemo(
    () => calculateStreak(state.meals, state.waterLogs, todayKey, state.workouts),
    [state.meals, state.waterLogs, todayKey, state.workouts]
  );

  const weeklyOverview = useMemo(
    () =>
      calculateWeeklyOverview(
        state.meals,
        state.waterLogs,
        todayKey,
        state.profile.dailyCalorieTarget,
        state.workouts
      ),
    [state.meals, state.waterLogs, todayKey, state.profile.dailyCalorieTarget, state.workouts]
  );

  const handleSetTheme = (theme: ThemeId) => {
    setState((prev) => ({ ...prev, theme }));
  };

  const handleToggleDarkMode = () => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleAddMeal = (mealInput: {
    name: string;
    mealType: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    portion?: string;
    aiEstimated?: boolean;
    isBegovaCorba?: boolean;
  }) => {
    const prevKcal = calculateDailyTotals(state.meals, selectedDate).calories;
    const newEntry: MealEntry = {
      id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      name: mealInput.name,
      mealType: mealInput.mealType,
      calories: mealInput.calories,
      protein: mealInput.protein,
      carbs: mealInput.carbs,
      fat: mealInput.fat,
      time: getCurrentTimeHHMM(),
      portion: mealInput.portion,
      aiEstimated: mealInput.aiEstimated,
      isBegovaCorba: mealInput.isBegovaCorba,
    };

    const nextKcal = prevKcal + newEntry.calories;
    const calMilestone = detectCalorieMilestone(
      prevKcal,
      nextKcal,
      state.profile.dailyCalorieTarget,
      selectedDate,
      state.celebratedMilestones
    );

    setState((prev) => ({
      ...prev,
      meals: [newEntry, ...prev.meals],
      celebratedMilestones: calMilestone
        ? [...prev.celebratedMilestones, calMilestone.id]
        : prev.celebratedMilestones,
    }));

    if (calMilestone) {
      triggerMilestone(calMilestone);
    } else if (mealInput.isBegovaCorba) {
      triggerMilestone({
        id: `begova-${Date.now()}`,
        title: 'Prijatno! Begova čorba logged',
        subtitle: `+${BEGOVA_CORBA_PRESET.calories} kcal added to ${mealInput.mealType}. Warm, nourishing comfort!`,
      });
    }
  };

  const handleLogAiItems = (
    items: NormalizedAiMealItem[],
    mealType: MealType
  ): string[] => {
    const prevKcal = calculateDailyTotals(state.meals, selectedDate).calories;
    const nowTime = getCurrentTimeHHMM();
    const newEntries: MealEntry[] = items.map((item, idx) => ({
      id: `ai-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      date: selectedDate,
      name: item.name,
      portion: item.portion,
      mealType,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      time: nowTime,
      aiEstimated: true,
      isBegovaCorba: item.name.toLowerCase().includes('begova'),
    }));

    const addedKcal = newEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const nextKcal = prevKcal + addedKcal;
    const calMilestone = detectCalorieMilestone(
      prevKcal,
      nextKcal,
      state.profile.dailyCalorieTarget,
      selectedDate,
      state.celebratedMilestones
    );

    setState((prev) => ({
      ...prev,
      meals: [...newEntries, ...prev.meals],
      celebratedMilestones: calMilestone
        ? [...prev.celebratedMilestones, calMilestone.id]
        : prev.celebratedMilestones,
    }));

    if (calMilestone) {
      triggerMilestone(calMilestone);
    }

    return newEntries.map((entry) => entry.id);
  };

  const handleUndoLoggedIds = (ids: string[]) => {
    const idSet = new Set(ids);
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => !idSet.has(m.id)),
    }));
  };

  const handleQuickAddBegova = (mealType: MealType) => {
    handleAddMeal({
      name: BEGOVA_CORBA_PRESET.name,
      portion: '1 bowl (~300 ml)',
      mealType,
      calories: BEGOVA_CORBA_PRESET.calories,
      protein: BEGOVA_CORBA_PRESET.protein,
      carbs: BEGOVA_CORBA_PRESET.carbs,
      fat: BEGOVA_CORBA_PRESET.fat,
      isBegovaCorba: true,
    });
  };

  const handleDeleteMeal = (id: string) => {
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== id),
    }));
  };

  const handleUpdateMeal = (
    id: string,
    updates: {
      name: string;
      mealType: MealType;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  ) => {
    setState((prev) => ({
      ...prev,
      meals: prev.meals.map((m) =>
        m.id === id
          ? {
              ...m,
              name: updates.name,
              mealType: updates.mealType,
              calories: Math.max(0, Math.round(updates.calories)),
              protein: Math.max(0, Math.round(updates.protein)),
              carbs: Math.max(0, Math.round(updates.carbs)),
              fat: Math.max(0, Math.round(updates.fat)),
            }
          : m
      ),
    }));
  };

  const handleAddWater = (amountMl: number, label: string) => {
    const prevMl = calculateDailyWaterMl(state.waterLogs, todayKey);
    const nextMl = prevMl + amountMl;
    const waterMilestone = detectWaterMilestone(
      prevMl,
      nextMl,
      state.profile.dailyWaterTargetMl,
      todayKey,
      state.celebratedMilestones
    );

    const newEntry: WaterEntry = {
      id: `water-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: todayKey,
      amountMl,
      label,
      time: getCurrentTimeHHMM(),
    };

    setState((prev) => ({
      ...prev,
      waterLogs: [newEntry, ...prev.waterLogs],
      celebratedMilestones: waterMilestone
        ? [...prev.celebratedMilestones, waterMilestone.id]
        : prev.celebratedMilestones,
    }));

    if (waterMilestone) {
      triggerMilestone(waterMilestone);
    }
  };

  const handleDeleteWater = (id: string) => {
    setState((prev) => ({
      ...prev,
      waterLogs: prev.waterLogs.filter((w) => w.id !== id),
    }));
  };

  const handleAddWorkout = (
    entry: Omit<WorkoutEntry, 'id' | 'date' | 'time'>,
    targetDate?: string
  ): string => {
    const id = `wk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newWorkout: WorkoutEntry = {
      ...entry,
      id,
      date: targetDate ?? workoutDate,
      time: getCurrentTimeHHMM(),
    };
    setState((prev) => ({
      ...prev,
      workouts: [newWorkout, ...prev.workouts],
    }));
    return id;
  };

  const handleDeleteWorkout = (id: string) => {
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.filter((w) => w.id !== id),
    }));
  };

  const handleUpdateWorkout = (
    id: string,
    updates: {
      name: string;
      caloriesBurned: number;
      durationMin: number;
      details?: string;
    }
  ) => {
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.map((w) =>
        w.id === id
          ? {
              ...w,
              name: updates.name,
              caloriesBurned: Math.max(1, Math.round(updates.caloriesBurned)),
              durationMin: Math.max(1, Math.round(updates.durationMin)),
              details: updates.details !== undefined ? updates.details : w.details,
            }
          : w
      ),
    }));
  };

  const handleLogMealsForDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setActivePage('home');
    window.setTimeout(() => {
      aiInputRef.current?.focus();
      aiInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleLogWorkoutsForDate = (dateKey: string) => {
    setWorkoutDate(dateKey);
    setActivePage('workout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddCustomExercise = (exercise: ExerciseOption) => {
    setState((prev) => ({
      ...prev,
      customExercises: [...prev.customExercises, exercise],
    }));
  };

  const handleSaveProfile = (profile: ProfileSettings) => {
    setState((prev) => ({ ...prev, profile }));
  };

  const handleTopBarLogMeal = () => {
    setActivePage('home');
    setSelectedDate(todayKey);
    window.setTimeout(() => {
      aiInputRef.current?.focus();
      aiInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  return (
    <div className="relative min-h-screen pb-32 md:pb-44">
      {/* Pastel blur + floating crayon doodle canvas */}
      <DoodleBackground theme={state.theme} />

      {/* Sparkles & Confetti on Milestones */}
      <MilestoneCelebration
        milestone={activeMilestone}
        theme={state.theme}
        onDismiss={() => setActiveMilestone(null)}
      />

      {/* Strict 3-Zone Sleek Top Bar */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--divider-hairline)',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Brand with running/orbiting unicorn around "Nin" */}
          <OrbitingUnicornBrand onClick={() => setActivePage('home')} />

          {/* Zone 2: 4 clean single-line navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'workout') setWorkoutDate(todayKey);
                    setActivePage(item.id);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className="relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  style={{
                    color: active ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <button
            type="button"
            onClick={handleTopBarLogMeal}
            className="btn-theme-gradient inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Log Meal
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        {/* Compact Icon-Only Theme Toggle Bar + In-App PWA Install */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <ThemeSwitcher
            theme={state.theme}
            darkMode={state.darkMode}
            onChange={handleSetTheme}
            onToggleDarkMode={handleToggleDarkMode}
          />
          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <p className="hidden sm:block text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
              AI calorie tracker · Metric units
            </p>
          </div>
        </div>

        {activePage === 'home' && (
          <HomePage
            selectedDate={selectedDate}
            todayKey={todayKey}
            onChangeDate={(delta) => setSelectedDate((prev) => shiftDateKey(prev, delta))}
            onResetToToday={() => setSelectedDate(todayKey)}
            totals={selectedDayTotals}
            mealsForDate={mealsForSelectedDate}
            profile={state.profile}
            streak={streak}
            weeklyDays={weeklyOverview.days}
            selectedMealType={selectedMealType}
            onSelectMealType={setSelectedMealType}
            onQuickAddBegova={handleQuickAddBegova}
            onLogAiItems={handleLogAiItems}
            onUndoLoggedIds={handleUndoLoggedIds}
            onAddMeal={handleAddMeal}
            onDeleteMeal={handleDeleteMeal}
            showComposer={showMealComposer}
            onToggleComposer={setShowMealComposer}
            aiInputRef={aiInputRef}
            onOpenProfile={() => setActivePage('profile')}
          />
        )}

        {activePage === 'water' && (
          <WaterPage
            todayWaterMl={todayWaterMl}
            waterEntriesToday={todayWaterLogs}
            profile={state.profile}
            onAddWater={handleAddWater}
            onDeleteWater={handleDeleteWater}
          />
        )}

        {activePage === 'workout' && (
          <WorkoutPage
            selectedDate={workoutDate}
            todayKey={todayKey}
            onSelectDate={setWorkoutDate}
            todayIntakeKcal={intakeForWorkoutDate}
            todayWorkouts={workoutsForWorkoutDate}
            customExercises={state.customExercises}
            profile={state.profile}
            onAddWorkout={handleAddWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            onAddCustomExercise={handleAddCustomExercise}
            onOpenProfile={() => setActivePage('profile')}
          />
        )}

        {activePage === 'stats' && (
          <StatsPage
            todayKey={todayKey}
            todayTotals={todayTotals}
            todayBurnedKcal={todayBurnedKcal}
            todayWorkoutCount={todayWorkouts.length}
            weeklyOverview={weeklyOverview}
            profile={state.profile}
            meals={state.meals}
            workouts={state.workouts}
            onUpdateMeal={handleUpdateMeal}
            onDeleteMeal={handleDeleteMeal}
            onUpdateWorkout={handleUpdateWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            onLogMealsForDate={handleLogMealsForDate}
            onLogWorkoutsForDate={handleLogWorkoutsForDate}
          />
        )}

        {activePage === 'profile' && (
          <ProfilePage
            profile={state.profile}
            laurelDismissed={state.laurelDismissed}
            onSaveProfile={handleSaveProfile}
            onRestoreLaurel={() =>
              setState((prev) => ({ ...prev, laurelDismissed: false, laurelMinimized: false }))
            }
            onClearDataToZero={() => {
              const empty = clearTrackerDataToZero(state);
              setState(empty);
              setSelectedDate(todayKey);
              setWorkoutDate(todayKey);
            }}
            onResetData={() => {
              const fresh = resetAppState();
              setState(fresh);
              setSelectedDate(todayKey);
              setWorkoutDate(todayKey);
            }}
          />
        )}
      </main>

      {/* Draggable, Minimizable, Dismissible "Message from Laurel" Bubble */}
      <LaurelBubble
        dismissed={state.laurelDismissed}
        minimized={state.laurelMinimized}
        noteIndex={state.laurelNoteIndex}
        onNextNote={() =>
          setState((prev) => ({
            ...prev,
            laurelNoteIndex: (prev.laurelNoteIndex + 1) % LAUREL_NOTES.length,
          }))
        }
        onToggleMinimize={() =>
          setState((prev) => ({ ...prev, laurelMinimized: !prev.laurelMinimized }))
        }
        onDismiss={() => setState((prev) => ({ ...prev, laurelDismissed: true }))}
      />

      {/* Subtle Offline Indicator (only shown when browser is offline) */}
      <OfflineIndicator />

      {/* Mobile Bottom Tab Bar (Compact, <= 15% aggregate sticky height with header) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed right-0 bottom-0 left-0 z-30 grid h-16 grid-cols-5 items-center border-t backdrop-blur-md md:hidden"
        style={{
          backgroundColor: 'var(--mobile-nav-bg)',
          borderColor: 'var(--divider-hairline)',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'workout') setWorkoutDate(todayKey);
                setActivePage(item.id);
              }}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
              style={{
                color: active ? 'var(--accent-primary)' : 'var(--ink-muted)',
              }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] font-semibold whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
