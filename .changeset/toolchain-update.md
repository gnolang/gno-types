---
"@gnolang/gno-types": patch
---

Update the toolchain that produces the published output: TypeScript 6.0.3, ts-proto 2.12.4, `@bufbuild/protobuf` 2.15.0, eslint 10.11.0, typescript-eslint 8.70.0 and `@types/node` 26.6.2.

ts-proto generates the sources under `src/` and TypeScript compiles `dist/`, so both are rebuilt with this change. Verified against the previous versions: `pnpm codegen` reproduces `src/` byte for byte, and `dist/` is identical file for file.
