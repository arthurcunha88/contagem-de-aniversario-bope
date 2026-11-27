import { readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const input = new URL("./src/app.ts", import.meta.url);
const output = new URL("./dist/app.js", import.meta.url);
const code = stripTypeScriptTypes(readFileSync(input, "utf8"));
writeFileSync(output, code);
