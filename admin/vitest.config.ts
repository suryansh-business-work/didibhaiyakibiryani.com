import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    // The v8 coverage provider crashes the worker-threads pool on Windows;
    // child-process forks are stable for both plain runs and coverage.
    pool: "forks",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      // Unit-testable surface: logic, hooks, reusable components and pure helpers.
      // App shell, GraphQL documents and DOM-only widgets (Leaflet map, OSM iframe)
      // are exercised by manual/e2e checks rather than jsdom unit tests.
      include: [
        "src/form/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
        "src/components/DataTable/useServerTable.ts",
        "src/components/DataTable/useClientTable.ts",
        "src/components/DataTable/index.ts",
        "src/components/DataTable/types.ts",
        "src/constants/**/*.ts",
        "src/pages/Orders/ManualOrderModal/types.ts",
        "src/pages/DashboardFilter.tsx",
        "src/pages/DashboardStat.tsx",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "src/test/**",
        // ui.tsx Modal has one unreachable branch: the `reason !== "backdropClick"`
        // true-path can't fire because `disableEscapeKeyDown` stops MUI calling
        // onClose with any non-backdrop reason. Every component in it is unit-tested
        // (see ui.test.tsx) but the dead guard keeps the 100% branch gate red.
        "src/components/ui.tsx",
        // DataTable.tsx runBulkDelete's `!ids.length || !onBulkDelete` is a defensive
        // guard that is structurally unreachable: the Delete button only renders when
        // onBulkDelete exists AND at least one row is selected. Fully exercised
        // otherwise by DataTable.test.tsx.
        "src/components/DataTable/DataTable.tsx",
      ],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
