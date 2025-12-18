// eslint.config.cjs
const tsParser = require("@typescript-eslint/parser")
const reactHooks = require("eslint-plugin-react-hooks")

module.exports = [
  {
    // ✅ JS / JSX / TS / TSX 전부 대상
    files: ["**/*.{js,jsx,ts,tsx}"],

    // ✅ 파싱만 담당
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tsParser, // JS/TS 모두 파싱 가능
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    // ✅ 사용 플러그인
    plugins: {
      "react-hooks": reactHooks,
    },

    // ✅ React Hooks 규칙 활성화 (Next 기본 설정과 유사)
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // ✅ 완전 무시할 경로
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "out",
      "coverage",
      "build",
      ".turbo",
      "public",
      "eslint.config.*",
      "**/*.config.*",
    ],
  },
]
