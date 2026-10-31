# Technical conventions

Authored by **Kiro** (native Kiro CLI, primary writer) on 2026-10-31 during task T1. This is Kiro-authored steering; it complements the Codex-authored `product.md` (preserved unchanged) and is subordinate to the workspace `product` rule where they overlap.

## Domain invariants (engine)

- Authored source/holder requirements are independent of computed state. Never fill `requiredSource` from modeled state.
- The six operations (`place`, `collect`, `transfer`, `carryOff`, `consume`, `replenish`) follow the normative transition table in `design.md`. `null` never bypasses custody. Each movement has explicit holder/zone rules; `place` requires a non-null source holder; `carryOff` requires a zone change (rejects equal zones). No movement is silently inferred.
- `unknown` stays uncertain and is resolvable only by editing the initial declaration (an earlier action cannot establish a position for an unknown start). All six operations reject an unknown instance.
- `consume` is terminal; a consumed ID never revives. `replenish` only takes `absent → available` and never revives a consumed ID.
- Action-shape/holder rejections have **no cause**; state/mismatch rejections cite an initial-state or earlier-action cause. The three cause kinds are distinguishable. Issue IDs are stable and frame-order-independent.
- The engine is pure: it never freezes or mutates caller-owned input. `initial`, `final`, and each frame's `before`/`after` are independent own-key-safe copies with no aliasing (including `final`). State/cause dictionaries are own-key-safe (`Map` or `Object.create(null)`), so an allowed ID like `toString` is safe.
- The parser is structural; the engine is semantic. The transition table is enforced by the engine, not the parser. The parser's adversarial promise is narrowed to ordinary JSON-derived data (sparse arrays, inherited enumerable properties); it does not guarantee arbitrary accessor/Proxy shapes.

## TypeScript and testing conventions

- Strict TypeScript; discriminated unions for state; no `any` in domain code without a recorded reason.
- Unit tests use hand-calculated oracles written independently of the engine; property tests record seeds and minimized counterexamples.
- Run `npm run lint`, `npm run typecheck`, `npm test` (and `npm run build`, `npm run test:e2e` for UI) and record exact commands, versions, exit codes, failures, and fixes. A written test is not a passing result.

## Honest labeling and scope

- All playback is "planned state," never "live tracking" or "real-user validation." No claim of uniqueness or contest eligibility.
- "Offline" means local computation once assets load (dev/preview server or built bundle); cold-offline reopening is not claimed unless implemented and tested.
- Keep secrets and authenticated session state outside the repo. Preserve existing Codex provenance; mark new work Kiro-authored.

## Hooks

- A bounded, deterministic **local command** hook (`PostFileSave` on `src/domain/**`) is authored in `.kiro/hooks/` to surface type errors quickly after a domain-model edit. It is **not yet verified** to trigger in the native CLI — authored JSON alone is not proof; discovery/trigger behavior must be confirmed in the native CLI during T2.
- The hook script skips truthfully when dependencies are not installed (no `node_modules`): it prints `NOT RUN — dependencies not installed` and exits 0 rather than faking a pass. It becomes useful once `npm install` runs in T2.
- No agent-prompt hooks are used (they could spend quota in loops). No trust/permission rules or external MCP are added. Hook scripts stay within `.kiro`.
