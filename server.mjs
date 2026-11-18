import http from 'node:http';
import { getComplaintDistribution } from './complaint-distribution.mjs';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join, extname } from 'node:path';

const defaultRoot = fileURLToPath(new URL('./dist/', import.meta.url));
export const VERSION = '0.0.6';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };

export function createServer({ root = defaultRoot } = {}) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; }
    catch { res.writeHead(400); res.end(); return; }
    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', version: VERSION }));
      return;
    }
    if (pathname === '/api/complaint-distribution') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      try {
        const data = await getComplaintDistribution();
        res.writeHead(200);
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify(data));
      } catch (error) {
        const missing = error.code === 'MYSQL_NOT_CONFIGURED';
        if (!missing) console.error('Complaint distribution query failed:', error.code || 'UNKNOWN');
        res.writeHead(503);
        res.end(req.method === 'HEAD' ? undefined : JSON.stringify({
          error: missing ? '尚未配置 MySQL 连接。' : '暂时无法读取 MySQL 投诉统计，请稍后重试。',
        }));
      }
      return;
    }
    const home = pathname === '/' || pathname === '/index.html';
    const asset = /^\/assets\/[A-Za-z0-9_-]+\.(?:js|css|woff2|svg)$/.test(pathname);
    if (!home && !asset) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : 'Not Found');
      return;
    }
    try {
      const file = join(root, home ? 'index.html' : pathname.slice(1));
      const content = await readFile(file);
      if (asset) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.writeHead(200, { 'Content-Type': types[extname(file)], 'Content-Length': content.length });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      const status = error.code === 'ENOENT' ? (home ? 503 : 404) : 500;
      if (status !== 404) console.error('Unable to read built frontend:', error.message);
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : home ? 'Frontend unavailable. Run npm ci and npm run build.' : 'Not Found');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await access(join(defaultRoot, 'index.html')).catch(() => { throw new Error('Frontend not built. Run npm ci and npm run build before starting.'); });
  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 18081);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, host, () => console.log(`adver-data v${VERSION} listening on http://${host}:${port}`));
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => { server.close(); server.closeIdleConnections(); });
  }
}
