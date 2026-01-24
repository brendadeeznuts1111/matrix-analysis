// lib/polish/test/onboarding.test.ts - Onboarding Tour Tests
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  ProgressTracker,
  progressTracker,
} from "../onboarding/progress-tracker.ts";
import {
  TourBuilder,
  createTour,
  registerTour,
  getTourConfig,
  listTours,
} from "../onboarding/tour.ts";
import { CLITour, WELCOME_TOUR, createCLITour } from "../onboarding/cli-tour.ts";

describe("ProgressTracker", () => {
  let tracker: ProgressTracker;
  const testTourId = `test-tour-${Date.now()}`;

  beforeEach(() => {
    tracker = new ProgressTracker();
  });

  afterEach(async () => {
    await tracker.resetTour(testTourId);
  });

  describe("startTour", () => {
    it("should start a tour and return progress", async () => {
      const progress = await tracker.startTour(testTourId, 5);
      expect(progress.tourId).toBe(testTourId);
      expect(progress.totalSteps).toBe(5);
      expect(progress.currentStep).toBe(0);
      expect(progress.completed).toBe(false);
      expect(progress.startedAt).toBeDefined();
    });
  });

  describe("getProgress", () => {
    it("should return null for non-existent tour", async () => {
      const progress = await tracker.getProgress("nonexistent");
      expect(progress).toBeNull();
    });

    it("should return progress for started tour", async () => {
      await tracker.startTour(testTourId, 3);
      const progress = await tracker.getProgress(testTourId);
      expect(progress).not.toBeNull();
      expect(progress?.tourId).toBe(testTourId);
    });
  });

  describe("advanceStep", () => {
    it("should increment current step", async () => {
      await tracker.startTour(testTourId, 5);
      const progress = await tracker.advanceStep(testTourId);
      expect(progress?.currentStep).toBe(1);
    });

    it("should not exceed total steps - 1", async () => {
      await tracker.startTour(testTourId, 2);
      await tracker.advanceStep(testTourId);
      const progress = await tracker.advanceStep(testTourId);
      expect(progress?.currentStep).toBeLessThanOrEqual(1);
    });

    it("should return null for non-existent tour", async () => {
      const progress = await tracker.advanceStep("nonexistent");
      expect(progress).toBeNull();
    });
  });

  describe("completeTour", () => {
    it("should mark as completed", async () => {
      await tracker.startTour(testTourId, 3);
      const progress = await tracker.completeTour(testTourId);
      expect(progress?.completed).toBe(true);
      expect(progress?.completedAt).toBeDefined();
    });
  });

  describe("isCompleted", () => {
    it("should return true when completed", async () => {
      await tracker.startTour(testTourId, 1);
      await tracker.completeTour(testTourId);
      expect(await tracker.isCompleted(testTourId)).toBe(true);
    });

    it("should return false when not completed", async () => {
      await tracker.startTour(testTourId, 5);
      expect(await tracker.isCompleted(testTourId)).toBe(false);
    });

    it("should return false for non-existent tour", async () => {
      expect(await tracker.isCompleted("nonexistent")).toBe(false);
    });
  });

  describe("resetTour", () => {
    it("should remove tour progress", async () => {
      await tracker.startTour(testTourId, 5);
      await tracker.resetTour(testTourId);
      const progress = await tracker.getProgress(testTourId);
      expect(progress).toBeNull();
    });
  });
});

