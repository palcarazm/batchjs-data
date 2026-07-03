import dotenv from "dotenv";
import path from "node:path";

export default function globalSetup() {
    if (process.env.CI !== "true") {
        dotenv.config();
    }
    
    const prefix = process.env.COVERAGE_PREFIX;
    if (prefix) {
        const coverageDir = path.join(process.cwd(), "coverage", prefix);
        process.env.JEST_COVERAGE_DIRECTORY = coverageDir;
        console.log(`📊 Coverage output: ${coverageDir}`);
    }
}