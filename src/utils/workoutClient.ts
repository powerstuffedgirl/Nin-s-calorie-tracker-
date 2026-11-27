import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { ExerciseTrackingMode, WalkPace, WorkoutKind } from '../types/tracker';
import { loadStoredGeminiApiKey } from './storage';
import {
  getBuildTimeGeminiApiKey,
  resolveClientGeminiApiKey,
  shouldUseClientGemini,
} from './nutritionClient';
import {
  NormalizedAiWorkoutResult,
  normalizeAiWorkoutResult,
} from './trackerLogic';

export interface WorkoutEstimateRequest {
  kind: WorkoutKind;
  userWeightKg: number;
  timeMin?: number;
  speedKmh?: number;
  distanceKm?: number;
  pace?: WalkPace;
  exerciseName?: string;
  trackingMode?: ExerciseTrackingMode;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationMin?: number;
  durationSec?: number;
}

export class WorkoutEstimateError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'WorkoutEstimateError';
    this.code = code;
  }
}

const WORKOUT_SYSTEM_INSTRUCTION =
  'You are a certified exercise physiologist and sports kinesiologist. ' +
  'Calculate realistic active kilocalories burned for the described workout using ACSM metabolic equations and the Compendium of Physical Activities (MET values) scaled accurately to the person\'s body weight in kilograms. ' +
  'For strength training with sets, reps, and weight (kg) where duration is omitted, infer realistic total work + brief rest time. For isometric holds like plank or wall sit, compute energy expenditure accurately for the exact hold duration (never wildly inflate short holds). ' +
  'Return an integer caloriesBurned (minimum 1), an integer estimatedDurationMin (minimum 1), intensity ("light", "moderate", or "vigorous"), and a concise 1-sentence friendly note explaining the estimate.';

const WORKOUT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    caloriesBurned: {
      type: Type.INTEGER,
      description: 'Estimated kilocalories burned during this workout.',
    },
    estimatedDurationMin: {
      type: Type.INTEGER,
      description: 'Total workout duration in whole minutes (minimum 1).',
    },
    intensity: {
      type: Type.STRING,
      description: 'One of "light", "moderate", or "vigorous".',
    },
    note: {
      type: Type.STRING,
      description: 'One brief encouraging sentence explaining how the burn was calculated.',
    },
  },
  required: ['caloriesBurned', 'estimatedDurationMin', 'intensity', 'note'],
};

function buildWorkoutPromptSummary(req: WorkoutEstimateRequest): string {
  if (req.kind === 'treadmill') {
    return `Treadmill session: duration ${req.timeMin} minutes, speed ${req.speedKmh} km/h, distance ${req.distanceKm} km.`;
  }
  if (req.kind === 'walking') {
    const paceLabel =
      req.pace === 'brisk'
        ? 'brisk walk (~5.8-6.4 km/h)'
        : 'normal pace walk (~4.2-4.8 km/h)';
    return `Outdoor/indoor walking session: ${req.timeMin} minutes at a ${paceLabel}.`;
  }
  const parts: string[] = [`Exercise: ${req.exerciseName} (${req.trackingMode ?? 'reps'})`];
  if (req.sets) parts.push(`sets: ${req.sets}`);
  if (req.reps) parts.push(`reps per set: ${req.reps}`);
  if (req.weightKg) parts.push(`added weight: ${req.weightKg} kg`);
  if (req.durationSec) {
    parts.push(`total active time: ${req.durationSec} seconds`);
  } else if (req.durationMin) {
    parts.push(`total duration: ${req.durationMin} minutes`);
  }
  return parts.join(', ') + '.';
}

