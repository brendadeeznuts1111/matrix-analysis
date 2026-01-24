// enterprise-dashboard/src/polish/index.ts - Polish Integration for Enterprise Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

// Re-export all hooks
export {
  usePolish,
  useOnboardingTour,
  useFeedback,
  useErrorHandler,
  useSpinner,
  usePolishConfig,
  useHoverCard,
  useToast,
  useConfetti,
} from "./hooks.ts";

// Re-export React components
export {
  HoverCard,
  ToastProvider,
  Confetti,
} from "../../../lib/polish/index.ts";

// Re-export types
export type {
  PolishConfig,
  TourConfig,
  TourStep,
  ConfettiOptions,
  ToastData,
  HoverCardProps,
} from "../../../lib/polish/index.ts";

// Default tour for dashboard
export const DASHBOARD_TOUR = {
  id: "dashboard-welcome",
  steps: [
    {
      id: "welcome",
      title: "Welcome to Enterprise Dashboard",
      content: "Let's take a quick tour of the main features.",
    },
    {
      id: "navigation",
      title: "Navigation",
      content: "Use the sidebar to navigate between different sections.",
      target: "[data-tour='sidebar']",
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts",
      content: "Press '?' at any time to see available keyboard shortcuts.",
    },
    {
      id: "complete",
      title: "You're All Set!",
      content: "Explore the dashboard and reach out if you need help.",
    },
  ],
  skipable: true,
  persistProgress: true,
};
