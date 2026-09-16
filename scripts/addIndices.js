#!/usr/bin/env node

import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { lstat } from "node:fs/promises";

// Protos that only declare options/extensions (e.g. gogoproto, amino) generate
// an empty `export {};` module. Re-exporting those produces broken declarations,
// so they are left out of the indices.
function hasExports(file) {
  return /^export (?!\{\s*\};)/m.test(readFileSync(file, "utf8"));
}

// Returns whether the folder has anything to export.
async function addIndex(folder) {
  const generated = readdirSync(folder);
  let exports = "";
  for (let i=0; i<generated.length; i++) {
    const file = generated[i];
    if (file === "index.ts") {
      continue;
    }
    if ((await lstat(`${folder}/${file}`)).isDirectory()) {
      if (await addIndex(`${folder}/${file}`)) {
        exports += `export * as ${file} from "./${file}/index.js";\n`;
      }
    } else if (file.endsWith(".ts")) {
      if (!hasExports(`${folder}/${file}`)) {
        console.log(`Skipping ${folder}/${file} (no exports)`);
        continue;
      }
      const mod = file.replace(".ts", "");
      exports += `export * as ${mod} from "./${mod}.js";\n`;
    }
  }
  const outPath = folder;
  if (exports === "") {
    rmSync(`${outPath}/index.ts`, { force: true });
    return false;
  }
  const index_ts = `
  // Auto-generated, see scripts/codegen.js!

  // Exports we want to provide at the root of the "@gnolang/gno-types" package

  ` + exports;
  console.log(`Writing ${outPath}/index.ts`);
  writeFileSync(`${outPath}/index.ts`, index_ts);
  return true;
}
await addIndex("./src");
