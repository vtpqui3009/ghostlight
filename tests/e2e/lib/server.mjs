// Ghostlight end-to-end harness — REVIEWER-AUTHORED (Claude, automated daily run).
// Static file server for the production build in dist/. No dependencies.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
};

// Serves `root` on an ephemeral port. Unknown paths fall back to index.html
// so the harness keeps working if the app ever adds client-side routing.
export async function startStaticServer(root) {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let rel = normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
      if (rel === '/' || rel === '' || rel === '.') rel = 'index.html';
      let filePath = join(root, rel);

      let info = await stat(filePath).catch(() => null);
      if (info && info.isDirectory()) {
        filePath = join(filePath, 'index.html');
        info = await stat(filePath).catch(() => null);
      }
      if (!info) {
        filePath = join(root, 'index.html');
        info = await stat(filePath).catch(() => null);
        if (!info) {
          res.writeHead(404, { 'content-type': 'text/plain' });
          res.end('not found');
          return;
        }
      }

      const body = await readFile(filePath);
      res.writeHead(200, {
        'content-type': TYPES[extname(filePath)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { 'content-type': 'text/plain' });
      res.end(`server error: ${err && err.message}`);
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
