import { describe, expect, it } from 'vitest';
import { clearScene, fileSlug, loadScene, saveScene, sceneToJson, STORAGE_KEY } from '../src/domain/storage';
import { demoScenario } from '../src/domain/samples';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  constructor(private readonly fail: 'none' | 'read' | 'write' = 'none') {}
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  getItem(key: string) {
    if (this.fail === 'read') throw new Error('blocked');
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail === 'write') throw new Error('quota');
    this.map.set(key, value);
  }
  removeItem(key: string) { this.map.delete(key); }
}

describe('local persistence', () => {
  it('reports an empty store, then round-trips a saved scene', () => {
    const storage = new MemoryStorage();
    expect(loadScene(storage)).toEqual({ status: 'empty' });
    const saved = saveScene(demoScenario(), storage, () => '2026-11-06T00:00:00.000Z');
    expect(saved).toEqual({ status: 'saved', savedAt: '2026-11-06T00:00:00.000Z' });
    const loaded = loadScene(storage);
    expect(loaded.status).toBe('loaded');
    if (loaded.status === 'loaded') {
      expect(loaded.scenario).toStrictEqual(demoScenario());
      expect(loaded.savedAt).toBe('2026-11-06T00:00:00.000Z');
    }
  });

  it('refuses a damaged record instead of crashing or half-loading it', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{ broken');
    expect(loadScene(storage)).toMatchObject({ status: 'invalid' });
    storage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: 'x', scene: { version: 1 } }));
    const outcome = loadScene(storage);
    expect(outcome.status).toBe('invalid');
    if (outcome.status === 'invalid') expect(outcome.errors.length).toBeGreaterThan(0);
  });

  it('survives a browser that blocks storage, in both directions', () => {
    expect(loadScene(new MemoryStorage('read'))).toMatchObject({ status: 'unavailable' });
    expect(loadScene(null)).toMatchObject({ status: 'unavailable' });
    expect(saveScene(demoScenario(), new MemoryStorage('write'))).toMatchObject({ status: 'failed' });
    expect(saveScene(demoScenario(), null)).toMatchObject({ status: 'failed' });
    expect(() => clearScene(new MemoryStorage('write'))).not.toThrow();
  });

  it('clears the saved scene', () => {
    const storage = new MemoryStorage();
    saveScene(demoScenario(), storage);
    clearScene(storage);
    expect(loadScene(storage)).toEqual({ status: 'empty' });
  });

  it('exports readable JSON and a safe filename', () => {
    expect(JSON.parse(sceneToJson(demoScenario()))).toStrictEqual(demoScenario());
    expect(sceneToJson(demoScenario()).endsWith('\n')).toBe(true);
    expect(fileSlug("The Lamplighter's Letter (synthetic)")).toBe('the-lamplighter-s-letter-synthetic');
    expect(fileSlug('***')).toBe('ghostlight-scene');
  });
});
