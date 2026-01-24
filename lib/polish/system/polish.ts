// lib/polish/system/polish.ts - SystemPolish Integration Class
// ═══════════════════════════════════════════════════════════════════════════════

import { Runtime } from "../core/runtime.ts";
import { Logger, logger } from "../core/logger.ts";
import { LoadingSpinner, withSpinner } from "../visual/spinner.ts";
import { AnimatedProgressBar } from "../visual/progress.ts";
import { EnhancedErrorHandler, errorHandler } from "../error-handling/handler.ts";
import { FeedbackManager, feedbackManager, feedback } from "../feedback/manager.ts";
import { MicroInteractions, microInteractions } from "../micro-interactions/index.ts";
import { CLITour, createCLITour } from "../onboarding/cli-tour.ts";
import { progressTracker } from "../onboarding/progress-tracker.ts";
import { loadConfig, getConfig, updateConfig, applyPreset, type ConfigPreset } from "./config.ts";
import type { PolishConfig, TourConfig } from "../types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// SystemPolish Class
// ─────────────────────────────────────────────────────────────────────────────

export class SystemPolish {
  readonly spinner: LoadingSpinner;
  readonly progress: AnimatedProgressBar;
  readonly errors: EnhancedErrorHandler;
  readonly feedback: FeedbackManager;
  readonly interactions: MicroInteractions;
  readonly logger: Logger;

  private config: PolishConfig;
  private tour: CLITour | null = null;
  private initialized = false;

