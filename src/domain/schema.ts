import { ACTION_KINDS } from './types';
import type { ParseResult, Scenario } from './types';

export const LIMITS = { props: 12, zones: 6, holders: 12, cues: 40, actionsPerCue: 12, jsonBytes: 200_000 } as const;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Validate imports before replacing user work; return an owned normalized copy. */
export function parseScenario(value: unknown): ParseResult {
  const errors: string[] = [];
  const err = (path: string, message: string) => { if (errors.length < 30) errors.push(`${path}: ${message}`); };
  const text = (v: unknown, path: string, max = 120): v is string => {
    if (typeof v !== 'string' || !v.trim() || v.length > max) { err(path, `enter text between 1 and ${max} characters`); return false; }
    return true;
  };
  const id = (v: unknown, path: string): v is string => {
    if (typeof v !== 'string' || !ID.test(v) || FORBIDDEN_IDS.has(v)) { err(path, 'use a unique identifier with letters, numbers, hyphens or underscores (max 64)'); return false; }
    return true;
  };
  const array = (v: unknown, path: string, max: number, min = 0): unknown[] => {
    if (!Array.isArray(v) || v.length < min || v.length > max) { err(path, `expected ${min}–${max} entries`); return []; }
    return v;
  };
  if (!isRecord(value)) return { success: false, errors: ['Scene: expected a JSON object'] };
  if (value.version !== 1) err('version', 'only Ghostlight version 1 is supported');
  text(value.title, 'title');
  if (value.description !== undefined && (typeof value.description !== 'string' || value.description.length > 1000)) err('description', 'use at most 1,000 characters');
  const entityIds = (entries: unknown[], path: string) => {
    const ids = new Set<string>();
    entries.forEach((entry, index) => {
      const p = `${path}[${index + 1}]`;
      if (!isRecord(entry)) { err(p, 'expected an object'); return; }
      if (id(entry.id, `${p}.id`)) { if (ids.has(entry.id)) err(`${p}.id`, 'duplicate identifier'); ids.add(entry.id); }
      text(entry.name, `${p}.name`, 80);
    });
    return ids;
  };
  const zoneValues = array(value.zones, 'zones', LIMITS.zones, 1);
  const holderValues = array(value.holders, 'holders', LIMITS.holders);
  const zones = entityIds(zoneValues, 'zones');
  const holders = entityIds(holderValues, 'holders');
  const position = (v: unknown, path: string) => {
    if (!isRecord(v)) { err(path, 'choose a zone and an explicit holder (or no holder)'); return; }
    if (typeof v.zoneId !== 'string' || !zones.has(v.zoneId)) err(`${path}.zoneId`, 'zone does not exist');
    if (v.holderId !== null && (typeof v.holderId !== 'string' || !holders.has(v.holderId))) err(`${path}.holderId`, 'choose an existing holder or null for no holder');
  };
  const propValues = array(value.props, 'props', LIMITS.props);
  const props = entityIds(propValues, 'props');
  propValues.forEach((prop, index) => {
    if (!isRecord(prop)) return;
    const p = `props[${index + 1}]`;
    text(prop.kind, `${p}.kind`, 80);
    if (!isRecord(prop.initial)) { err(`${p}.initial`, 'expected an initial state'); return; }
    if (!['available', 'unknown', 'absent'].includes(prop.initial.status as string)) err(`${p}.initial.status`, 'choose available, unknown or absent');
    if (prop.initial.status === 'available') position(prop.initial, `${p}.initial`);
    else if (prop.initial.zoneId !== undefined || prop.initial.holderId !== undefined) err(`${p}.initial`, 'unknown and absent states must not claim a position');
  });
  const cueValues = array(value.cues, 'cues', LIMITS.cues);
  const cueIds = new Set<string>();
  const actionIds = new Set<string>();
  cueValues.forEach((cue, index) => {
    const p = `cues[${index + 1}]`;
    if (!isRecord(cue)) { err(p, 'expected a cue object'); return; }
    if (id(cue.id, `${p}.id`)) { if (cueIds.has(cue.id)) err(`${p}.id`, 'duplicate cue identifier'); cueIds.add(cue.id); }
    text(cue.title, `${p}.title`);
    array(cue.actions, `${p}.actions`, LIMITS.actionsPerCue).forEach((action, ai) => {
      const a = `${p}.actions[${ai + 1}]`;
      if (!isRecord(action)) { err(a, 'expected an action object'); return; }
      if (id(action.id, `${a}.id`)) { if (actionIds.has(action.id)) err(`${a}.id`, 'action identifiers must be unique across the scene'); actionIds.add(action.id); }
      if (typeof action.propId !== 'string' || !props.has(action.propId)) err(`${a}.propId`, 'physical prop instance does not exist');
      if (!ACTION_KINDS.includes(action.kind as (typeof ACTION_KINDS)[number])) err(`${a}.kind`, 'unknown action');
      if (action.requiredSource !== null) position(action.requiredSource, `${a}.requiredSource`);
      if (action.destination !== undefined) position(action.destination, `${a}.destination`);
      if (action.note !== undefined && (typeof action.note !== 'string' || action.note.length > 500)) err(`${a}.note`, 'use at most 500 characters');
    });
  });
  if (errors.length) return { success: false, errors };
  // Do not preserve arbitrary imported keys (including prototype-related payloads).
  const raw = value as unknown as Scenario;
  const copyPosition = (p: { zoneId: string; holderId: string | null }) => ({ zoneId: p.zoneId, holderId: p.holderId });
  const result: Scenario = {
    version: 1, title: raw.title,
    ...(raw.description !== undefined ? { description: raw.description } : {}),
    zones: raw.zones.map(({ id: key, name }) => ({ id: key, name })),
    holders: raw.holders.map(({ id: key, name }) => ({ id: key, name })),
    props: raw.props.map(({ id: key, name, kind, initial }) => ({ id: key, name, kind,
      initial: initial.status === 'available' ? { status: initial.status, zoneId: initial.zoneId!, holderId: initial.holderId! } : { status: initial.status } })),
    cues: raw.cues.map(({ id: key, title, actions }) => ({ id: key, title, actions: actions.map(action => ({
      id: action.id, propId: action.propId, kind: action.kind,
      requiredSource: action.requiredSource ? copyPosition(action.requiredSource) : null,
      ...(action.destination ? { destination: copyPosition(action.destination) } : {}),
      ...(action.note !== undefined ? { note: action.note } : {}),
    })) })),
  };
  return { success: true, data: result };
}

export function parseScenarioJson(json: string): ParseResult {
  if (new TextEncoder().encode(json).length > LIMITS.jsonBytes) return { success: false, errors: ['File is too large. Choose a Ghostlight JSON file under 200 KB.'] };
  try { return parseScenario(JSON.parse(json)); }
  catch { return { success: false, errors: ['Invalid JSON. Export a Ghostlight scene or check the file syntax; your current scene has not been replaced.'] }; }
}