describe("TourBuilder", () => {
  it("should build tour config with steps", () => {
    const config = new TourBuilder("test")
      .step("s1", "Step 1", "Content 1")
      .step("s2", "Step 2", "Content 2")
      .build();

    expect(config.id).toBe("test");
    expect(config.steps.length).toBe(2);
    expect(config.steps[0].title).toBe("Step 1");
    expect(config.steps[1].content).toBe("Content 2");
  });

  it("should set skipable option", () => {
    const config = new TourBuilder("skip-test")
      .skipable(true)
      .build();

    expect(config.skipable).toBe(true);
  });

  it("should set persist option", () => {
    const config = new TourBuilder("persist-test")
      .persist(false)
      .build();

    expect(config.persistProgress).toBe(false);
  });

  it("should add target to last step", () => {
    const config = new TourBuilder("target-test")
      .step("s1", "Step", "Content")
      .withTarget("#my-element")
      .build();

    expect(config.steps[0].target).toBe("#my-element");
  });

  it("should add position to last step", () => {
    const config = new TourBuilder("pos-test")
      .step("s1", "Step", "Content")
      .withPosition("bottom")
      .build();

    expect(config.steps[0].position).toBe("bottom");
  });

  it("should set onComplete callback", () => {
    let called = false;
    const config = new TourBuilder("callback-test")
      .onComplete(() => {
        called = true;
      })
      .build();

    expect(config.onComplete).toBeDefined();
  });
});

describe("createTour", () => {
  it("should return a TourBuilder", () => {
    const builder = createTour("my-tour");
    expect(builder).toBeInstanceOf(TourBuilder);
  });
});

describe("Tour Registry", () => {
  it("should register and retrieve tours", () => {
    const config = new TourBuilder("registry-test")
      .step("s1", "Test", "Content")
      .build();

    registerTour(config);
    const retrieved = getTourConfig("registry-test");
    expect(retrieved?.id).toBe("registry-test");
  });

  it("should return null for non-existent tour", () => {
    expect(getTourConfig("nonexistent-unique-id")).toBeNull();
  });

  it("should list registered tours", () => {
    const tours = listTours();
    expect(Array.isArray(tours)).toBe(true);
  });
});

describe("WELCOME_TOUR", () => {
  it("should have valid structure", () => {
    expect(WELCOME_TOUR.id).toBe("welcome");
    expect(WELCOME_TOUR.steps).toBeArray();
    expect(WELCOME_TOUR.steps.length).toBeGreaterThan(0);
  });

  it("should have steps with required fields", () => {
    for (const step of WELCOME_TOUR.steps) {
      expect(step.id).toBeDefined();
      expect(step.title).toBeDefined();
      expect(step.content).toBeDefined();
    }
  });

  it("should be skipable", () => {
    expect(WELCOME_TOUR.skipable).toBe(true);
  });
});

describe("CLITour", () => {
  it("should create from config", () => {
    const tour = new CLITour({
      id: "cli-test",
      steps: [{ id: "s1", title: "Step 1", content: "Content 1" }],
    });

    expect(tour.id).toBe("cli-test");
    expect(tour.steps.length).toBe(1);
  });

  it("should expose id and steps getters", () => {
    const tour = createCLITour({
      id: "getter-test",
      steps: [
        { id: "s1", title: "Step 1", content: "Content 1" },
        { id: "s2", title: "Step 2", content: "Content 2" },
      ],
    });

    expect(tour.id).toBe("getter-test");
    expect(tour.steps.length).toBe(2);
  });

  it("should return null progress before starting", () => {
    const tour = createCLITour({
      id: "progress-test",
      steps: [{ id: "s1", title: "Step", content: "Content" }],
    });

    expect(tour.getProgress()).toBeNull();
  });

  it("should report not complete before starting", () => {
    const tour = createCLITour({
      id: "complete-test",
      steps: [{ id: "s1", title: "Step", content: "Content" }],
    });

    expect(tour.isComplete).toBe(false);
  });
});

describe("progressTracker singleton", () => {
  it("should be a ProgressTracker instance", () => {
    expect(progressTracker).toBeInstanceOf(ProgressTracker);
  });

  it("should have all required methods", () => {
    expect(typeof progressTracker.getProgress).toBe("function");
    expect(typeof progressTracker.startTour).toBe("function");
    expect(typeof progressTracker.advanceStep).toBe("function");
    expect(typeof progressTracker.completeTour).toBe("function");
    expect(typeof progressTracker.isCompleted).toBe("function");
    expect(typeof progressTracker.resetTour).toBe("function");
  });
});
