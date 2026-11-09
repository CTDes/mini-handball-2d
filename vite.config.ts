import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

// The build inlines every script and stylesheet into dist/index.html (ADR 0001).
export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), viteSingleFile()],
  build: {
    target: "es2022",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
