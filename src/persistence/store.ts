import { parseScenarioJson } from '../domain/schema';
import type { Scenario, ParseResult } from '../domain/types';

const STORAGE_KEY = 'ghostlight-scene-v1';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult =
  | { success: true; data: Scenario }
  | { success: false; reason: 'not-found' }
  | { success: false; reason: 'parse-error'; errors: string[]; corruptData: string }
  | { success: false; reason: 'storage-denied'; error: string };

export type SaveResult =
  | { success: true }
  | { success: false; reason: 'quota-exceeded'; error: string }
  | { success: false; reason: 'storage-denied'; error: string };

export type ClearResult =
  | { success: true }
  | { success: false; reason: 'storage-denied'; error: string };

export function loadScene(storage?: StorageAdapter): LoadResult {
  try {
    const adapter = storage ?? localStorage;
    const raw = adapter.getItem(STORAGE_KEY);
    if (raw === null) {
      return { success: false, reason: 'not-found' };
    }

    const parseResult: ParseResult = parseScenarioJson(raw);
    if (!parseResult.success) {
      return { success: false, reason: 'parse-error', errors: parseResult.errors, corruptData: raw };
    }

    return { success: true, data: parseResult.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, reason: 'storage-denied', error: message };
  }
}

export function saveScene(scenario: Scenario, storage?: StorageAdapter): SaveResult {
  try {
    const adapter = storage ?? localStorage;
    const json = JSON.stringify(scenario, null, 2);
    adapter.setItem(STORAGE_KEY, json);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('quota') || message.includes('QuotaExceeded')) {
      return { success: false, reason: 'quota-exceeded', error: message };
    }
    return { success: false, reason: 'storage-denied', error: message };
  }
}

export function clearSavedScene(storage?: StorageAdapter): ClearResult {
  try {
    const adapter = storage ?? localStorage;
    adapter.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, reason: 'storage-denied', error: message };
  }
}
