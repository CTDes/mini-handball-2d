// @ts-check
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", "coverage/", ".claude/", "factory/jobs/"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
  },
  {
    // The simulation is pure (ADR 0002): no browser globals, no Math.random.
    files: ["src/sim/**/*.ts"],
    ignores: ["src/sim/**/*.test.ts"],
    languageOptions: { globals: {} },
    rules: {
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "navigator",
        "requestAnimationFrame",
        "setTimeout",
        "setInterval",
        "performance",
        "AudioContext",
        "CanvasRenderingContext2D",
        "HTMLCanvasElement",
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Use the injected Rng (ADR 0002)." },
        { object: "Date", property: "now", message: "The simulation has no clock (ADR 0002)." },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../input*", "../render*", "../ui*", "../audio*", "../main*"],
              message: "src/sim may import only src/sim (docs/architecture.md).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
);
