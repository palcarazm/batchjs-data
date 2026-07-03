/** @type {import('jest').Config} */

module.exports = {
    preset: "ts-jest",
    roots: ["<rootDir>/src/main", "<rootDir>/src/test"],
    testMatch: [
        "**/*.test.ts",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            tsconfig: "tsconfig.test.json",
        }],
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    collectCoverageFrom: [
        "src/main/**/*.ts",
        "!**/index.ts",
        "!**/*.d.ts",
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
    globalSetup: "<rootDir>/src/test/global-setup.ts",
    coverageDirectory: "coverage",
    reporters: [["github-actions", {silent: false}], "summary"],
    maxConcurrency: 1,
    maxWorkers: 1,
};