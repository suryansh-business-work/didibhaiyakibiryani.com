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
      // External-IO adapters (pino transport, SMTP, ImageKit SDK) are thin glue
      // exercised against real services in integration/production, not unit tests.
      // Their pure logic that DOES carry behaviour is tested elsewhere.
      exclude: [
        "src/utils/logger.ts",
        "src/utils/mailer.ts",
        "src/utils/imagekit.ts",
        "src/utils/razorpay.ts",
      ],
      thresholds: {
        statements: 100,
        lines: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
});