  constructor(config?: Partial<PolishConfig>) {
    this.config = { ...getConfig(), ...config };

    this.spinner = new LoadingSpinner();
    this.progress = new AnimatedProgressBar();
    this.errors = new EnhancedErrorHandler({
      silent: !this.config.enabled,
      showSolutions: true,
    });
    this.feedback = new FeedbackManager({
      audio: this.config.audio.enabled,
      haptic: this.config.haptic.enabled,
      visual: this.config.visual.animations,
      audioVolume: this.config.audio.volume,
    });
    this.interactions = new MicroInteractions();
    this.logger = new Logger({ prefix: "Polish" });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────────────────────────────────

  async init(): Promise<void> {
    if (this.initialized) return;

    await loadConfig();
    this.config = getConfig();

    if (this.config.easterEggs.enabled) {
      await this.interactions.init();
    }

    this.applyConfig();
    this.initialized = true;
  }

  private applyConfig(): void {
    this.feedback.setAudioEnabled(this.config.audio.enabled);
    this.feedback.setHapticEnabled(this.config.haptic.enabled);
    this.feedback.setVisualEnabled(this.config.visual.animations);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Configuration
  // ─────────────────────────────────────────────────────────────────────────

  configure(updates: Partial<PolishConfig>): void {
    this.config = { ...this.config, ...updates };
    updateConfig(updates);
    this.applyConfig();
  }

  usePreset(preset: ConfigPreset): void {
    this.config = applyPreset(preset);
    this.applyConfig();
  }

  getConfig(): PolishConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Convenience Methods
  // ─────────────────────────────────────────────────────────────────────────

  async withSpinner<T>(
    message: string,
    operation: () => Promise<T>
  ): Promise<T | null> {
    if (!this.config.enabled) {
      return operation().catch(() => null);
    }
    return withSpinner(message, operation);
  }

  async withProgress<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<void>,
    message = "Processing"
  ): Promise<boolean> {
    if (!this.config.enabled || items.length === 0) {
      for (let i = 0; i < items.length; i++) {
        await processor(items[i], i).catch(() => null);
      }
      return true;
    }

    this.progress.start(items.length, message);

    for (let i = 0; i < items.length; i++) {
      try {
        await processor(items[i], i);
        this.progress.update(i + 1);
      } catch (error) {
        this.progress.stop();
        this.errors.handle(() => { throw error; }, undefined, "progress");
        return false;
      }
    }

    this.progress.complete();
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Feedback Shortcuts
  // ─────────────────────────────────────────────────────────────────────────

  async success(message?: string, target?: HTMLElement | string): Promise<void> {
    if (message) this.logger.success(message);
    await this.feedback.success(target);
  }

  async error(message?: string, target?: HTMLElement | string): Promise<void> {
    if (message) this.logger.error(message);
    await this.feedback.error(target);
  }

  async warning(message?: string, target?: HTMLElement | string): Promise<void> {
    if (message) this.logger.warning(message);
    await this.feedback.warning(target);
  }

  async info(message?: string, target?: HTMLElement | string): Promise<void> {
    if (message) this.logger.info(message);
    await this.feedback.info(target);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Onboarding Tour
  // ─────────────────────────────────────────────────────────────────────────

  async showTour(config: TourConfig): Promise<void> {
    if (!this.config.onboarding.enabled) return;

    if (Runtime.isCLI()) {
      this.tour = createCLITour(config);
      await this.tour.init();

      if (!this.tour.isComplete) {
        await this.tour.runInteractive();
      }
    }
  }

  async isTourComplete(tourId: string): Promise<boolean> {
    return progressTracker.isCompleted(tourId);
  }

  async resetTour(tourId: string): Promise<void> {
    await progressTracker.resetTour(tourId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Micro-interactions
  // ─────────────────────────────────────────────────────────────────────────

  async celebrate(message?: string): Promise<void> {
    if (!this.config.enabled) return;
    await this.interactions.celebrate(message);
  }

  async typeText(text: string): Promise<void> {
    await this.interactions.typeText(text);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Error Handling Shortcuts
  // ─────────────────────────────────────────────────────────────────────────

  safe<T>(operation: () => T, fallback: T, name?: string): T {
    return this.errors.handle(operation, fallback, name);
  }

  async safeAsync<T>(
    operation: () => Promise<T>,
    fallback: T,
    name?: string
  ): Promise<T> {
    return this.errors.handleAsync(operation, fallback, name);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Quick Status Display
  // ─────────────────────────────────────────────────────────────────────────

  status(): void {
    console.log();
    console.log("Polish System Status:");
    console.log(`  Enabled: ${this.config.enabled}`);
    console.log(`  Audio: ${this.config.audio.enabled} (vol: ${this.config.audio.volume})`);
    console.log(`  Haptic: ${this.config.haptic.enabled}`);
    console.log(`  Animations: ${this.config.visual.animations}`);
    console.log(`  Onboarding: ${this.config.onboarding.enabled}`);
    console.log(`  Easter Eggs: ${this.config.easterEggs.enabled}`);
    console.log();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Instance
// ─────────────────────────────────────────────────────────────────────────────

export const systemPolish = new SystemPolish();

// ─────────────────────────────────────────────────────────────────────────────
// Quick Access
// ─────────────────────────────────────────────────────────────────────────────

export const polish = {
  init: () => systemPolish.init(),
  spinner: systemPolish.spinner,
  progress: systemPolish.progress,
  errors: systemPolish.errors,
  feedback: systemPolish.feedback,
  interactions: systemPolish.interactions,

  withSpinner: <T>(msg: string, op: () => Promise<T>) => systemPolish.withSpinner(msg, op),
  safe: <T>(op: () => T, fallback: T, name?: string) => systemPolish.safe(op, fallback, name),
  safeAsync: <T>(op: () => Promise<T>, fallback: T, name?: string) => systemPolish.safeAsync(op, fallback, name),

  success: (msg?: string) => systemPolish.success(msg),
  error: (msg?: string) => systemPolish.error(msg),
  warning: (msg?: string) => systemPolish.warning(msg),
  info: (msg?: string) => systemPolish.info(msg),

  celebrate: (msg?: string) => systemPolish.celebrate(msg),
  configure: (config: Partial<PolishConfig>) => systemPolish.configure(config),
  usePreset: (preset: ConfigPreset) => systemPolish.usePreset(preset),
};
