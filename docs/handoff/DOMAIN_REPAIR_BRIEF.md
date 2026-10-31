# Ghostlight: bounded domain repair

Codex independent reviewer brief, 2026-10-31. Kiro remains the implementation/test author. Scope this pass to `src/domain/schema.ts`, `src/domain/edit.ts`, and `tests/domain/acceptance.test.ts`; retain existing engine/report semantics. No UI, dependency, or spec expansion in this repair pass. This is a repair brief, not completion evidence.

## Observed idle-checkpoint failures

At 14:14 UTC, one isolated `vitest run tests/domain/acceptance.test.ts` ran **52 tests: 39 passed, 13 failed**. Six failures expose parser defects (five sparse arrays and inherited required fields). Six failures have incorrectly constructed test fixtures/oracles. One is a CommonJS import failure. The current schema patch has not been applied.

`tsc -b --pretty false --noEmit` fails in acceptance.test.ts: unused declarations, accesses without discriminant narrowing, invalid Scenario-to-root-ID casts, and an excess `extraKey` property on typed Prop. Targeted ESLint reports **13 errors**, all in that test file: 12 unused declarations plus forbidden `require`. No diagnostics were reported for edit/report/types in those checks.

## 1. Repair the existing tests without weakening the parser

- Lines 137–155: the three forbidden-ID tests assign an **extra top-level `scene.id`**. Scenario has no such field; stripping it and succeeding is correct. Put the forbidden value into a declared zone/prop/action ID with otherwise valid data. Preserve rejection of `__proto__`, `constructor`, `prototype`; preserve acceptance of `toString`.
- Lines 212–223: makeS already contains zone L. Pushing six zones creates seven, so the supposed six-zone success case is wrong. Build exactly six and seven entries. Likewise, line 576 should start at exactly six zones before trying to add the seventh. At line 569, do not pre-corrupt the scene with a duplicate before testing addZone's duplicate rejection.
- Lines 322–330: retain the first successful parse result. Mutate the original initial position and verify the retained normalized position stays L. Then mutate the normalized result and verify the original is unchanged. The current test discards the first result, changes zoneId to undeclared MUTATED, and incorrectly expects reparsing to succeed. Missing references must still fail.
- Lines 91–104: the purported inherited-description fixture inherits required fields and makes description **own**. Replace it with a scene whose required fields are own but whose optional description exists only on its prototype. Require success and absence of description in the normalized result. Do not accept either outcome conditionally. Add the same small check for an action's inherited optional note.
- Lines 106–115: holderId is required, not optional. The fixture only omits it. Make initial own status/zoneId but inherit holderId:null, then require failure. Keep the ordinary omitted-holder case if useful.
- Line 625: statically import moveCue; `require('../../src/domain/edit')` currently throws MODULE_NOT_FOUND and violates lint.
- Use explicit throwing guards/assertion helpers after checking `ParseResult.success` or `EditResult.blocked`; Vitest expect alone does not narrow TypeScript unions. Do not put core assertions behind a branch that silently skips on the wrong variant. Remove unused imports/helper. Construct extra-key adversaries as raw data passed to the unknown parser boundary, rather than assigning invalid objects to typed Prop arrays.
- Small oracle corrections while touching this file: use declared holder A in the missing-prop fixture so failure isolates the missing prop; the error-cap fixture currently creates 36 zones and exercises only the collection limit. Use at most 12 malformed props with several invalid required fields to exceed 30 potential errors, and require failure with exactly the documented cap. Avoid asserting a generic word such as `expected` if the new sparse error has a clearer equivalent message.

## 2. Minimal parser fix for the reviewed direct-object contract

Support ordinary data objects, including custom prototypes; no accessor/Proxy guarantee is requested. Required fields must be **own properties at every level**: root, entities, initial states, cues, actions, and positions. A helper returning undefined for inherited fields can be used consistently for validation and normalized copying. Optional inherited description/note/destination must be ignored, not copied or used to reject an otherwise valid object. Own supplied optional fields retain existing validation; empty own note remains valid.

Every collection must reject a missing own numeric index before forEach/map can skip holes or read inherited elements. Cover props, zones, holders, cues, and cue actions. Add one custom-array-prototype regression where an inherited index supplies an otherwise valid entry: it still fails. Return bounded errors without mutating input or constructing a successful sparse scene.

Preserve current limits, UTF-8 byte counting, safe IDs, reference checks, extra-key stripping, owned nested copies, and the structural/semantic boundary. In particular, structurally valid collect with requiredSource:null may parse and then fail replay; do not introduce engine transition validation into schema merely to satisfy tests.

## 3. Four reproduced edit defects; add focused regressions

1. **Invalid numeric reorder indexes:** moveCue and moveAction currently accept NaN and 0.5 because range comparisons do not reject them; splice coerces them to zero. Require finite integer indexes within bounds. Verify blocked results leave input/order unchanged.
2. **Explicit destination removal:** updateAction uses `updates.destination !== undefined`, conflating omitted update with explicit clearing. Converting a valid action to consume with `{kind:'consume', destination:undefined}` retains the old destination and creates a replay destination-forbidden error. Detect own-property presence: omitted keeps the previous value; explicit undefined removes it. Preserve authored source and stable ID. A valid consume conversion must replay without that shape error.
3. **No-op reorders bypass validation:** both no-op branches return JSON clones directly. For a typed scene with title:'' they currently report success even though parseScenario(result) fails. Route no-op success through the same canonical parser normalization as other edit successes. Valid no-ops return fully owned nested data; invalid scenes return blocked.
4. **Explicit empty IDs silently ignored:** updateProp/Zone/Holder/Cue/Action use truthiness checks and accept `{id:''}` while retaining the old ID. Detect supplied IDs explicitly; reject any supplied value differing from the existing ID, including empty string. Same-ID updates and omitted IDs remain valid.

## Checks and stopping boundary

After grouped edits, run lint, typecheck, the existing test suite, and build; repair concrete failures without deleting tests, weakening compiler settings, or relaxing contracts. Report exact outcomes. This pass does not establish all A01–A18 acceptance.

Deferred: broad new engine/property-test coverage, all missing collection/action permutations, expanded report ownership/order regressions, browser/UI/accessibility, import/storage recovery, and publication. Existing report reset fixes looked sound in independent runtime probes; no report rewrite is requested. UI remains a stub and must not be described as complete. Quota pressure is a reason to leave an honest checkpoint, not to label deferred work done.
