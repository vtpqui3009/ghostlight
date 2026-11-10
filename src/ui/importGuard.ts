// Reviewer-authored (Claude), not Kiro — see README "Who wrote what".
//
// Whether an import may replace the current scene has to be decided at the moment the
// file read COMPLETES, not at the moment it was started. A FileReader.onload handler
// runs a callback captured in an earlier render, and that callback's view of "is a draft
// open?" is frozen at capture time. A read begun before the user opened an action draft
// would therefore sail past the guard and replace the scene underneath them.
//
// So the guard takes a getter, never a boolean. Passing a boolean is the bug.

export const DRAFT_BLOCK_MESSAGE =
  'Save or Cancel the current action draft before importing another scene.';

export type ImportGuardResult =
  | { blocked: true; errors: string[] }
  | { blocked: false };

/**
 * Builds a guard that asks `isDraftOpen` every time it is called, so a guard created
 * before a draft opened still blocks, and one created while a draft was open stops
 * blocking once that draft is saved or cancelled.
 */
export function makeImportGuard(isDraftOpen: () => boolean): () => ImportGuardResult {
  return () => (isDraftOpen() ? { blocked: true, errors: [DRAFT_BLOCK_MESSAGE] } : { blocked: false });
}
