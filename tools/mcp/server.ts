// Kiro-authored (K12, 2026-11-13). The Ghostlight MCP server: stdio, read-only, local.
//
// Run by Kiro from .kiro/settings/mcp.json as `node .kiro/mcp/ghostlight-mcp.mjs`. That file
// is this module bundled by `npm run build:mcp`, with design.md embedded as text so nothing
// is read from disk at run time. There is no network, no filesystem access and no
// environment lookup. stdout carries only the protocol; diagnostics go to stderr.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import design from '../../.kiro/specs/ghostlight/design.md';
import {
  HONESTY, REPORT_KINDS, checkScenario, explainIssue, extractTransitionTable, getDemo, listDemos, reports,
} from './handlers';

const json = z.string().describe('A Ghostlight scenario as a JSON string (at most 200,000 bytes).');
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  isError: typeof value === 'object' && value !== null && 'ok' in value && (value as { ok: boolean }).ok === false,
});

export function createServer(): McpServer {
  const server = new McpServer({ name: 'ghostlight', version: '0.1.0' });

  server.registerTool('check_scenario', {
    title: 'Check a Ghostlight scenario',
    description:
      'Replays a prop plan in cue order with the real Ghostlight engine and returns, for every action, whether it applied, ' +
      'the issue (if any) and its cause. Use it to confirm what a fixture really does BEFORE writing a test around it. ' + HONESTY,
    inputSchema: { json },
    annotations: readOnly,
  }, async ({ json: j }) => text(checkScenario(j)));

  server.registerTool('explain_issue', {
    title: 'Explain one action',
    description:
      'For one action id: the verdict in words, the issue and its cause, and a suggested fix that is described but never applied. ' + HONESTY,
    inputSchema: { json, actionId: z.string().describe('The id of the action to explain.') },
    annotations: readOnly,
  }, async ({ json: j, actionId }) => text(explainIssue(j, actionId)));

  server.registerTool('reports', {
    title: 'Crew reports',
    description: 'The preset, runner or reset report for a scenario, from the same code the app prints. ' + HONESTY,
    inputSchema: { json, kind: z.enum(REPORT_KINDS as unknown as [string, ...string[]]).describe('preset, runner or reset') },
    annotations: readOnly,
  }, async ({ json: j, kind }) => text(reports(j, kind)));

  server.registerTool('list_demos', {
    title: 'List bundled demo scenes',
    description: 'The ids and titles of the six invented example scenes. ' + HONESTY,
    inputSchema: {},
    annotations: readOnly,
  }, async () => text(listDemos()));

  server.registerTool('get_demo', {
    title: 'Get a bundled demo scene',
    description: 'One bundled scene as JSON, ready to edit and send to check_scenario. ' + HONESTY,
    inputSchema: { id: z.string().describe('A demo id from list_demos.') },
    annotations: readOnly,
  }, async ({ id }) => text(getDemo(id)));

  server.registerResource('transition-table', 'ghostlight://spec/transition-table', {
    title: 'The normative transition table',
    description: 'What each of the six operations requires and does, from .kiro/specs/ghostlight/design.md.',
    mimeType: 'text/markdown',
  }, async uri => ({
    contents: [{ uri: uri.href, mimeType: 'text/markdown', text: extractTransitionTable(design) }],
  }));

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  process.stderr.write('ghostlight MCP server ready (stdio, read-only)\n');
}

// Only start when run as the bundle, not when imported by a test.
if (process.argv[1] && /ghostlight-mcp\.mjs$/.test(process.argv[1])) {
  main().catch(err => {
    process.stderr.write(`ghostlight MCP server failed: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
