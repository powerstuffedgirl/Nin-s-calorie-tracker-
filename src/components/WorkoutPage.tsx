import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  ExerciseOption,
  ExerciseTrackingMode,
  ProfileSettings,
  WalkPace,
  WorkoutEntry,
} from '../types/tracker';
import { DEFAULT_EXERCISES } from '../data/seedData';
import {
  calculateDailyWorkoutBreakdown,
  calculateNetCalories,
  calculateProgressPercent,
  parseDateKeyToLocal,
  shiftDateKey,
  validateExerciseInput,
  validateNormalWalkInput,
  validateTreadmillInput,
} from '../utils/trackerLogic';
import { estimateWorkoutBurn, WorkoutEstimateError } from '../utils/workoutClient';

const ADD_CUSTOM_ID = '__add_custom__';

interface WorkoutPageProps {
  selectedDate: string;
  todayKey: string;
  onSelectDate: (dateKey: string) => void;
  todayIntakeKcal: number;
  todayWorkouts: WorkoutEntry[];
  customExercises: ExerciseOption[];
  profile: ProfileSettings;
  onAddWorkout: (entry: Omit<WorkoutEntry, 'id' | 'date' | 'time'>, targetDate?: string) => string;
  onDeleteWorkout: (id: string) => void;
  onAddCustomExercise: (exercise: ExerciseOption) => void;
  onOpenProfile?: () => void;
}

interface RecentAiWorkoutLog {
  id: string;
  name: string;
  caloriesBurned: number;
  details: string;
  note: string;
}

const WALK_DURATION_PRESETS = [15, 30, 45, 60];

