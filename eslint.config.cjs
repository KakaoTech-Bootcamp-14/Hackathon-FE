// eslint.config.cjs
const tsParser = require("@typescript-eslint/parser");

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

        // ✅ 규칙 0개 = 문법 오류(파싱 에러)만 체크
        rules: {},
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
];