async function estimateWorkoutDirect(
  request: WorkoutEstimateRequest,
  apiKey: string
): Promise<NormalizedAiWorkoutResult> {
  const ai = new GoogleGenAI({ apiKey });
  const schemaConfig = {
    systemInstruction: WORKOUT_SYSTEM_INSTRUCTION,
    responseMimeType: 'application/json',
    responseSchema: WORKOUT_RESPONSE_SCHEMA,
  };
  const summary = buildWorkoutPromptSummary(request);
  const promptContents = `Calculate realistic calories burned for a person weighing ${request.userWeightKg} kg performing this workout: ${summary}`;

  try {
    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: promptContents,
        config: schemaConfig,
      });
    } catch (primaryErr: unknown) {
      const status = (primaryErr as { status?: number } | null)?.status;
      if (status === 503 || status === 500 || status === 404) {
        response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: promptContents,
          config: {
            ...schemaConfig,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });
      } else {
        throw primaryErr;
      }
    }

    const rawText = (response.text ?? '')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    if (!rawText) {
      throw new WorkoutEstimateError(
        'Could not read a workout estimate from Gemini. Please try again.',
        'EMPTY_RESPONSE'
      );
    }

    const parsed = JSON.parse(rawText);
    const normalized = normalizeAiWorkoutResult(parsed);
    if (!normalized) {
      throw new WorkoutEstimateError(
        'Could not calculate calories burned for this workout. Please check your inputs and try again.',
        'INVALID_RESULT'
      );
    }

    return normalized;
  } catch (err: unknown) {
    if (err instanceof WorkoutEstimateError) throw err;
    const errObj = err as { status?: number; message?: string } | null;
    const status = typeof errObj?.status === 'number' ? errObj.status : 0;
    const message = err instanceof Error ? err.message : String(err ?? '');

    if (
      status === 401 ||
      status === 403 ||
      message.includes('API_KEY_INVALID') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('API key not valid')
    ) {
      throw new WorkoutEstimateError(
        'Your Gemini API key was rejected. Please check or update it in the Profile tab.',
        'AUTH_ERROR'
      );
    }
    if (status === 429 || message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      throw new WorkoutEstimateError(
        'Gemini rate limit reached. Please wait a moment and try again.',
        'RATE_LIMIT'
      );
    }
    throw new WorkoutEstimateError(
      'Unable to reach Gemini right now. Please check your connection and try again.',
      'UPSTREAM_ERROR'
    );
  }
}

export async function estimateWorkoutBurn(
  request: WorkoutEstimateRequest
): Promise<NormalizedAiWorkoutResult> {
  const envKey = getBuildTimeGeminiApiKey();
  const storedKey = loadStoredGeminiApiKey();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (shouldUseClientGemini({ hostname, envKey, storedKey })) {
    const clientApiKey = resolveClientGeminiApiKey(envKey, storedKey);
    if (!clientApiKey) {
      throw new WorkoutEstimateError(
        'Add your Gemini API key in the Profile tab to enable AI workout calculation on GitHub Pages.',
        'MISSING_KEY'
      );
    }
    return estimateWorkoutDirect(request, clientApiKey);
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    response = await fetch('/api/workout/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new WorkoutEstimateError(
        'AI workout calculation took too long. Please try again.',
        'TIMEOUT'
      );
    }
    throw new WorkoutEstimateError(
      'Network issue reaching the AI workout calculator. If hosted statically, add your Gemini API key in Profile.',
      'MISSING_KEY'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    if (response.status === 404 || response.status === 405 || !isJson) {
      throw new WorkoutEstimateError(
        'Add your Gemini API key in the Profile tab to enable AI workout calculation on static hosting.',
        'MISSING_KEY'
      );
    }
    const message =
      (payload && typeof payload.error === 'string' && payload.error) ||
      'Could not calculate calories burned right now. Please try again.';
    throw new WorkoutEstimateError(message, payload?.code ?? 'SERVER_ERROR');
  }

  const normalized = normalizeAiWorkoutResult(payload);
  if (!normalized) {
    throw new WorkoutEstimateError(
      'Could not calculate calories burned for this workout. Please try again.',
      'INVALID_RESULT'
    );
  }
  return normalized;
}
