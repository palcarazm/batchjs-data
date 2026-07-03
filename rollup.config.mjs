import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";
function packageConfig(exportPath) {
    const external = ["batchjs", "pg", "mysql2", "mariadb", "sqlite3", "sqlite"];

    return[
        {
            input: `dist/tmp/js${exportPath}/index.js`,
            output: [
                {
                    file: `dist/cjs${exportPath}/index.cjs`,
                    format: "cjs",
                    sourcemap: true,
                    plugins: [terser()],
                },
                {
                    file: `dist/esm${exportPath}/index.mjs`,
                    format: "es",
                    sourcemap: true,
                    plugins: [terser()],
                },
            ],
            external: external,
        },
        /** Awaiting dts support mysql2 syntax
        {
            input: `dist/tmp/@types${exportPath}/index.d.ts`,
            output: {
                file: `dist/@types${exportPath}/index.d.ts`,
                format: "es",
            },
            plugins: [
                dts({
                    respectExternal: true,
                    exclude: "node_modules/**",
                    compilerOptions: {
                        skipLibCheck: true,
                        skipDefaultLibCheck: true,
                        noErrorTruncation: true,
                    }
                }),
            ],
            external: external,
        },
        */
    ];
}



export default [
    ...packageConfig("/common"),
    ...packageConfig("/sqlite"),
    ...packageConfig("/postgresql"),
    ...packageConfig("/mariadb"),
    ...packageConfig("/mysql"),
];