# @gnolang/gno-types

## 1.1.1

### Patch Changes

- [#12](https://github.com/gnolang/gno-types/pull/12) [`c31e9a5`](https://github.com/gnolang/gno-types/commit/c31e9a5f5f63a3a49c4d36982d1d4e4c0511f192) Thanks [@clockworkgr](https://github.com/clockworkgr)! - Ship a `prepare` script that points git at this repository's hooks, so a commit touching `protos/` regenerates `src/` and stages it. It only affects checkouts of this repository: `scripts/` is not part of the published tarball, npm does not run `prepare` for registry installs, and the script no-ops outside a git work tree.

- [#12](https://github.com/gnolang/gno-types/pull/12) [`c31e9a5`](https://github.com/gnolang/gno-types/commit/c31e9a5f5f63a3a49c4d36982d1d4e4c0511f192) Thanks [@clockworkgr](https://github.com/clockworkgr)! - Update the toolchain that produces the published output: TypeScript 6.0.3, ts-proto 2.12.4, `@bufbuild/protobuf` 2.15.0, eslint 10.11.0, typescript-eslint 8.70.0 and `@types/node` 26.6.2.
  
  ts-proto generates the sources under `src/` and TypeScript compiles `dist/`, so both are rebuilt with this change. Verified against the previous versions: `pnpm codegen` reproduces `src/` byte for byte, and `dist/` is identical file for file.

## 1.1.0

### Minor Changes

- [#1](https://github.com/gnolang/gno-types/pull/1) [`14129b3`](https://github.com/gnolang/gno-types/commit/14129b33dc434a5173515f003299700878ec5b9b) Thanks [@clockworkgr](https://github.com/clockworkgr)! - Sync gno proto types with the latest gno `master`:

  - add `gno.gno.auth` with the session messages `MsgCreateSession`, `MsgRevokeSession` and `MsgRevokeAllSessions`
  - add `MsgEnablePackage` and `MsgRejectPackage` to `gno.gno.vm`
  - add `sessionAddr` to `gno.tm2.tx.TxSignature`
  - add `initialHeight` to `gno.tm2.bft.abci.RequestInitChain`
  - add `CanonicalBlockID`, `CanonicalPartSetHeader`, `CanonicalProposal` and `CanonicalVote` to `gno.tm2.bft.types`

### Patch Changes

- [#3](https://github.com/gnolang/gno-types/pull/3) [`f9e77f2`](https://github.com/gnolang/gno-types/commit/f9e77f25b01877475d019018562a8989ef6d19a6) Thanks [@clockworkgr](https://github.com/clockworkgr)! - Verify amino wire compatibility against gno's own encoder in CI, and document that for master-key signatures encoded by gno, `TxSignature.sessionAddr` holds the zero address `g1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqluuxe` rather than an empty string:

  - add tests that decode and byte-exactly re-encode gno messages, transactions and multisig keys produced by gno's amino codec, plus a real gnoland-1 `/vm.m_enable_pkg`
  - add lint, build and test workflows for pull requests and pushes to `main`

- [#1](https://github.com/gnolang/gno-types/pull/1) [`14129b3`](https://github.com/gnolang/gno-types/commit/14129b33dc434a5173515f003299700878ec5b9b) Thanks [@clockworkgr](https://github.com/clockworkgr)! - Regenerate all types with `ts-proto` 2.12 and update the build toolchain (tsdown 0.22, TypeScript 6):

  - `decode` now rejects messages nested more than 100 levels deep instead of recursing without bound
  - `fromPartial` accepts `string` and `number` values for 64-bit integer fields
  - `fromJSON` also accepts the original snake_case proto field names
  - ESM builds are now emitted as `.mjs` / `.d.mts`; the package `exports` map is updated accordingly, so imports from `@gnolang/gno-types` are unaffected
  - the published package now contains only the compiled `dist/` output
  - drop the empty `amino`, `gogoproto`, `cosmos.msg`, `cosmos.query` and `google.api.annotations` namespaces; their protos only declare options, so they never exported anything, and their generated declarations failed type-checking with `skipLibCheck: false`
  - only generate the `gno`, `ibc`, `tendermint` and `tm` packages plus the protos they import, dropping unused cosmos-sdk types (`cosmos.app`, `cosmos.base.abci`/`node`/`reflection`/`tendermint`, `cosmos.auth.module`, `cosmos.upgrade.module`, the `cosmos.auth.v1beta1` genesis/query/tx and `cosmos.upgrade.v1beta1` query/tx modules) and `google.api.httpbody`
