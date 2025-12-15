import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 🔹 Backend Node.js Files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "warn"
    }
  },

  // 🔹 Jest Test Files
  {
    files: ["**/*.test.js", "**/*.spec.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly"
      }
    }
  }
]);
