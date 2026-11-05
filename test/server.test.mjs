import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { createServer } from '../server.mjs';

test('HTTP deployment serves the exact original report and limits exposed files', async t => {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.close(); server.closeAllConnections(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const original = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const path of ['/', '/index.html?test=1']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html; charset=utf-8/);
    assert.equal(await response.text(), original);
  }
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.deepEqual(await (await fetch(base + '/api/health')).json(), { status: 'ok', version: '0.0.1' });
  for (const path of ['/.env', '/server.mjs', '/package.json', '/missing', '/%2e%2e/.env']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});

test('all inline report scripts parse without errors', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 3);
  for (const [index, script] of scripts.entries()) new Script(script[1], { filename: `report-${index}.js` });
});
