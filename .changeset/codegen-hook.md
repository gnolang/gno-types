---
"@gnolang/gno-types": patch
---

Ship a `prepare` script that points git at this repository's hooks, so a commit touching `protos/` regenerates `src/` and stages it. It only affects checkouts of this repository: `scripts/` is not part of the published tarball, npm does not run `prepare` for registry installs, and the script no-ops outside a git work tree.
