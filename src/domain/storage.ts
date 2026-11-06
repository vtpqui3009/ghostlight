import { parseScenario } from './schema';
import type { Scenario } from './types';

/** Local-only persistence. Nothing leaves the browser; a damaged record never replaces live work. */

export const STORAGE_KEY = 'ghostlight.scene.v1';

export type LoadOutcome =
  | { status: 'empty' }
  | { status: 'loaded'; scenario: Scenario; savedAt: string | null }
  | { status: 'invalid'; errors: string[] }
  | { status: 'unavailable'; reason: string };

export type SaveOutcome =
  | { status: 'saved'; savedAt: string }
  | { status: 'failed'; reason: string };

interface Record_ { savedAt?: unknown; scene?: unknown }

function store(explicit?: Storage | null): Storage | null {
  if (explicit) return explicit;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Blocked by the browser (private mode or a site setting).
    return null;
  }
}

export function loadScene(explicit?: Storage | null): LoadOutcome {
  const target = store(explicit);
  if (!target) return { status: 'unavailable', reason: 'This browser is not allowing local storage, so scenes will not be kept between visits. Export to a file instead.' };
  let raw: string | null;
  try {
    raw = target.getItem(STORAGE_KEY);
  } catch {
    return { status: 'unavailable', reason: 'The saved scene could not be read from this browser. Export to a file instead.' };
  }
  if (raw === null) return { status: 'empty' };
  let record: Record_;
  try {
    record = JSON.parse(raw) as Record_;
  } catch {
    return { status: 'invalid', errors: ['The saved scene is damaged and was not opened. Import a Ghostlight file, or start a new scene to clear it.'] };
  }
  const parsed = parseScenario(record?.scene);
  if (!parsed.success) return { status: 'invalid', errors: parsed.errors };
  return { status: 'loaded', scenario: parsed.data, savedAt: typeof record.savedAt === 'string' ? record.savedAt : null };
}

export function saveScene(scenario: Scenario, explicit?: Storage | null, now = () => new Date().toISOString()): SaveOutcome {
  const target = store(explicit);
  if (!target) return { status: 'failed', reason: 'Local storage is unavailable, so this scene is only in the page. Export it to keep a copy.' };
  const savedAt = now();
  try {
    target.setItem(STORAGE_KEY, JSON.stringify({ savedAt, scene: scenario }));
    return { status: 'saved', savedAt };
  } catch {
    return { status: 'failed', reason: 'This scene could not be saved locally — the browser store may be full. Export it to keep a copy.' };
  }
}

export function clearScene(explicit?: Storage | null): void {
  const target = store(explicit);
  try {
    target?.removeItem(STORAGE_KEY);
  } catch {
    // Nothing more to do: the caller already treats storage as best-effort.
  }
}

export function sceneToJson(scenario: Scenario): string {
  return `${JSON.stringify(scenario, null, 2)}\n`;
}

/** A filename-safe slug of the scene title, for downloads. */
export function fileSlug(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return slug || 'ghostlight-scene';
}
