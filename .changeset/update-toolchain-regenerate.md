---
"@gnolang/gno-types": patch
---

Regenerate all types with `ts-proto` 2.12 and update the build toolchain (tsdown 0.22, TypeScript 6):

- `decode` now rejects messages nested more than 100 levels deep instead of recursing without bound
- `fromPartial` accepts `string` and `number` values for 64-bit integer fields
- `fromJSON` also accepts the original snake_case proto field names
- ESM builds are now emitted as `.mjs` / `.d.mts`; the package `exports` map is updated accordingly, so imports from `@gnolang/gno-types` are unaffected
- the published package now contains only the compiled `dist/` output
- drop the empty `amino`, `gogoproto`, `cosmos.msg`, `cosmos.query` and `google.api.annotations` namespaces; their protos only declare options, so they never exported anything, and their generated declarations failed type-checking with `skipLibCheck: false`
- only generate the `gno`, `ibc`, `tendermint` and `tm` packages plus the protos they import, dropping unused cosmos-sdk types (`cosmos.app`, `cosmos.base.abci`/`node`/`reflection`/`tendermint`, `cosmos.auth.module`, `cosmos.upgrade.module`, the `cosmos.auth.v1beta1` genesis/query/tx and `cosmos.upgrade.v1beta1` query/tx modules) and `google.api.httpbody`
