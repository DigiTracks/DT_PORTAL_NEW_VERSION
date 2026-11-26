import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/lead/**/*.test.ts", "tests/state/**/*.test.ts"],
    environment: "node",
    clearMocks: true,
    restoreMocks: true
  }
});
