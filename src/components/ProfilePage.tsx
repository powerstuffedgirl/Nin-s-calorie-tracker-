import React, { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Heart, KeyRound, RotateCcw, Trash2 } from 'lucide-react';
import { ProfileSettings } from '../types/tracker';
import { formatWaterLiters, validateProfileForm } from '../utils/trackerLogic';
import {
  clearStoredGeminiApiKey,
  loadStoredGeminiApiKey,
  saveStoredGeminiApiKey,
} from '../utils/storage';
import { getBuildTimeGeminiApiKey } from '../utils/nutritionClient';

interface ProfilePageProps {
  profile: ProfileSettings;
  laurelDismissed: boolean;
  onSaveProfile: (updated: ProfileSettings) => void;
  onRestoreLaurel: () => void;
  onClearDataToZero: () => void;
  onResetData: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  laurelDismissed,
  onSaveProfile,
  onRestoreLaurel,
  onClearDataToZero,
  onResetData,
}) => {
  const [currentWeightKg, setCurrentWeightKg] = useState(String(profile.currentWeightKg));
  const [goalWeightKg, setGoalWeightKg] = useState(String(profile.goalWeightKg));
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(String(profile.dailyCalorieTarget));
  const [dailyWaterTargetMl, setDailyWaterTargetMl] = useState(String(profile.dailyWaterTargetMl));
  const [celebrationsEnabled, setCelebrationsEnabled] = useState(profile.celebrationsEnabled);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [pendingResetAction, setPendingResetAction] = useState<'zero' | 'sample' | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const buildTimeKey = getBuildTimeGeminiApiKey();
  const [storedApiKey, setStoredApiKey] = useState(() => loadStoredGeminiApiKey());
  const [apiKeyDraft, setApiKeyDraft] = useState(() => loadStoredGeminiApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyDraft.trim();
    if (!trimmed) {
      clearStoredGeminiApiKey();
      setStoredApiKey('');
      setApiKeyDraft('');
      setApiKeyNotice('Saved API key cleared from this browser.');
    } else {
      saveStoredGeminiApiKey(trimmed);
      setStoredApiKey(trimmed);
      setApiKeyDraft(trimmed);
      setApiKeyNotice('Gemini API key saved to this browser.');
    }
    window.setTimeout(() => setApiKeyNotice(null), 3500);
  };

  const handleClearApiKey = () => {
    clearStoredGeminiApiKey();
    setStoredApiKey('');
    setApiKeyDraft('');
    setApiKeyNotice('Saved API key removed from this browser.');
    window.setTimeout(() => setApiKeyNotice(null), 3500);
  };

  useEffect(() => {
    setCurrentWeightKg(String(profile.currentWeightKg));
    setGoalWeightKg(String(profile.goalWeightKg));
    setDailyCalorieTarget(String(profile.dailyCalorieTarget));
    setDailyWaterTargetMl(String(profile.dailyWaterTargetMl));
    setCelebrationsEnabled(profile.celebrationsEnabled);
  }, [profile]);

  const parsedCurrent = Number(currentWeightKg);
  const parsedGoal = Number(goalWeightKg);
  const weightDiff =
    !Number.isNaN(parsedCurrent) && !Number.isNaN(parsedGoal)
      ? Math.round((parsedCurrent - parsedGoal) * 10) / 10
      : 0;

  const previewKcal = Number(dailyCalorieTarget) || profile.dailyCalorieTarget;
  const previewWaterMl = Number(dailyWaterTargetMl) || profile.dailyWaterTargetMl;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateProfileForm({
      currentWeightKg,
      goalWeightKg,
      dailyCalorieTarget,
      dailyWaterTargetMl,
    });
    if (!res.valid || !res.parsed) {
      setError(res.error ?? 'Please enter valid metric values.');
      setSavedNotice(false);
      return;
    }
    setError(null);
    onSaveProfile({
      ...profile,
      ...res.parsed,
      celebrationsEnabled,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
          style={{ color: 'var(--ink-primary)' }}
        >
          Nin&apos;s Profile & Targets
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-secondary)' }}>
          Personalize your metric weight goals, daily calorie target, and water goal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Main Profile Targets Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="glass-panel rounded-3xl p-6 lg:col-span-7 space-y-6"
        >
          <div
            className="flex items-center justify-between border-b pb-4"
            style={{ borderColor: 'var(--divider-hairline)' }}
          >
            <div>
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--ink-primary)' }}>
                Body & Daily Goals
              </h2>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                All weight and hydration targets use metric units (kg, ml, L).
              </p>
            </div>
            <span className="font-tabular text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
              {weightDiff === 0
                ? 'At goal weight'
                : weightDiff > 0
                ? `${weightDiff.toFixed(1)} kg to goal`
                : `${Math.abs(weightDiff).toFixed(1)} kg below goal`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="current-weight-kg"
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--ink-secondary)' }}
              >
                Current weight (kg)
              </label>
              <input
                id="current-weight-kg"
                type="number"
                step="0.1"
                min="25"
                max="300"
                value={currentWeightKg}
                onChange={(e) => setCurrentWeightKg(e.target.value)}
                className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                style={{ color: 'var(--ink-primary)' }}
              />
            </div>

            <div>
              <label
                htmlFor="goal-weight-kg"
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--ink-secondary)' }}
              >
                Goal weight (kg)
              </label>
              <input
                id="goal-weight-kg"
                type="number"
                step="0.1"
                min="25"
                max="300"
                value={goalWeightKg}
                onChange={(e) => setGoalWeightKg(e.target.value)}
                className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                style={{ color: 'var(--ink-primary)' }}
              />
            </div>

            <div>
              <label
                htmlFor="daily-calorie-target"
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--ink-secondary)' }}
              >
                Daily calorie target (kcal)
              </label>
              <input
                id="daily-calorie-target"
                type="number"
                step="50"
                min="900"
                max="6000"
                value={dailyCalorieTarget}
                onChange={(e) => setDailyCalorieTarget(e.target.value)}
                className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                style={{ color: 'var(--ink-primary)' }}
              />
            </div>

            <div>
              <label
                htmlFor="daily-water-target"
                className="mb-1.5 block text-xs font-semibold"
                style={{ color: 'var(--ink-secondary)' }}
              >
                Daily water target (ml)
              </label>
              <input
                id="daily-water-target"
                type="number"
                step="100"
                min="500"
                max="6000"
                value={dailyWaterTargetMl}
                onChange={(e) => setDailyWaterTargetMl(e.target.value)}
                className="font-tabular glass-block w-full min-h-[44px] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-current"
                style={{ color: 'var(--ink-primary)' }}
              />
              <p className="font-tabular mt-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                Equals {formatWaterLiters(previewWaterMl)} per day
              </p>
            </div>
          </div>

          {/* Live Macro Split Preview */}
          <div className="glass-block rounded-2xl p-4">
            <p className="text-xs font-semibold" style={{ color: 'var(--ink-secondary)' }}>
              Auto-balanced daily macro targets (25% Protein · 45% Carbs · 30% Fat)
            </p>
            <div className="font-tabular mt-2 flex flex-wrap gap-6 text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
              <span>Protein: {Math.round((previewKcal * 0.25) / 4)}g</span>
              <span>Carbs: {Math.round((previewKcal * 0.45) / 4)}g</span>
              <span>Fat: {Math.round((previewKcal * 0.3) / 9)}g</span>
            </div>
          </div>

          {/* Celebrations Preference */}
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <span className="block text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                Milestone sparkles & confetti
              </span>
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Celebrate Begova čorba logs, calorie goals, and hydration milestones.
              </span>
            </div>
            <input
              type="checkbox"
              checked={celebrationsEnabled}
              onChange={(e) => setCelebrationsEnabled(e.target.checked)}
              className="h-5 w-5 rounded accent-pink-600 cursor-pointer"
            />
          </label>

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-400">
              {error}
            </p>
          )}

          <div
            className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
            style={{ borderColor: 'var(--divider-hairline)' }}
          >
            {savedNotice ? (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Profile targets saved
              </span>
            ) : (
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Changes save automatically to this device.
              </span>
            )}

            <button
              type="submit"
              className="btn-theme-gradient min-h-[44px] rounded-2xl px-6 py-2.5 text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
            >
              Save changes
            </button>
          </div>
        </form>

        {/* Side Column: Laurel's Notes Control, Managed Keys Note & Data Reset */}
        <div className="space-y-6 lg:col-span-5">
          {/* Laurel Floating Bubble Control */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center gap-2.5">
              <Heart className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              <h2 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                Message from Laurel
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Laurel&apos;s floating bubble can be dragged anywhere on screen, minimized to a quiet chip, or dismissed whenever you want extra focus.
            </p>
            <div className="mt-4">
              {laurelDismissed ? (
                <button
                  type="button"
                  onClick={onRestoreLaurel}
                  className="btn-theme-gradient min-h-[42px] rounded-xl px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Show Message from Laurel
                </button>
              ) : (
                <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
                  Currently visible on screen.
                </p>
              )}
            </div>
          </section>

          {/* Gemini API Key for GitHub Pages / Static Hosting */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              <h2 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                Gemini API Key (AI Estimator)
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              {buildTimeKey
                ? 'A build-time VITE_GEMINI_API_KEY is already configured for this deployment. You can still store a personal fallback key below if needed.'
                : 'Used by the AI Meal Tracker and AI Workout Calculator on GitHub Pages when VITE_GEMINI_API_KEY is not set at build time. Saved only in this browser\u2019s localStorage.'}
            </p>

            <form onSubmit={handleSaveApiKey} className="mt-4 space-y-3" noValidate>
              <div>
                <label
                  htmlFor="gemini-api-key"
                  className="mb-1.5 block text-xs font-semibold"
                  style={{ color: 'var(--ink-secondary)' }}
                >
                  Personal Gemini API key
                </label>
                <div className="glass-block flex items-center gap-1.5 rounded-xl px-2.5">
                  <input
                    id="gemini-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    value={apiKeyDraft}
                    onChange={(e) => setApiKeyDraft(e.target.value)}
                    placeholder="AIza..."
                    className="font-tabular min-h-[42px] w-full bg-transparent py-2 text-xs outline-none placeholder:text-black/35 dark:placeholder:text-white/35"
                    style={{ color: 'var(--ink-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    aria-label={showApiKey ? 'Hide Gemini API key' : 'Show Gemini API key'}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="btn-theme-gradient min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  Save API key
                </button>
                {storedApiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="glass-block inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear key
                  </button>
                )}
                <span className="text-[11px] font-medium" style={{ color: 'var(--ink-muted)' }}>
                  {buildTimeKey
                    ? 'Build env key active'
                    : storedApiKey
                    ? 'Saved in localStorage'
                    : 'No local key saved'}
                </span>
              </div>

              {apiKeyNotice && (
                <p
                  role="status"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {apiKeyNotice}
                </p>
              )}

              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                Note: Static GitHub Pages apps send requests directly from your browser to Google&apos;s Gemini API. Use an API key restricted to your GitHub Pages domain and avoid saving keys on shared devices.
              </p>
            </form>
          </section>

          {/* Reset Tracker Data */}
          <section className="glass-panel rounded-3xl p-6">
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
              Reset Tracker Data
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Erase all sample meals, water logs, workouts, and streak history to start fresh at 0—or restore the example week anytime. Your weight, daily targets, custom exercises, and API key stay saved.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {pendingResetAction === null ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPendingResetAction('zero')}
                    className="btn-theme-gradient inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Set all data to 0
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingResetAction('sample')}
                    className="glass-block inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer"
                    style={{ color: 'var(--ink-primary)' }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Restore sample data
                  </button>
                </>
              ) : pendingResetAction === 'zero' ? (
                <div className="space-y-2.5 w-full">
                  <p className="text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Erase all meals, workouts, hydration logs, and streak history to 0?
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearDataToZero();
                        setPendingResetAction(null);
                        setResetNotice('All meals, workouts, water logs, and streak cleared to 0 — ready for real tracking.');
                        window.setTimeout(() => setResetNotice(null), 4000);
                      }}
                      className="min-h-[40px] rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 cursor-pointer"
                    >
                      Confirm set to 0
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingResetAction(null)}
                      className="min-h-[40px] rounded-xl px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 w-full">
                  <p className="text-xs font-semibold" style={{ color: 'var(--ink-primary)' }}>
                    Restore Nin&apos;s 7-day sample history and default targets?
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetData();
                        setPendingResetAction(null);
                        setResetNotice('Sample weekly history and default targets restored.');
                        window.setTimeout(() => setResetNotice(null), 4000);
                      }}
                      className="min-h-[40px] rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 cursor-pointer"
                    >
                      Confirm restore
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingResetAction(null)}
                      className="min-h-[40px] rounded-xl px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                      style={{ color: 'var(--ink-secondary)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {resetNotice && (
              <p
                role="status"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
              >
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {resetNotice}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
