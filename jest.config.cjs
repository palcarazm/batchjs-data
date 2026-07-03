/** @type {import('jest').Config} */

const coverageDir = process.env.JEST_COVERAGE_DIRECTORY || "coverage";

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
    globalSetup: "<rootDir>/src/test/global-setup.ts",
    coverageDirectory: coverageDir,
    reporters: [["github-actions", {silent: false}], "summary"],
    maxConcurrency: 1,
    maxWorkers: 1,
};