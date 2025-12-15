// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  // -------------------------
  // TypeScript / Angular Code
  // -------------------------
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Selector Regeln (behalten wir)
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // -------------------------
      // Pragmatismus fuer bestehendes Projekt
      // -------------------------
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",

      // Angular 16+ / 17+ Migrationshinweise deaktivieren
      "@angular-eslint/prefer-inject": "off",
    },
  },

  // -------------------------
  // HTML Templates
  // -------------------------
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // Neue Control-Flow Syntax (@if, @for) NICHT erzwingen
      "@angular-eslint/template/prefer-control-flow": "off",

      // Accessibility fuer Schul-/Projektkontext zu streng
      "@angular-eslint/template/click-events-have-key-events": "off",
      "@angular-eslint/template/interactive-supports-focus": "off",
    },
  },
]);
