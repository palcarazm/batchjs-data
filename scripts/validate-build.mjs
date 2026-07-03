#!/usr/bin/env node

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const moduleNames = ["common", "sqlite", "postgresql", "mariadb", "mysql"];

/**
 * Validates the exports of a given module against the expected exports.
 * @param {Object} module The module to validate
 * @param {String} moduleName The name of the module
 * @returns {Array} An array of errors
 */
function validateExports(module, moduleName) {
    const expectedExports = {
        "common": ["AbstractBatchEntityReaderStream", "AbstractBatchEntityWriterStream"],
        "sqlite": ["SqliteBatchEntityReader", "SqliteBatchEntityWriter"],
        "postgresql": ["PostgresBatchEntityReader", "PostgresBatchEntityWriter"],
        "mariadb": ["MariadbBatchEntityReader", "MariadbBatchEntityWriter"],
        "mysql": ["MysqlBatchEntityReader", "MysqlBatchEntityWriter"],
    };

    const missing = expectedExports[moduleName]?.filter(exp => !module[exp]) || [];
    const extra = Object.keys(module).filter(exp => !(expectedExports[moduleName]?.includes(exp)));

    const errors = [];

    if (missing.length > 0) {
        console.log(`  ❌ ${moduleName} missing exports: ${missing.join(", ")}`);
        errors.push(`${moduleName} missing exports: ${missing.join(", ")}`);
    } 
    if (extra.length > 0) {
        console.log(`  ❌ ${moduleName} extra exports: ${extra.join(", ")}`);
        errors.push(`${moduleName} extra exports: ${extra.join(", ")}`);
    }
    if (missing.length === 0 && extra.length === 0) {
        console.log(`  ✅ ${moduleName} exports found: ${Object.keys(module).join(", ")}`);
    }

    return errors;
}

/**
 * Validate CJS require
 * This function attempts to require the CJS module and checks for expected exports.
 * If any expected export is missing, it adds an error message to the errors array.
 * 
 * @param {String} moduleName The name of the module
 * @returns {Array} An array of errors
 */
function validateCJS(moduleName) {
    console.log("\n▶️ Checking CJS require...");
    const allErrors = [];
    for (const moduleName of moduleNames) {
        console.log(`  ▶️ Checking CJS require for ${moduleName}...`);
        try {
            const cjsModule = require(`../dist/cjs/${moduleName}/index.cjs`);
        
            if (cjsModule) {
                allErrors.push(...validateExports(cjsModule, moduleName));
            } else {
                console.log("  ❌ CJS module exports nothing");
                allErrors.push("CJS module exports nothing");
            }
        } catch (err) {
            console.log(`  ❌ CJS import failed: ${err.message}`);
            allErrors.push(`CJS import failed: ${err.message}`);
        }
    }
    return allErrors;
}

/**
 * Validate ESM import
 * This function attempts to dynamically import the ESM module and checks for expected exports.
 * If any expected export is missing, it adds an error message to the errors array.
 * 
 * @returns {Array} An array of errors
 */
async function validateESM() {
    console.log("\n▶️ Checking ESM import...");
    const allErrors = [];
    for (const moduleName of moduleNames) {
        try {
            console.log(`  ▶️ Checking ESM import for ${moduleName}...`);
            const esmModule = await import(`../dist/esm/${moduleName}/index.mjs`);
        
            if (esmModule) {
                allErrors.push(...validateExports(esmModule, moduleName));
            } else {
                console.log("  ❌ ESM module exports nothing");
                allErrors.push("ESM module exports nothing");
            }
        } catch (err) {
            console.log(`  ❌ ESM import failed: ${err.message}`);
            allErrors.push(`ESM import failed: ${err.message}`);
        }
    }
    return allErrors;
}

/**
 * Validate declaration files
 * This function checks for the existence of TypeScript declaration files in the dist/@types directory.
 * If any expected declaration file is missing, it adds an error message to the errors array.
 * 
 * @returns {Array} An array of errors
 */
function validateDeclarations() {
    const declarations = moduleNames.map(moduleName => `dist/@types/${moduleName}/index.d.ts`);

    console.log("\n▶️ Checking declaration files...");
    for (const dts of declarations) {
        console.log(`  ▶️ Checking ${dts}...`);
        if (existsSync(dts)) {
            console.log(`  ✅ ${dts} exists`);
        } else {
            console.log(`  ❌ ${dts} missing`);
            return [`Declaration file missing: ${dts}`];
        }
    }
    return [];
}

/**
 * Report errors and exit
 * This function checks if there are any errors collected during the validation process.
 * If there are errors, it logs them to the console and exits the process with a non-zero status code.
 * If there are no errors, it logs a success message and exits with a zero status code.
 * 
 * @param {Array} errors An array of error messages
 */
function reportErrors(errors) {
    if (errors.length > 0) {
        console.error("\n❌ Validation FAILED:");
        process.exit(1);
    } else {
        console.log("\n✅ All validation checks passed!");
        process.exit(0);
    }
}

/**
 * Run validation
 * This function orchestrates the validation process by calling the validateESM, validateCJS, and validateDeclarations functions.
 * It collects all errors from these validations and passes them to the reportErrors function for reporting.
 */
function runValidation() {
    validateESM().then((errors) => {
        const allErrors = [...validateCJS(), ...errors, ...validateDeclarations()];
        reportErrors(allErrors);
    });
}

runValidation();