import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/unit/**/*.test.ts", "__tests__/integration/**/*.test.ts"],
    environment: "node",
    // In-memory Mongo (mongodb-memory-server) downloads a mongod binary on first
    // run and resolver suites spin one up per file — give hooks room.
    testTimeout: 30000,
    hookTimeout: 120000,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/utils/**", "src/graphql/resolvers/**", "src/emails/**"],
      // logger.ts is the OTLP/stdout pino transport wiring — infra glue exercised
      // in production, not unit tests.
      exclude: ["src/utils/logger.ts"],
      thresholds: {
        statements: 97,
        lines: 97,
        functions: 100,
        branches: 86,
      },
    },
  },
});
