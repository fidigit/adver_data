import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, VERSION } from '../server.mjs';

test('built frontend and hashed assets are served with safe paths and correct MIME types', async t => {
  const root = await mkdtemp(join(tmpdir(), 'adver-server-'));
  await mkdir(join(root, 'assets'));
  await writeFile(join(root, 'index.html'), '<div id="root"></div>');
  await writeFile(join(root, 'assets/app-abc.js'), 'console.log(1);');
  await writeFile(join(root, 'assets/app-abc.css'), 'body{}');
  const server = createServer({ root }); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { server.close(); server.closeAllConnections(); await rm(root, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/index.html?test=1']) {
    const response = await fetch(base + path); assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/); assert.match(await response.text(), /root/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  for (const [path, mime] of [['app-abc.js', 'text/javascript'], ['app-abc.css', 'text/css']]) {
    const response = await fetch(base + '/assets/' + path);
    assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), new RegExp(mime));
    assert.match(response.headers.get('cache-control'), /immutable/);
  }
  const head = await fetch(base, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.deepEqual(await (await fetch(base + '/api/health')).json(), { status: 'ok', version: VERSION });
  for (const path of ['/.env', '/server.mjs', '/src/data/report.json', '/package.json', '/missing', '/%2e%2e/.env', '/assets/missing.js', '/assets/%2e%2e/server.mjs']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});

test('all production script and CSS references resolve over the real server', async t => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"<>]+)"/g)].map(match => match[1]);
  assert.ok(assets.length > 1, 'run npm run build before tests');
  const server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.close(); server.closeAllConnections(); });
  for (const asset of assets) assert.equal((await fetch(`http://127.0.0.1:${server.address().port}${asset}`)).status, 200, asset);
});
