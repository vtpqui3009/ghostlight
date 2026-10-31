import { ACTION_KINDS } from './types';
import type { ParseResult, Scenario } from './types';

export const LIMITS = { props: 12, zones: 6, holders: 12, cues: 40, actionsPerCue: 12, jsonBytes: 200_000 } as const;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const FORBIDDEN_IDS = new Set(['__proto__', 'constructor', 'prototype']);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Check if property is own (not inherited) - accepts string or number for array indices */
const hasOwn = (obj: unknown, key: string | number): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/** Get own property value, undefined if inherited or missing */
const ownProp = <T>(obj: unknown, key: string): T | undefined => {
  if (!isRecord(obj) || !hasOwn(obj, key)) return undefined;
  return obj[key] as T;
};

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
  // Only validate own description - inherited optional description is ignored
  const ownDesc = ownProp<string>(value, 'description');
  if (ownDesc !== undefined && (typeof ownDesc !== 'string' || ownDesc.length > 1000)) err('description', 'use at most 1,000 characters');
  // Root-level required fields must be own properties
  if (!hasOwn(value, 'version')) err('version', 'missing required field');
  if (!hasOwn(value, 'title')) err('title', 'missing required field');
  if (!hasOwn(value, 'zones')) err('zones', 'missing required field');
  if (!hasOwn(value, 'holders')) err('holders', 'missing required field');
  if (!hasOwn(value, 'props')) err('props', 'missing required field');
  if (!hasOwn(value, 'cues')) err('cues', 'missing required field');

  // Check for sparse/holey arrays - must have own numeric indices
  const checkArrayOwn = (arr: unknown[], path: string, max: number, min = 0): boolean => {
    if (!Array.isArray(arr)) return false;
    if (arr.length < min || arr.length > max) { err(path, `expected ${min}–${max} entries`); return false; }
    // Check for holes and inherited indices
    for (let i = 0; i < arr.length; i++) {
      if (!hasOwn(arr, i)) { err(`${path}[${i + 1}]`, 'missing own entry at index'); return false; }
    }
    return true;
  };

  const entityIds = (entries: unknown[], path: string) => {
    const ids = new Set<string>();
    entries.forEach((entry, index) => {
      const p = `${path}[${index + 1}]`;
      if (!isRecord(entry)) { err(p, 'expected an object'); return; }
      // Required fields on entities must be own
      if (!hasOwn(entry, 'id')) err(`${p}.id`, 'missing required field');
      else if (id(entry.id, `${p}.id`)) { if (ids.has(entry.id)) err(`${p}.id`, 'duplicate identifier'); ids.add(entry.id); }
      if (!hasOwn(entry, 'name')) err(`${p}.name`, 'missing required field');
      else text(entry.name, `${p}.name`, 80);
    });
    return ids;
  };
  const zoneValues = ownProp<unknown[]>(value, 'zones');
  const holderValues = ownProp<unknown[]>(value, 'holders');
  const propValues = ownProp<unknown[]>(value, 'props');
  const cueValues = ownProp<unknown[]>(value, 'cues');

  // Validate collections - must exist as own arrays
  const zonesArr = zoneValues ?? [];
  const holdersArr = holderValues ?? [];
  const propsArr = propValues ?? [];
  const cuesArr = cueValues ?? [];

  if (!checkArrayOwn(zonesArr, 'zones', LIMITS.zones, 1)) {
    return { success: false, errors: errors.length ? errors : ['zones: missing or invalid required field'] };
  }
  const holdersOk = checkArrayOwn(holdersArr, 'holders', LIMITS.holders);
  const propsOk = checkArrayOwn(propsArr, 'props', LIMITS.props);
  const cuesOk = checkArrayOwn(cuesArr, 'cues', LIMITS.cues);

  const zones = entityIds(zonesArr, 'zones');
  const holders = holdersOk ? entityIds(holdersArr, 'holders') : new Set<string>();
  const props = propsOk ? entityIds(propsArr, 'props') : new Set<string>();

  const position = (v: unknown, path: string) => {
    if (!isRecord(v)) { err(path, 'choose a zone and an explicit holder (or no holder)'); return; }
    // Position fields must be own (not inherited)
    if (!hasOwn(v, 'zoneId')) err(`${path}.zoneId`, 'missing required field');
    else if (typeof v.zoneId !== 'string' || !zones.has(v.zoneId)) err(`${path}.zoneId`, 'zone does not exist');
    if (!hasOwn(v, 'holderId')) err(`${path}.holderId`, 'missing required field');
    else if (v.holderId !== null && (typeof v.holderId !== 'string' || !holders.has(v.holderId))) err(`${path}.holderId`, 'choose an existing holder or null for no holder');
  };

  if (propsOk) {
    propsArr.forEach((prop, index) => {
      if (!isRecord(prop)) return;
      const p = `props[${index + 1}]`;
      // Required fields on props must be own
      if (!hasOwn(prop, 'id')) err(`${p}.id`, 'missing required field');
      if (!hasOwn(prop, 'name')) err(`${p}.name`, 'missing required field');
      if (!hasOwn(prop, 'kind')) err(`${p}.kind`, 'missing required field');
      else text(prop.kind, `${p}.kind`, 80);
      if (!hasOwn(prop, 'initial')) err(`${p}.initial`, 'missing required field');
      else if (!isRecord(prop.initial)) { err(`${p}.initial`, 'expected an initial state'); return; }
      else {
        if (!hasOwn(prop.initial, 'status')) err(`${p}.initial.status`, 'missing required field');
        else if (!['available', 'unknown', 'absent'].includes(prop.initial.status as string)) err(`${p}.initial.status`, 'choose available, unknown or absent');
        // For available, require own position; for absent/unknown, ignore inherited coordinates
        if (prop.initial.status === 'available') {
          position(prop.initial, `${p}.initial`);
        } else if (hasOwn(prop.initial, 'zoneId') || hasOwn(prop.initial, 'holderId')) {
          err(`${p}.initial`, 'unknown and absent states must not claim a position');
        }
      }
    });
  }

  const cueIds = new Set<string>();
  const actionIds = new Set<string>();
  if (cuesOk) {
    cuesArr.forEach((cue, index) => {
      const p = `cues[${index + 1}]`;
      if (!isRecord(cue)) { err(p, 'expected a cue object'); return; }
      // Required fields on cues must be own
      if (!hasOwn(cue, 'id')) err(`${p}.id`, 'missing required field');
      else if (id(cue.id, `${p}.id`)) { if (cueIds.has(cue.id)) err(`${p}.id`, 'duplicate cue identifier'); cueIds.add(cue.id); }
      if (!hasOwn(cue, 'title')) err(`${p}.title`, 'missing required field');
      else text(cue.title, `${p}.title`);
      const actionsArr = ownProp<unknown[]>(cue, 'actions');
      const acts = actionsArr ?? [];
      if (!checkArrayOwn(acts, `${p}.actions`, LIMITS.actionsPerCue)) return;
      acts.forEach((action, ai) => {
        const a = `${p}.actions[${ai + 1}]`;
        if (!isRecord(action)) { err(a, 'expected an action object'); return; }
        // Required fields on actions must be own
        if (!hasOwn(action, 'id')) err(`${a}.id`, 'missing required field');
        else if (id(action.id, `${a}.id`)) { if (actionIds.has(action.id)) err(`${a}.id`, 'action identifiers must be unique across the scene'); actionIds.add(action.id); }
        if (!hasOwn(action, 'propId')) err(`${a}.propId`, 'missing required field');
        else if (typeof action.propId !== 'string' || !props.has(action.propId)) err(`${a}.propId`, 'physical prop instance does not exist');
        if (!hasOwn(action, 'kind')) err(`${a}.kind`, 'missing required field');
        else if (!ACTION_KINDS.includes(action.kind as (typeof ACTION_KINDS)[number])) err(`${a}.kind`, 'unknown action');
        // requiredSource is required and nullable - must be own property
        if (!hasOwn(action, 'requiredSource')) err(`${a}.requiredSource`, 'missing required field');
        else if (action.requiredSource !== null) position(action.requiredSource, `${a}.requiredSource`);
        // Optional fields - only validate own (inherited ignored)
        if (hasOwn(action, 'destination')) position(action.destination, `${a}.destination`);
        if (hasOwn(action, 'note')) {
          if (typeof action.note !== 'string' || action.note.length > 500) err(`${a}.note`, 'use at most 500 characters');
        }
      });
    });
  }
  if (errors.length) return { success: false, errors };
  // Do not preserve arbitrary imported keys (including prototype-related payloads).
  // Use only own properties for normalization
  const raw = value as unknown as Scenario;
  const copyPosition = (p: { zoneId: string; holderId: string | null }) => ({ zoneId: p.zoneId, holderId: p.holderId });

  // Only copy own description if present
  const ownDescription = hasOwn(value, 'description') ? ownProp<string>(value, 'description') : undefined;

  const result: Scenario = {
    version: 1,
    title: raw.title,
    ...(ownDescription !== undefined ? { description: ownDescription } : {}),
    zones: raw.zones.map(({ id: key, name }) => ({ id: key, name })),
    holders: raw.holders.map(({ id: key, name }) => ({ id: key, name })),
    props: raw.props.map(({ id: key, name, kind, initial }) => ({ id: key, name, kind,
      initial: initial.status === 'available' ? { status: initial.status, zoneId: initial.zoneId!, holderId: initial.holderId! } : { status: initial.status } })),
    cues: raw.cues.map(({ id: key, title, actions }) => ({ id: key, title, actions: actions.map(action => ({
      id: action.id, propId: action.propId, kind: action.kind,
      requiredSource: action.requiredSource ? copyPosition(action.requiredSource) : null,
      // Only copy own destination (not inherited) - explicit undefined deletes it
      ...(hasOwn(action, 'destination') ? { destination: copyPosition(action.destination) } : {}),
      // Only copy own note if present
      ...(hasOwn(action, 'note') ? { note: action.note } : {}),
    })) })),
  };
  return { success: true, data: result };
}

export function parseScenarioJson(json: string): ParseResult {
  if (new TextEncoder().encode(json).length > LIMITS.jsonBytes) return { success: false, errors: ['File is too large. Choose a Ghostlight JSON file under 200 KB.'] };
  try { return parseScenario(JSON.parse(json)); }
  catch { return { success: false, errors: ['Invalid JSON. Export a Ghostlight scene or check the file syntax; your current scene has not been replaced.'] }; }
}
