import {
  defineConfig,
} from "tsdown";

export default defineConfig([
  {
    entry: ["./src/index.ts"],
    unbundle: true,
    attw: true,
    platform: "node",
    nodeProtocol: "strip",
    target: "es2020",
    outDir: "./dist",
    clean: true,
    sourcemap: true,
    dts: true,
    format: ["cjs"],
  },
  {
    entry: ["./src/index.ts"],
    unbundle: true,
    attw: true,
    platform: "node",
    target: "es2020",
    outDir: "./dist",
    clean: true,
    sourcemap: true,
    dts: true,
    format: ["esm"],
  },
]);
