#!/usr/bin/env node

import { readdirSync, writeFileSync } from "node:fs";
import { lstat } from "node:fs/promises";

async function addIndex(folder) {
  const generated = readdirSync(folder);
  let index_ts = `
  // Auto-generated, see scripts/codegen.js!

  // Exports we want to provide at the root of the "cosmjs-types" package

  `;
  for (let i=0; i<generated.length; i++) {
    const file = generated[i];
    if (file === "index.ts") {
      continue;
    }
    if ((await lstat(`${folder}/${file}`)).isDirectory()) {
      await addIndex(`${folder}/${file}`);
      index_ts += `export * from "./${file}/index.js";\n`;
    } else if (file.endsWith(".ts")) {
      const mod = file.replace(".ts", "");
      index_ts += `export * from "./${mod}.js";\n`;
    }
  }
  const outPath = folder;
  console.log(`Writing ${outPath}/index.ts`);
  writeFileSync(`${outPath}/index.ts`, index_ts);

}
await addIndex("./src");