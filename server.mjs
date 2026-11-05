import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const reportPath = new URL('./public/index.html', import.meta.url);

export function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', version: '0.0.1' }));
      return;
    }
    if (pathname !== '/' && pathname !== '/index.html') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 'Not Found');
      return;
    }
    try {
      const html = await readFile(reportPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length });
      res.end(req.method === 'HEAD' ? undefined : html);
    } catch (error) {
      console.error('Unable to read report:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 'Report unavailable');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 18081);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`adver-data v0.0.1 listening on http://${host}:${port}`));
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => { server.close(); server.closeIdleConnections(); });
  }
}
