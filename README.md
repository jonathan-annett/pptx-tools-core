# pptx-tools-core

Host-agnostic engine for the pptx-sync toolchain: pptx/pdf parsing, search index,
folder-sync planner/executor/manifest, event-schedule model, and `host:'dom'`
view-string builders. **No host bindings** — no `vscode`, no DOM, no FS API; it
takes injected seams (`SyncFs`, workspace/uri helpers) and returns data + HTML
fragments.

Consumed by:
- the **PWA** (`pptx-distro-kit`) via the `@core/*` tsconfig path alias →
  `../pptx-tools-core/src/*`,
- (historically) the VS Code extension's monorepo `packages/core`; the extension
  line is now single-package and no longer depends on this.

Promoted out of `pptx-viewer-ext/packages/core` (2026-06-27) so the shared engine
has one canonical home that can advance independently of either host. **Public** —
host-agnostic, no secrets; binary `samples/` fixtures are gitignored.

## Layout
- `src/` — the engine (sync/, search/, event/, pptx/pdf parsers, view builders).
  Each module is imported by subpath (`pptx-tools-core/sync/topology`, …).
- `test/` — Node test suites via `tsx` (`npm run typecheck`; per-suite scripts).
- `samples/` — binary fixtures, **gitignored** (provide locally for the parse /
  title-slide suites).

## Dev
```
npm install
npm run typecheck
```
Runtime deps: `fflate`, `jsonc-parser`. No host packages.
