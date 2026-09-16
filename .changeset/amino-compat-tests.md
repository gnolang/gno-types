---
"@gnolang/gno-types": patch
---

Verify amino wire compatibility against gno's own encoder in CI, and document that for master-key signatures encoded by gno, `TxSignature.sessionAddr` holds the zero address `g1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqluuxe` rather than an empty string:

- add tests that decode and byte-exactly re-encode gno messages, transactions and multisig keys produced by gno's amino codec, plus a real gnoland-1 `/vm.m_enable_pkg`
- add lint, build and test workflows for pull requests and pushes to `main`
