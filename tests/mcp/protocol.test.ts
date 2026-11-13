// Kiro-authored (K12, 2026-11-13). Spawns the COMMITTED bundle and speaks raw JSON-RPC to it
// over stdio, so what is tested is exactly what Kiro would launch. The messages are written by
// hand rather than through the SDK's client, so the SDK is not marking its own homework.
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { missingHandoffDemo } from '../../src/fixtures/demos';

const root = resolve(__dirname, '..', '..');
const bundle = join(root, '.kiro', 'mcp', 'ghostlight-mcp.mjs');

type Rpc = { jsonrpc: '2.0'; id?: number; method?: string; result?: any; error?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

function startServer() {
  // process.execPath, not "node": the test must not depend on PATH resolution.
  const child = spawn(process.execPath, [bundle], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  const waiting = new Map<number, (m: Rpc) => void>();
  let buffer = '';
  let stderr = '';
  const stray: string[] = [];
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', d => { stderr += d; });
  child.stdout.on('data', chunk => {
    buffer += chunk;
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let msg: Rpc;
      try { msg = JSON.parse(line); } catch { stray.push(line); continue; }
      if (msg.id !== undefined && waiting.has(msg.id)) { waiting.get(msg.id)!(msg); waiting.delete(msg.id); }
    }
  });
  const send = (m: object) => child.stdin.write(JSON.stringify(m) + '\n');
  const request = (id: number, method: string, params: object = {}) =>
    new Promise<Rpc>((resolveMsg, reject) => {
      const timer = setTimeout(() => reject(new Error(`no reply to ${method}; stderr: ${stderr}`)), 15_000);
      waiting.set(id, m => { clearTimeout(timer); resolveMsg(m); });
      send({ jsonrpc: '2.0', id, method, params });
    });
  return { child, send, request, stray, getStderr: () => stderr };
}

describe('the committed MCP bundle, over stdio', () => {
  it('initialises, lists its read-only tools, answers the Missing Handoff and serves the spec', async () => {
    const s = startServer();
    try {
      const init = await s.request(1, 'initialize', {
        protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'ghostlight-test', version: '0.0.0' },
      });
      expect(init.result.serverInfo.name).toBe('ghostlight');
      s.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

      const list = await s.request(2, 'tools/list');
      const tools = list.result.tools as Array<{ name: string; annotations?: { readOnlyHint?: boolean; openWorldHint?: boolean } }>;
      expect(tools.map(t => t.name).sort()).toEqual(['check_scenario', 'explain_issue', 'get_demo', 'list_demos', 'reports']);
      for (const t of tools) {
        expect(t.annotations?.readOnlyHint).toBe(true);
        expect(t.annotations?.openWorldHint).toBe(false);
      }

      const call = await s.request(3, 'tools/call', { name: 'check_scenario', arguments: { json: JSON.stringify(missingHandoffDemo) } });
      expect(call.result.isError).toBe(false);
      const body = JSON.parse(call.result.content[0].text);
      expect(body.counts).toEqual({ actions: 2, applied: 1, rejected: 1, uncertain: 0 });
      expect(body.actions[1].issue.cause).toEqual({ kind: 'action', cueId: 'cue-1', actionId: 'a1' });
      expect(body.note).toMatch(/not live tracking/);

      const bad = await s.request(4, 'tools/call', { name: 'check_scenario', arguments: { json: '{nope' } });
      expect(bad.result.isError).toBe(true);

      const res = await s.request(5, 'resources/read', { uri: 'ghostlight://spec/transition-table' });
      const text = res.result.contents[0].text as string;
      expect(text).toContain('The transition table (normative)');
      expect(text).toContain('`carryOff`');

      // Nothing but protocol on stdout; diagnostics stay on stderr.
      expect(s.stray).toEqual([]);
      expect(s.getStderr()).toContain('ready');
    } finally {
      s.child.kill();
    }
  }, 30_000);
});

describe('the committed bundle is not stale', () => {
  it('rebuilding from tools/mcp reproduces .kiro/mcp/ghostlight-mcp.mjs byte for byte', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ghostlight-mcp-'));
    const out = join(dir, 'ghostlight-mcp.mjs');
    try {
      await new Promise<void>((resolveBuild, reject) => {
        const p = spawn(process.execPath, [join(root, 'tools', 'mcp', 'build.mjs'), '--out', out], { cwd: root, stdio: 'pipe' });
        let err = '';
        p.stderr.on('data', d => { err += d; });
        p.on('exit', code => (code === 0 ? resolveBuild() : reject(new Error(`build failed: ${err}`))));
      });
      // Line endings are normalised so a Windows checkout with autocrlf does not fail this.
      const norm = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
      expect(norm(out) === norm(bundle)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
