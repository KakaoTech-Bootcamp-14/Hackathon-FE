// eslint.config.cjs
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
    // JavaScript 문법 오류만
    js.configs.recommended,

    // TypeScript 문법/타입 오류만
    ...tseslint.configs.recommended,

    // 검사 대상 파일
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
    },

    // 완전 무시할 경로
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
        ],
    },
];
