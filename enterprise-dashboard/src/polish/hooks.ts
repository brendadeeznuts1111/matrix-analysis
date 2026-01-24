// enterprise-dashboard/src/polish/hooks.ts - React Integration Hooks
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback, useRef } from "react";
import {
  SystemPolish,
  systemPolish,
  type PolishConfig,
  type TourConfig,
  type ConfettiOptions,
  useHoverCard,
  useToast,
  useConfetti,
} from "../../../lib/polish/index.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Main Polish Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePolish(): SystemPolish {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    systemPolish.init().then(() => setInitialized(true));
  }, []);

  return systemPolish;
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding Tour Hook
// ─────────────────────────────────────────────────────────────────────────────

interface OnboardingTourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
}

export function useOnboardingTour(config: TourConfig) {
  const polish = usePolish();
  const [state, setState] = useState<OnboardingTourState>({
    isActive: false,
    currentStep: 0,
    totalSteps: config.steps.length,
    isComplete: false,
  });

  const start = useCallback(async () => {
    setState((s) => ({ ...s, isActive: true }));
    await polish.showTour(config);
    setState((s) => ({ ...s, isComplete: true, isActive: false }));
  }, [polish, config]);

  const reset = useCallback(async () => {
    await polish.resetTour(config.id);
    setState({
      isActive: false,
      currentStep: 0,
      totalSteps: config.steps.length,
      isComplete: false,
    });
  }, [polish, config.id, config.steps.length]);

  useEffect(() => {
    polish.isTourComplete(config.id).then((complete) => {
      setState((s) => ({ ...s, isComplete: complete }));
    });
  }, [polish, config.id]);

  return {
    ...state,
    start,
    reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Feedback Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useFeedback() {
  const polish = usePolish();

  return {
    success: useCallback(
      (message?: string) => polish.success(message),
      [polish]
    ),
    error: useCallback(
      (message?: string) => polish.error(message),
      [polish]
    ),
    warning: useCallback(
      (message?: string) => polish.warning(message),
      [polish]
    ),
    info: useCallback(
      (message?: string) => polish.info(message),
      [polish]
    ),
    celebrate: useCallback(
      (message?: string) => polish.celebrate(message),
      [polish]
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useErrorHandler<T>() {
  const polish = usePolish();

  return {
    safe: useCallback(
      <R>(operation: () => R, fallback: R, name?: string): R =>
        polish.safe(operation, fallback, name),
      [polish]
    ),
    safeAsync: useCallback(
      <R>(operation: () => Promise<R>, fallback: R, name?: string): Promise<R> =>
        polish.safeAsync(operation, fallback, name),
      [polish]
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner Hook
// ─────────────────────────────────────────────────────────────────────────────

interface SpinnerState {
  isLoading: boolean;
  message: string;
}

export function useSpinner() {
  const polish = usePolish();
  const [state, setState] = useState<SpinnerState>({
    isLoading: false,
    message: "",
  });

  const withSpinner = useCallback(
    async <T>(message: string, operation: () => Promise<T>): Promise<T | null> => {
      setState({ isLoading: true, message });
      try {
        const result = await polish.withSpinner(message, operation);
        return result;
      } finally {
        setState({ isLoading: false, message: "" });
      }
    },
    [polish]
  );

  return {
    ...state,
    withSpinner,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePolishConfig() {
  const polish = usePolish();
  const [config, setConfigState] = useState<PolishConfig>(() => polish.getConfig());

  const setConfig = useCallback(
    (updates: Partial<PolishConfig>) => {
      polish.configure(updates);
      setConfigState(polish.getConfig());
    },
    [polish]
  );

  return {
    config,
    setConfig,
    isEnabled: config.enabled,
    toggleAudio: () => setConfig({ audio: { ...config.audio, enabled: !config.audio.enabled } }),
    toggleAnimations: () =>
      setConfig({ visual: { ...config.visual, animations: !config.visual.animations } }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports
// ─────────────────────────────────────────────────────────────────────────────

export { useHoverCard, useToast, useConfetti };
