import React, { useRef, useState } from 'react';
import { Loader2, Sparkles, Undo2, Wand2 } from 'lucide-react';
import { MealType } from '../types/tracker';
import {
  MEAL_TYPES,
  NormalizedAiMealItem,
} from '../utils/trackerLogic';
import {
  estimateNutrition,
  NutritionEstimateError,
} from '../utils/nutritionClient';

interface LoggedAiBatch {
  ids: string[];
  items: NormalizedAiMealItem[];
  note: string;
  mealType: MealType;
}

interface AiMealLoggerProps {
  selectedMealType: MealType;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onLogAiItems: (
    items: NormalizedAiMealItem[],
    mealType: MealType
  ) => string[];
  onUndoLoggedIds: (ids: string[]) => void;
  onOpenProfile?: () => void;
}

const EXAMPLE_PROMPTS = [
  '2 slices burek sa sirom + 250ml jogurt',
  '5 ćevapi in half a somun with kajmak',
  '1 large bowl chicken pho with herbs',
  '150g grilled salmon & mashed potatoes',
];

export const AiMealLogger: React.FC<AiMealLoggerProps> = ({
  selectedMealType,
  inputRef,
  onLogAiItems,
  onUndoLoggedIds,
  onOpenProfile,
}) => {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const resolvedRef = inputRef ?? internalRef;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<LoggedAiBatch | null>(null);

  const selectedLabel =
    MEAL_TYPES.find((m) => m.id === selectedMealType)?.label ?? 'Lunch';

  const runEstimate = async (textToEstimate: string) => {
    const trimmed = textToEstimate.trim();
    if (!trimmed) {
      setError('Type any meal and portion — e.g. "1 bowl ramen" or "2 slices burek".');
      setErrorCode('INVALID_INPUT');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const result = await estimateNutrition(trimmed, selectedMealType);
      const createdIds = onLogAiItems(result.items, selectedMealType);
      setLastBatch({
        ids: createdIds,
        items: result.items,
        note: result.note,
        mealType: selectedMealType,
      });
      setQuery('');
    } catch (err: unknown) {
      if (err instanceof NutritionEstimateError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError('Unable to estimate that meal right now. Please try again.');
        setErrorCode('UNKNOWN');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    void runEstimate(query);
  };

  const handleUndo = () => {
    if (!lastBatch) return;
    onUndoLoggedIds(lastBatch.ids);
    setLastBatch(null);
  };

  const batchTotalKcal = lastBatch
    ? lastBatch.items.reduce((sum, item) => sum + item.calories, 0)
    : 0;

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
            aria-hidden="true"
          >
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <h2
              className="font-display text-lg font-bold leading-tight"
              style={{ color: 'var(--ink-primary)' }}
            >
              AI Meal Tracker
            </h2>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Type any dish and portion from anywhere in the world — logging to{' '}
              <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>
                {selectedLabel}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Main natural-language frosted input block */}
      <form onSubmit={handleSubmit} className="mt-4" noValidate>
        <div className="glass-block flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center">
          <label htmlFor="ai-meal-input" className="sr-only">
            Describe any meal and portion to auto-calculate calories and macros
          </label>
          <input
            ref={resolvedRef}
            id="ai-meal-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
            placeholder="e.g., 2 slices burek sa mesom + 200ml kefir, or 1 bowl pad thai..."
            className="min-h-[44px] flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-black/40 dark:placeholder:text-white/40 disabled:opacity-60"
            style={{ color: 'var(--ink-primary)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-theme-gradient inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Estimating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Track with AI
              </>
            )}
          </button>
        </div>

        {/* One-tap example prompts for effortless discovery */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium mr-1" style={{ color: 'var(--ink-muted)' }}>
            Try:
          </span>
          {EXAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuery(sample);
                void runEstimate(sample);
              }}
              className="glass-block rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/75 dark:hover:bg-white/10 disabled:opacity-50 cursor-pointer"
              style={{ color: 'var(--ink-secondary)' }}
            >
              {sample}
            </button>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            data-testid="ai-estimate-error"
            className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50/85 dark:bg-red-950/60 px-3.5 py-2.5 text-xs font-semibold text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/60"
          >
            <span>{error}</span>
            {onOpenProfile && (errorCode === 'MISSING_KEY' || errorCode === 'AUTH_ERROR') && (
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
      </form>

      {/* Instant AI-logged summary block with 1-tap Undo */}
      {lastBatch && (
        <div
          data-testid="ai-logged-summary"
          className="glass-block mt-4 rounded-2xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                Auto-logged to {MEAL_TYPES.find((m) => m.id === lastBatch.mealType)?.label} ·{' '}
                <span className="font-tabular">{batchTotalKcal} kcal total</span>
              </p>
              {lastBatch.note && (
                <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-secondary)' }}>
                  {lastBatch.note}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="glass-block inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-white/80 dark:hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              style={{ color: 'var(--ink-primary)' }}
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              Undo
            </button>
          </div>

          <ul
            className="mt-3 divide-y divide-black/6 dark:divide-white/10 border-t pt-2"
            style={{ borderColor: 'var(--divider-hairline)' }}
          >
            {lastBatch.items.map((item, idx) => (
              <li
                key={`${item.name}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs"
              >
                <span className="font-semibold" style={{ color: 'var(--ink-primary)' }}>
                  {item.name}{' '}
                  <span className="font-normal" style={{ color: 'var(--ink-muted)' }}>
                    ({item.portion})
                  </span>
                </span>
                <span className="font-tabular" style={{ color: 'var(--ink-secondary)' }}>
                  {item.calories} kcal · {item.protein}g P / {item.carbs}g C / {item.fat}g F
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
