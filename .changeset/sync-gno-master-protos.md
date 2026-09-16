---
"@gnolang/gno-types": minor
---

Sync gno proto types with the latest gno `master`:

- add `gno.gno.auth` with the session messages `MsgCreateSession`, `MsgRevokeSession` and `MsgRevokeAllSessions`
- add `MsgEnablePackage` and `MsgRejectPackage` to `gno.gno.vm`
- add `sessionAddr` to `gno.tm2.tx.TxSignature`
- add `initialHeight` to `gno.tm2.bft.abci.RequestInitChain`
- add `CanonicalBlockID`, `CanonicalPartSetHeader`, `CanonicalProposal` and `CanonicalVote` to `gno.tm2.bft.types`