export const WorkoutPage: React.FC<WorkoutPageProps> = ({
  selectedDate,
  todayKey,
  onSelectDate,
  todayIntakeKcal,
  todayWorkouts,
  customExercises,
  profile,
  onAddWorkout,
  onDeleteWorkout,
  onAddCustomExercise,
  onOpenProfile,
}) => {
  const yesterdayKey = useMemo(() => shiftDateKey(todayKey, -1), [todayKey]);
  const isEditingYesterday = selectedDate === yesterdayKey;
  const activeDayLabel = isEditingYesterday ? 'Yesterday' : 'Today';
  const activeDateShort = useMemo(() => {
    const dt = parseDateKeyToLocal(selectedDate);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [selectedDate]);

  const breakdown = useMemo(
    () => calculateDailyWorkoutBreakdown(todayWorkouts, selectedDate),
    [todayWorkouts, selectedDate]
  );

  const netCalories = calculateNetCalories(todayIntakeKcal, breakdown.totalBurned);
  // Gentle daily active burn reference ring (300 kcal reference arc)
  const burnGoalRef = 300;
  const burnPct = calculateProgressPercent(breakdown.totalBurned, burnGoalRef);
  const ringRadius = 64;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringRatio = Math.min(1, Math.max(0, breakdown.totalBurned / burnGoalRef));
  const ringOffset = ringCirc * (1 - ringRatio);

  // --- Walking Rectangle State ---
  const [walkMode, setWalkMode] = useState<'treadmill' | 'normal'>('treadmill');
  const [treadmillTime, setTreadmillTime] = useState('30');
  const [treadmillSpeed, setTreadmillSpeed] = useState('5.5');
  const [treadmillDistance, setTreadmillDistance] = useState('2.75');
  const [distanceManuallyEdited, setDistanceManuallyEdited] = useState(false);

  const [normalWalkTime, setNormalWalkTime] = useState('30');
  const [walkPace, setWalkPace] = useState<WalkPace>('normal');

  const [walkLoading, setWalkLoading] = useState(false);
  const [walkError, setWalkError] = useState<string | null>(null);
  const [walkErrorCode, setWalkErrorCode] = useState<string | null>(null);
  const [lastWalkLog, setLastWalkLog] = useState<RecentAiWorkoutLog | null>(null);

  // --- Exercise Rectangle State ---
  const allExercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...customExercises],
    [customExercises]
  );

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(DEFAULT_EXERCISES[0].id);
  const [exerciseDropdownOpen, setExerciseDropdownOpen] = useState(false);
  const exerciseDropdownRef = useRef<HTMLDivElement | null>(null);

  // Custom Exercise Creator state
  const [customName, setCustomName] = useState('');
  const [customMode, setCustomMode] = useState<ExerciseTrackingMode>('weighted');
  const [customError, setCustomError] = useState<string | null>(null);

  // Exercise input fields
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('12');
  const [exWeightKg, setExWeightKg] = useState('10');
  const [exTimeValue, setExTimeValue] = useState('');
  const [exTimeUnit, setExTimeUnit] = useState<'min' | 'sec'>('sec');

  const [exLoading, setExLoading] = useState(false);
  const [exError, setExError] = useState<string | null>(null);
  const [exErrorCode, setExErrorCode] = useState<string | null>(null);
  const [lastExerciseLog, setLastExerciseLog] = useState<RecentAiWorkoutLog | null>(null);

  const isAddingCustom = selectedExerciseId === ADD_CUSTOM_ID;
  const activeExercise = useMemo(
    () => allExercises.find((ex) => ex.id === selectedExerciseId) ?? allExercises[0],
    [allExercises, selectedExerciseId]
  );

  // Close exercise dropdown on outside click or Escape
  useEffect(() => {
    if (!exerciseDropdownOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (exerciseDropdownRef.current && !exerciseDropdownRef.current.contains(e.target as Node)) {
        setExerciseDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExerciseDropdownOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exerciseDropdownOpen]);

  // Auto-sync treadmill distance when time & speed change (unless distance was manually typed)
  const syncTreadmillDistance = (nextTime: string, nextSpeed: string, manualLocked: boolean) => {
    if (manualLocked) return;
    const t = Number(nextTime);
    const s = Number(nextSpeed);
    if (!Number.isNaN(t) && t > 0 && !Number.isNaN(s) && s > 0) {
      const dist = Math.round(((s * t) / 60) * 100) / 100;
      setTreadmillDistance(String(dist));
    }
  };

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setExerciseDropdownOpen(false);
    setExError(null);
    setExErrorCode(null);
    setCustomError(null);

    if (id !== ADD_CUSTOM_ID) {
      const picked = allExercises.find((ex) => ex.id === id);
      if (picked) {
        if (picked.trackingMode === 'timed') {
          const unit = picked.defaultTimeUnit ?? 'sec';
          setExTimeUnit(unit);
          setExTimeValue(unit === 'sec' ? '60' : '15');
          setExSets('1');
        } else {
          setExSets('3');
          setExReps('12');
          setExTimeValue('');
          if (picked.trackingMode === 'weighted' && !exWeightKg) {
            setExWeightKg('10');
          }
        }
      }
    }
  };

  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customName.trim();
    if (trimmed.length < 2) {
      setCustomError('Enter an exercise name (at least 2 characters).');
      return;
    }
    if (trimmed.length > 60) {
      setCustomError('Keep the exercise name under 60 characters.');
      return;
    }

    const existing = allExercises.find(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      handleSelectExercise(existing.id);
      setCustomName('');
      return;
    }

    const created: ExerciseOption = {
      id: `custom-ex-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: trimmed,
      trackingMode: customMode,
      category: 'My Exercises',
      defaultTimeUnit: customMode === 'timed' ? 'sec' : undefined,
      isCustom: true,
    };

    onAddCustomExercise(created);
    setSelectedExerciseId(created.id);
    setCustomName('');
    setCustomError(null);
    if (customMode === 'timed') {
      setExTimeUnit('sec');
      setExTimeValue('60');
      setExSets('1');
    } else {
      setExSets('3');
      setExReps('12');
      setExTimeValue('');
    }
  };

  const handleWalkingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walkLoading) return;
    setWalkError(null);
    setWalkErrorCode(null);

    if (walkMode === 'treadmill') {
      const res = validateTreadmillInput({
        timeMin: treadmillTime,
        speedKmh: treadmillSpeed,
        distanceKm: treadmillDistance,
      });
      if (!res.valid || !res.parsed) {
        setWalkError(res.error ?? 'Please check your treadmill inputs.');
        setWalkErrorCode('INVALID_INPUT');
        return;
      }

      const { timeMin, speedKmh, distanceKm } = res.parsed;
      setTreadmillTime(String(timeMin));
      setTreadmillSpeed(String(speedKmh));
      setTreadmillDistance(String(distanceKm));

      setWalkLoading(true);
      try {
        const aiResult = await estimateWorkoutBurn({
          kind: 'treadmill',
          userWeightKg: profile.currentWeightKg,
          timeMin,
          speedKmh,
          distanceKm,
        });
        const details = `${timeMin} min · ${speedKmh} km/h · ${distanceKm} km`;
        const entryName = speedKmh >= 7.5 ? 'Treadmill Run' : 'Treadmill Walk';
        const createdId = onAddWorkout({
          kind: 'treadmill',
          name: entryName,
          caloriesBurned: aiResult.caloriesBurned,
          durationMin: Math.round(timeMin),
          details,
          aiNote: aiResult.note,
          aiEstimated: true,
          speedKmh,
          distanceKm,
        });
        setLastWalkLog({
          id: createdId,
          name: entryName,
          caloriesBurned: aiResult.caloriesBurned,
          details,
          note: aiResult.note,
        });
      } catch (err: unknown) {
        if (err instanceof WorkoutEstimateError) {
          setWalkError(err.message);
          setWalkErrorCode(err.code);
        } else {
          setWalkError('Unable to calculate treadmill burn right now. Please try again.');
          setWalkErrorCode('UNKNOWN');
        }
      } finally {
        setWalkLoading(false);
      }
      return;
    }

    // Normal walking mode
    const res = validateNormalWalkInput({
      timeMin: normalWalkTime,
      pace: walkPace,
    });
    if (!res.valid || !res.parsed) {
      setWalkError(res.error ?? 'Please enter walking time in minutes.');
      setWalkErrorCode('INVALID_INPUT');
      return;
    }

    const { timeMin, pace } = res.parsed;
    setWalkLoading(true);
    try {
      const aiResult = await estimateWorkoutBurn({
        kind: 'walking',
        userWeightKg: profile.currentWeightKg,
        timeMin,
        pace,
      });
      const entryName = pace === 'brisk' ? 'Brisk Walk' : 'Normal Walk';
      const details = `${timeMin} min · ${pace === 'brisk' ? 'Brisk walk' : 'Normal pace'}`;
      const createdId = onAddWorkout({
        kind: 'walking',
        name: entryName,
        caloriesBurned: aiResult.caloriesBurned,
        durationMin: Math.round(timeMin),
        details,
        aiNote: aiResult.note,
        aiEstimated: true,
        pace,
      });
      setLastWalkLog({
        id: createdId,
        name: entryName,
        caloriesBurned: aiResult.caloriesBurned,
        details,
        note: aiResult.note,
      });
    } catch (err: unknown) {
      if (err instanceof WorkoutEstimateError) {
        setWalkError(err.message);
        setWalkErrorCode(err.code);
      } else {
        setWalkError('Unable to calculate walking calories right now. Please try again.');
        setWalkErrorCode('UNKNOWN');
      }
    } finally {
      setWalkLoading(false);
    }
  };

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exLoading || isAddingCustom || !activeExercise) return;
    setExError(null);
    setExErrorCode(null);

    const res = validateExerciseInput({
      exerciseName: activeExercise.name,
      trackingMode: activeExercise.trackingMode,
      sets: exSets,
      reps: exReps,
      weightKg: exWeightKg,
      timeValue: exTimeValue,
      timeUnit: exTimeUnit,
    });

    if (!res.valid || !res.parsed) {
      setExError(res.error ?? 'Please check your exercise details.');
      setExErrorCode('INVALID_INPUT');
      return;
    }

    const parsed = res.parsed;
    setExLoading(true);
    try {
      const aiResult = await estimateWorkoutBurn({
        kind: 'exercise',
        userWeightKg: profile.currentWeightKg,
        exerciseName: parsed.exerciseName,
        trackingMode: parsed.trackingMode,
        sets: parsed.sets,
        reps: parsed.reps,
        weightKg: parsed.weightKg,
        durationMin: parsed.durationMin,
        durationSec: parsed.durationSec,
      });

      const createdId = onAddWorkout({
        kind: 'exercise',
        name: parsed.exerciseName,
        caloriesBurned: aiResult.caloriesBurned,
        durationMin: parsed.durationMin
          ? Math.max(1, Math.round(parsed.durationMin))
          : aiResult.estimatedDurationMin,
        details: parsed.details,
        aiNote: aiResult.note,
        aiEstimated: true,
        sets: parsed.sets,
        reps: parsed.reps,
        weightKg: parsed.weightKg,
      });

      setLastExerciseLog({
        id: createdId,
        name: parsed.exerciseName,
        caloriesBurned: aiResult.caloriesBurned,
        details: parsed.details,
        note: aiResult.note,
      });
    } catch (err: unknown) {
      if (err instanceof WorkoutEstimateError) {
        setExError(err.message);
        setExErrorCode(err.code);
      } else {
        setExError('Unable to calculate exercise burn right now. Please try again.');
        setExErrorCode('UNKNOWN');
      }
    } finally {
      setExLoading(false);
    }
  };

  const groupedExercises = useMemo(() => {
    const groups = new Map<string, ExerciseOption[]>();
    for (const ex of allExercises) {
      const list = groups.get(ex.category) ?? [];
      list.push(ex);
      groups.set(ex.category, list);
    }
    return Array.from(groups.entries());
  }, [allExercises]);

  const modeBadgeLabel = (mode: ExerciseTrackingMode) => {
    if (mode === 'weighted') return 'Sets · Reps · Weight · Time';
    if (mode === 'timed') return 'Time';
    return 'Sets · Reps · Time';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
            style={{ color: 'var(--ink-primary)' }}
          >
            Workout &amp; Calories Burnt
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
            {isEditingYesterday
              ? `Editing Yesterday (${activeDateShort}) · AI burn calibrated to ${profile.currentWeightKg} kg.`
              : `AI-calculated active burn calibrated to your weight (${profile.currentWeightKg} kg).`}
          </p>
        </div>

        {isEditingYesterday ? (
          <button
            type="button"
            onClick={() => onSelectDate(todayKey)}
            className="glass-block min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors hover:bg-white/60 dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
            style={{ color: 'var(--accent-primary)' }}
          >
            Back to Today
          </button>
        ) : (
          <span className="font-tabular text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
            Today · {todayWorkouts.length} {todayWorkouts.length === 1 ? 'session' : 'sessions'}
          </span>
        )}
      </div>

      {/* Main 3-Rectangle Workout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* RECTANGLE 1: Calories Burnt Summary */}
        <section
          aria-label={`${activeDayLabel}'s calories burnt`}
          className="glass-panel rounded-3xl p-6 lg:col-span-5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--burn-soft)', color: 'var(--burn-ink)' }}
                aria-hidden="true"
              >
                <Flame className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight" style={{ color: 'var(--ink-primary)' }}>
                  Calories Burnt
                </h2>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  {activeDayLabel}&apos;s active movement
                </p>
              </div>
            </div>
            <span className="font-tabular text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>
              {breakdown.totalMinutes} min active
            </span>
          </div>

          <div className="my-6 flex flex-col items-center gap-6 sm:flex-row">
            {/* Circular Burn Progress Ring */}
            <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
              <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="80"
                  cy="80"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--burn-soft)"
                  strokeWidth="14"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--burn-fill)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  className="transition-[stroke-dashoffset] duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  data-testid="workout-calories-burnt"
                  className="font-tabular text-3xl font-semibold tracking-tight leading-none"
                  style={{ color: 'var(--ink-primary)' }}
                >
                  {breakdown.totalBurned.toLocaleString('en-US')}
                </span>
                <span className="mt-1 text-xs font-medium" style={{ color: 'var(--burn-ink)' }}>
                  kcal burnt
                </span>
                <span className="font-tabular mt-0.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                  {burnPct}% of {burnGoalRef} ref
                </span>
              </div>
            </div>

            {/* Clean Unboxed Breakdown */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Walking &amp; Treadmill
                </span>
                <span className="font-tabular font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {breakdown.walkingBurned.toLocaleString('en-US')} kcal
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Exercises
                </span>
                <span className="font-tabular font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {breakdown.exerciseBurned.toLocaleString('en-US')} kcal
                </span>
              </div>
              <div
                className="flex items-center justify-between border-t pt-3 text-xs"
                style={{ borderColor: 'var(--divider-hairline)' }}
              >
                <span className="font-medium" style={{ color: 'var(--ink-secondary)' }}>
                  Net Calorie Intake
                </span>
                <span className="font-tabular font-semibold" style={{ color: 'var(--accent-primary)' }}>
                  {netCalories.toLocaleString('en-US')} kcal
                </span>
              </div>
              <p className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                {todayIntakeKcal.toLocaleString('en-US')} food − {breakdown.totalBurned.toLocaleString('en-US')} burnt
              </p>
            </div>
          </div>

          {/* Active Day's Workout Log inside Left Column for effortless scanning */}
          <div className="border-t pt-5" style={{ borderColor: 'var(--divider-hairline)' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold" style={{ color: 'var(--ink-secondary)' }}>
                {activeDayLabel}&apos;s Workout Log
              </h3>
              <span className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                {todayWorkouts.length} logged
              </span>
            </div>

            <div className="mt-3 divide-y divide-black/6 dark:divide-white/10">
              {todayWorkouts.length === 0 ? (
                <p className="py-6 text-center text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  No workouts logged for {activeDayLabel.toLowerCase()} yet. Try a treadmill session, walk, or exercise on the right.
                </p>
              ) : (
                todayWorkouts.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                        {entry.name}
                      </p>
                      <p className="font-tabular mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
                        {entry.time} · {entry.details}
                      </p>
                      {entry.aiNote && (
                        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: 'var(--ink-secondary)' }}>
                          {entry.aiNote}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-tabular text-sm font-semibold" style={{ color: 'var(--burn-ink)' }}>
                        −{entry.caloriesBurned} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteWorkout(entry.id)}
                        aria-label={`Delete ${entry.name}`}
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

        {/* Right Column: RECTANGLE 2 (Walking) + RECTANGLE 3 (Exercise) */}
        <div className="space-y-6 lg:col-span-7">
          {/* RECTANGLE 2: Walking (Treadmill & Normal Walking) */}
          <section
            aria-label="Walking and treadmill calculator"
            className="glass-panel rounded-3xl p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
                  aria-hidden="true"
                >
                  <Footprints className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold leading-tight" style={{ color: 'var(--ink-primary)' }}>
                    Walking
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    Treadmill or normal pace · AI burn
                  </p>
                </div>
              </div>

              {/* Treadmill vs Normal Walking Segmented Toggle */}
              <div
                role="tablist"
                aria-label="Walking mode"
                className="glass-block inline-flex items-center gap-1 rounded-2xl p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={walkMode === 'treadmill'}
                  onClick={() => {
                    setWalkMode('treadmill');
                    setWalkError(null);
                  }}
                  className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    walkMode === 'treadmill' ? 'glass-block-active' : 'hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                  style={{
                    color: walkMode === 'treadmill' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  Treadmill
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={walkMode === 'normal'}
                  onClick={() => {
                    setWalkMode('normal');
                    setWalkError(null);
                  }}
                  className={`min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    walkMode === 'normal' ? 'glass-block-active' : 'hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                  style={{
                    color: walkMode === 'normal' ? 'var(--accent-primary)' : 'var(--ink-secondary)',
                  }}
                >
                  Normal Walking
                </button>
              </div>
            </div>

            <form onSubmit={handleWalkingSubmit} noValidate className="mt-5 space-y-4">
              {walkMode === 'treadmill' ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="treadmill-time"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Time (min)
                      </label>
                      <input
                        id="treadmill-time"
                        type="number"
                        step="1"
                        min="1"
                        max="360"
                        value={treadmillTime}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTreadmillTime(v);
                          syncTreadmillDistance(v, treadmillSpeed, distanceManuallyEdited);
                          if (walkError) setWalkError(null);
                        }}
                        disabled={walkLoading}
                        placeholder="30"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="treadmill-speed"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Speed (km/h)
                      </label>
                      <input
                        id="treadmill-speed"
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="25"
                        value={treadmillSpeed}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTreadmillSpeed(v);
                          syncTreadmillDistance(treadmillTime, v, distanceManuallyEdited);
                          if (walkError) setWalkError(null);
                        }}
                        disabled={walkLoading}
                        placeholder="5.5"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="treadmill-distance"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Distance (km)
                      </label>
                      <input
                        id="treadmill-distance"
                        type="number"
                        step="0.05"
                        min="0.05"
                        max="60"
                        value={treadmillDistance}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTreadmillDistance(v);
                          setDistanceManuallyEdited(v.trim() !== '');
                          if (walkError) setWalkError(null);
                        }}
                        disabled={walkLoading}
                        placeholder="2.75"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    Enter time (min), speed (km/h), and distance (km) — distance auto-fills from time &amp; speed or can be edited directly.
                  </p>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-start">
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="normal-walk-time"
                      className="mb-1.5 block text-xs font-semibold"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      Walking time (min)
                    </label>
                    <input
                      id="normal-walk-time"
                      type="number"
                      step="1"
                      min="1"
                      max="360"
                      value={normalWalkTime}
                      onChange={(e) => {
                        setNormalWalkTime(e.target.value);
                        if (walkError) setWalkError(null);
                      }}
                      disabled={walkLoading}
                      placeholder="30"
                      className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                      style={{ color: 'var(--ink-primary)' }}
                    />
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {WALK_DURATION_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            setNormalWalkTime(String(mins));
                            if (walkError) setWalkError(null);
                          }}
                          className={`font-tabular min-h-[32px] rounded-lg px-1.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                            normalWalkTime === String(mins)
                              ? 'glass-block-active'
                              : 'glass-block hover:bg-white/60 dark:hover:bg-white/10'
                          }`}
                          style={{
                            color:
                              normalWalkTime === String(mins)
                                ? 'var(--accent-primary)'
                                : 'var(--ink-secondary)',
                          }}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pace Toggle: Normal Pace vs Brisk Walk */}
                  <div className="sm:col-span-7">
                    <span
                      className="mb-1.5 block text-xs font-semibold"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      Walking pace
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="Walking pace"
                      className="grid grid-cols-2 gap-2.5"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={walkPace === 'normal'}
                        onClick={() => setWalkPace('normal')}
                        className={`flex min-h-[54px] flex-col items-start justify-center rounded-2xl px-3.5 py-2 text-left transition-all cursor-pointer ${
                          walkPace === 'normal'
                            ? 'glass-block-active'
                            : 'glass-block hover:bg-white/60 dark:hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="text-xs font-semibold whitespace-nowrap"
                          style={{
                            color:
                              walkPace === 'normal' ? 'var(--accent-primary)' : 'var(--ink-primary)',
                          }}
                        >
                          Normal Pace
                        </span>
                        <span className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Easy ~4.5 km/h
                        </span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={walkPace === 'brisk'}
                        onClick={() => setWalkPace('brisk')}
                        className={`flex min-h-[54px] flex-col items-start justify-center rounded-2xl px-3.5 py-2 text-left transition-all cursor-pointer ${
                          walkPace === 'brisk'
                            ? 'glass-block-active'
                            : 'glass-block hover:bg-white/60 dark:hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="text-xs font-semibold whitespace-nowrap"
                          style={{
                            color:
                              walkPace === 'brisk' ? 'var(--accent-primary)' : 'var(--ink-primary)',
                          }}
                        >
                          Brisk Walk
                        </span>
                        <span className="font-tabular text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                          Fast ~6.0 km/h
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={walkLoading}
                  className="btn-theme-gradient inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-70 whitespace-nowrap cursor-pointer"
                >
                  {walkLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Calculating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      {walkMode === 'treadmill'
                        ? 'Calculate Treadmill Burn'
                        : 'Calculate Walking Burn'}
                    </>
                  )}
                </button>
              </div>

              {walkError && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50/85 px-3.5 py-2.5 text-xs font-semibold text-red-800 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-200"
                >
                  <span>{walkError}</span>
                  {onOpenProfile && (walkErrorCode === 'MISSING_KEY' || walkErrorCode === 'AUTH_ERROR') && (
                    <button
                      type="button"
                      onClick={onOpenProfile}
                      className="rounded-lg bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Open Profile
                    </button>
                  )}
                </div>
              )}

              {lastWalkLog && (
                <div
                  data-testid="walking-ai-result"
                  className="glass-block flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--burn-ink)' }}>
                      Logged {lastWalkLog.name} ·{' '}
                      <span className="font-tabular">−{lastWalkLog.caloriesBurned} kcal</span>
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                      {lastWalkLog.note || lastWalkLog.details}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteWorkout(lastWalkLog.id);
                      setLastWalkLog(null);
                    }}
                    className="glass-block inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-white/75 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Undo
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* RECTANGLE 3: Exercise Calculator (Dropdown Toggle + Add Custom at End) */}
          <section
            aria-label="Exercise calculator"
            className="glass-panel rounded-3xl p-6"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
                aria-hidden="true"
              >
                <Dumbbell className="h-4.5 w-4.5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold leading-tight" style={{ color: 'var(--ink-primary)' }}>
                  Exercise
                </h2>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Pick an exercise or add your own — fields adapt for weights or timed holds
                </p>
              </div>
            </div>

            {/* Exercise Selector Dropdown Toggle */}
            <div ref={exerciseDropdownRef} className="relative mt-5">
              <label
                id="exercise-selector-label"
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--ink-secondary)' }}
              >
                Select exercise
              </label>
              <button
                type="button"
                aria-labelledby="exercise-selector-label"
                aria-haspopup="listbox"
                aria-expanded={exerciseDropdownOpen}
                onClick={() => setExerciseDropdownOpen((prev) => !prev)}
                className="glass-block flex min-h-[46px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
              >
                <div className="min-w-0">
                  <span
                    className="block truncate text-sm font-semibold"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    {isAddingCustom ? '+ Add custom exercise' : activeExercise.name}
                  </span>
                  <span className="block text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    {isAddingCustom
                      ? 'Create a custom weighted, bodyweight, or timed exercise'
                      : `${activeExercise.category} · ${modeBadgeLabel(activeExercise.trackingMode)}`}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                    exerciseDropdownOpen ? 'rotate-180' : ''
                  }`}
                  style={{ color: 'var(--ink-secondary)' }}
                  aria-hidden="true"
                />
              </button>

              {exerciseDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Exercise list"
                  className="glass-panel-strong absolute right-0 bottom-full left-0 z-30 mb-2 max-h-80 overflow-y-auto rounded-2xl p-2 shadow-xl"
                >
                  {groupedExercises.map(([category, items]) => (
                    <div key={category} className="mb-2 last:mb-1">
                      <p
                        className="px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: 'var(--ink-muted)' }}
                      >
                        {category}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((item) => {
                          const selected = item.id === selectedExerciseId;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => handleSelectExercise(item.id)}
                              className={`flex min-h-[40px] w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                                selected
                                  ? 'glass-block-active'
                                  : 'hover:bg-white/55 dark:hover:bg-white/10'
                              }`}
                            >
                              <div>
                                <span
                                  className="font-semibold"
                                  style={{
                                    color: selected
                                      ? 'var(--accent-primary)'
                                      : 'var(--ink-primary)',
                                  }}
                                >
                                  {item.name}
                                </span>
                                <span
                                  className="ml-2 text-[11px]"
                                  style={{ color: 'var(--ink-muted)' }}
                                >
                                  {modeBadgeLabel(item.trackingMode)}
                                </span>
                              </div>
                              {selected && (
                                <Check
                                  className="h-3.5 w-3.5 shrink-0"
                                  style={{ color: 'var(--accent-primary)' }}
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Last option in selector: Add custom exercise */}
                  <div
                    className="mt-1 border-t pt-2"
                    style={{ borderColor: 'var(--divider-hairline)' }}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isAddingCustom}
                      onClick={() => handleSelectExercise(ADD_CUSTOM_ID)}
                      className={`flex min-h-[42px] w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        isAddingCustom
                          ? 'glass-block-active'
                          : 'hover:bg-white/55 dark:hover:bg-white/10'
                      }`}
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Add custom exercise
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inline Custom Exercise Creator when last option "+ Add custom exercise" is selected */}
            {isAddingCustom ? (
              <form
                onSubmit={handleCreateCustomExercise}
                noValidate
                className="glass-block mt-4 space-y-4 rounded-2xl p-4"
              >
                <div>
                  <label
                    htmlFor="custom-exercise-name"
                    className="mb-1.5 block text-xs font-semibold"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    New exercise name
                  </label>
                  <input
                    id="custom-exercise-name"
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      if (customError) setCustomError(null);
                    }}
                    placeholder="e.g., Hip Thrusts, Kettlebell Swings, Dead Hang..."
                    className="glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                    style={{ color: 'var(--ink-primary)' }}
                  />
                </div>

                <div>
                  <span
                    className="mb-1.5 block text-xs font-semibold"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    What should this exercise track?
                  </span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        {
                          id: 'weighted',
                          title: 'Weight Lifting',
                          desc: 'Sets · Reps · Weight · Time',
                        },
                        {
                          id: 'reps',
                          title: 'Bodyweight',
                          desc: 'Sets · Reps · Time',
                        },
                        {
                          id: 'timed',
                          title: 'Timed Hold',
                          desc: 'Time (like Plank)',
                        },
                      ] as const
                    ).map((opt) => {
                      const active = customMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCustomMode(opt.id)}
                          aria-pressed={active}
                          className={`flex min-h-[52px] flex-col items-start justify-center rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
                            active
                              ? 'glass-block-active'
                              : 'glass-block hover:bg-white/60 dark:hover:bg-white/10'
                          }`}
                        >
                          <span
                            className="text-xs font-semibold"
                            style={{
                              color: active ? 'var(--accent-primary)' : 'var(--ink-primary)',
                            }}
                          >
                            {opt.title}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {customError && (
                  <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">
                    {customError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectExercise(allExercises[0].id)}
                    className="min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-theme-gradient inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    Add &amp; Select Exercise
                  </button>
                </div>
              </form>
            ) : (
              /* Dynamic Exercise Tracking Form based on selected exercise's trackingMode */
              <form onSubmit={handleExerciseSubmit} noValidate className="mt-4 space-y-4">
                {activeExercise.trackingMode === 'timed' ? (
                  /* Timed exercise inputs (e.g., Plank, Side Plank, Wall Sit, Jump Rope) */
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-end">
                    <div className="sm:col-span-5">
                      <label
                        htmlFor="exercise-timed-value"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Time ({exTimeUnit === 'sec' ? 'seconds' : 'minutes'})
                      </label>
                      <input
                        id="exercise-timed-value"
                        type="number"
                        step={exTimeUnit === 'sec' ? '5' : '0.5'}
                        min={exTimeUnit === 'sec' ? '5' : '0.5'}
                        max={exTimeUnit === 'sec' ? '7200' : '240'}
                        value={exTimeValue}
                        onChange={(e) => {
                          setExTimeValue(e.target.value);
                          if (exError) setExError(null);
                        }}
                        disabled={exLoading}
                        placeholder={exTimeUnit === 'sec' ? '60' : '15'}
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <span
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Unit
                      </span>
                      <div
                        role="radiogroup"
                        aria-label="Time unit"
                        className="glass-block grid grid-cols-2 gap-1 rounded-xl p-1"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={exTimeUnit === 'sec'}
                          onClick={() => setExTimeUnit('sec')}
                          className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            exTimeUnit === 'sec' ? 'glass-block-active' : ''
                          }`}
                          style={{
                            color:
                              exTimeUnit === 'sec'
                                ? 'var(--accent-primary)'
                                : 'var(--ink-secondary)',
                          }}
                        >
                          Seconds
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={exTimeUnit === 'min'}
                          onClick={() => setExTimeUnit('min')}
                          className={`min-h-[36px] rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                            exTimeUnit === 'min' ? 'glass-block-active' : ''
                          }`}
                          style={{
                            color:
                              exTimeUnit === 'min'
                                ? 'var(--accent-primary)'
                                : 'var(--ink-secondary)',
                          }}
                        >
                          Minutes
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="exercise-timed-sets"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Rounds
                      </label>
                      <input
                        id="exercise-timed-sets"
                        type="number"
                        min="1"
                        max="20"
                        value={exSets}
                        onChange={(e) => {
                          setExSets(e.target.value);
                          if (exError) setExError(null);
                        }}
                        disabled={exLoading}
                        placeholder="1"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Weighted or Bodyweight exercise inputs (Sets, Reps, Weight if weighted, Time) */
                  <div
                    className={`grid grid-cols-2 gap-3 ${
                      activeExercise.trackingMode === 'weighted'
                        ? 'sm:grid-cols-4'
                        : 'sm:grid-cols-3'
                    }`}
                  >
                    <div>
                      <label
                        htmlFor="exercise-sets"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Sets
                      </label>
                      <input
                        id="exercise-sets"
                        type="number"
                        min="1"
                        max="30"
                        value={exSets}
                        onChange={(e) => {
                          setExSets(e.target.value);
                          if (exError) setExError(null);
                        }}
                        disabled={exLoading}
                        placeholder="3"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="exercise-reps"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Reps
                      </label>
                      <input
                        id="exercise-reps"
                        type="number"
                        min="1"
                        max="500"
                        value={exReps}
                        onChange={(e) => {
                          setExReps(e.target.value);
                          if (exError) setExError(null);
                        }}
                        disabled={exLoading}
                        placeholder="12"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>

                    {activeExercise.trackingMode === 'weighted' && (
                      <div>
                        <label
                          htmlFor="exercise-weight"
                          className="mb-1.5 block text-xs font-semibold"
                          style={{ color: 'var(--ink-secondary)' }}
                        >
                          Weight (kg)
                        </label>
                        <input
                          id="exercise-weight"
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="500"
                          value={exWeightKg}
                          onChange={(e) => {
                            setExWeightKg(e.target.value);
                            if (exError) setExError(null);
                          }}
                          disabled={exLoading}
                          placeholder="10"
                          className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                          style={{ color: 'var(--ink-primary)' }}
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="exercise-time"
                        className="mb-1.5 block text-xs font-semibold"
                        style={{ color: 'var(--ink-secondary)' }}
                      >
                        Time (min)
                      </label>
                      <input
                        id="exercise-time"
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="240"
                        value={exTimeValue}
                        onChange={(e) => {
                          setExTimeValue(e.target.value);
                          if (exError) setExError(null);
                        }}
                        disabled={exLoading}
                        placeholder="Optional"
                        className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                        style={{ color: 'var(--ink-primary)' }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    AI calculates burn using your {profile.currentWeightKg} kg body weight
                  </span>
                  <button
                    type="submit"
                    disabled={exLoading}
                    className="btn-theme-gradient inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-70 whitespace-nowrap cursor-pointer"
                  >
                    {exLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Calculating with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Calculate Exercise Burn
                      </>
                    )}
                  </button>
                </div>

                {exError && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50/85 px-3.5 py-2.5 text-xs font-semibold text-red-800 dark:border-red-800/60 dark:bg-red-950/60 dark:text-red-200"
                  >
                    <span>{exError}</span>
                    {onOpenProfile && (exErrorCode === 'MISSING_KEY' || exErrorCode === 'AUTH_ERROR') && (
                      <button
                        type="button"
                        onClick={onOpenProfile}
                        className="rounded-lg bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Open Profile
                      </button>
                    )}
                  </div>
                )}

                {lastExerciseLog && (
                  <div
                    data-testid="exercise-ai-result"
                    className="glass-block flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold" style={{ color: 'var(--burn-ink)' }}>
                        Logged {lastExerciseLog.name} ·{' '}
                        <span className="font-tabular">−{lastExerciseLog.caloriesBurned} kcal</span>
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                        {lastExerciseLog.note || lastExerciseLog.details}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteWorkout(lastExerciseLog.id);
                        setLastExerciseLog(null);
                      }}
                      className="glass-block inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-white/75 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                      style={{ color: 'var(--ink-primary)' }}
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Undo
                    </button>
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
