import React, { useEffect, useState } from 'react';
import { Check, Heart, RotateCcw, ShieldCheck } from 'lucide-react';
import { ProfileSettings } from '../types/tracker';
import { formatWaterLiters, validateProfileForm } from '../utils/trackerLogic';

interface ProfilePageProps {
  profile: ProfileSettings;
  laurelDismissed: boolean;
  onSaveProfile: (updated: ProfileSettings) => void;
  onRestoreLaurel: () => void;
  onResetData: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  laurelDismissed,
  onSaveProfile,
  onRestoreLaurel,
  onResetData,
}) => {
  const [currentWeightKg, setCurrentWeightKg] = useState(String(profile.currentWeightKg));
  const [goalWeightKg, setGoalWeightKg] = useState(String(profile.goalWeightKg));
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(String(profile.dailyCalorieTarget));
  const [dailyWaterTargetMl, setDailyWaterTargetMl] = useState(String(profile.dailyWaterTargetMl));
  const [celebrationsEnabled, setCelebrationsEnabled] = useState(profile.celebrationsEnabled);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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
          <div className="flex items-center justify-between border-b border-black/6 pb-4">
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
            <p role="alert" className="text-xs font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/6 pt-4">
            {savedNotice ? (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
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
              className="min-h-[44px] rounded-2xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 cursor-pointer whitespace-nowrap"
              style={{ backgroundColor: 'var(--accent-primary)' }}
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
                  className="min-h-[42px] rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
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

          {/* Secure Environment Configuration Note (No client-side API key input per platform policy) */}
          <section className="glass-panel rounded-3xl p-6">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} aria-hidden="true" />
              <h2 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
                Connected Services & Privacy
              </h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Your meals, hydration entries, and weight goals stay stored privately on your device. External nutrition service credentials are managed securely through workspace environment secrets rather than stored in browser form fields.
            </p>
          </section>

          {/* Reset Sample Data */}
          <section className="glass-panel rounded-3xl p-6">
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--ink-primary)' }}>
              Reset Tracker Data
            </h2>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              Restore Nin&apos;s default weekly sample history, targets, and Laurel&apos;s notes.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-black/12 bg-white/75 px-4 py-2 text-xs font-semibold transition-colors hover:bg-white cursor-pointer"
                  style={{ color: 'var(--ink-primary)' }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reset sample data
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                    }}
                    className="min-h-[40px] rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 cursor-pointer"
                  >
                    Confirm reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[40px] rounded-xl px-3 py-2 text-xs font-semibold hover:bg-black/5 cursor-pointer"
                    style={{ color: 'var(--ink-secondary)' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
