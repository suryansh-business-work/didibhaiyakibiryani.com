import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/unit/**/*.test.ts", "__tests__/integration/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/utils/**", "src/graphql/resolvers/**", "src/emails/**"],
    },
  },
});
