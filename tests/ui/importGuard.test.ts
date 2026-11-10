// Reviewer-authored (Claude), not Kiro — see README "Who wrote what".
//
// Regression test for the delayed-import race recorded in
// docs/handoff/ACTIONFORM_CHECKPOINT.md: a FileReader read that completes after an
// action draft has opened must not replace the scene.

import { describe, expect, it } from 'vitest';
import { DRAFT_BLOCK_MESSAGE, makeImportGuard } from '../../src/ui/importGuard';

describe('import guard', () => {
  it('blocks while a draft is open', () => {
    const guard = makeImportGuard(() => true);
    const result = guard();
    expect(result.blocked).toBe(true);
    if (result.blocked) expect(result.errors).toEqual([DRAFT_BLOCK_MESSAGE]);
  });

  it('allows an import when no draft is open', () => {
    expect(makeImportGuard(() => false)()).toEqual({ blocked: false });
  });

  it('blocks a read that was started before the draft opened — the reported race', () => {
    let draftOpen = false;
    // Captured while nothing was being edited, exactly as reader.onload captures its
    // callback at the moment the read starts.
    const guard = makeImportGuard(() => draftOpen);
    expect(guard().blocked).toBe(false);

    // The user opens an action draft while the file is still being read.
    draftOpen = true;

    // The read now completes. The guard must judge the state as it is now.
    expect(guard().blocked).toBe(true);
  });

  it('allows a read that completes after the draft was saved or cancelled', () => {
    let draftOpen = true;
    const guard = makeImportGuard(() => draftOpen);
    expect(guard().blocked).toBe(true);

    draftOpen = false; // Save or Cancel

    expect(guard().blocked).toBe(false);
  });

  it('re-reads the state on every call rather than caching the first answer', () => {
    const seen: number[] = [];
    let open = false;
    const guard = makeImportGuard(() => {
      seen.push(seen.length);
      return open;
    });
    guard();
    open = true;
    guard();
    open = false;
    guard();
    expect(seen).toHaveLength(3);
  });
});
