// Kiro-authored (K3, 2026-11-13). Which reading of the stage to show: the diagram or the
// list. The reader's choice is remembered for the browser session; with no choice made,
// the list is the default when the browser reports prefers-reduced-motion: reduce.

export type StageReading = 'diagram' | 'list';

export const STAGE_READING_KEY = 'ghostlight-stage-reading';

/** The minimal surface this module needs, so it can be tested without a DOM. */
export interface ReadingEnv {
  getStored(): string | null;
  setStored(value: string): void;
  prefersReducedMotion(): boolean;
}

export function chooseInitialReading(env: ReadingEnv): StageReading {
  let stored: string | null = null;
  try {
    stored = env.getStored();
  } catch {
    // Storage can be denied; fall through to the motion preference.
  }
  if (stored === 'diagram' || stored === 'list') return stored;
  let reduced = false;
  try {
    reduced = env.prefersReducedMotion();
  } catch {
    reduced = false;
  }
  return reduced ? 'list' : 'diagram';
}

export function storeReading(env: ReadingEnv, value: StageReading): void {
  try {
    env.setStored(value);
  } catch {
    // A denied write only loses the memory of the choice, never the choice itself.
  }
}

function browserEnv(): ReadingEnv {
  return {
    getStored: () => window.sessionStorage.getItem(STAGE_READING_KEY),
    setStored: (value) => window.sessionStorage.setItem(STAGE_READING_KEY, value),
    prefersReducedMotion: () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

export function initialStageReading(): StageReading {
  return chooseInitialReading(browserEnv());
}

export function rememberStageReading(value: StageReading): void {
  storeReading(browserEnv(), value);
}
