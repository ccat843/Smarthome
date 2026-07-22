import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync("**/*.{md,json,js,mjs,html}", {
  exclude: ["node_modules/**", "dist/**", ".git/**"],
});

for (const file of files) {
  const contents = readFileSync(file, "utf8");
  assert.equal(contents.endsWith("\n"), true, `${file} must end with a newline`);
  assert.equal(contents.includes("\t"), false, `${file} must not contain tab characters`);
}

console.log("Scaffold format checks passed.");
