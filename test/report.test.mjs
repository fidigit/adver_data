import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function load(storage = new Map(), failStorage = false) {
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, {
    value: '', textContent: '', innerHTML: '', hidden: false, open: false,
    focus() {}, showModal() { this.open = true; }, close() { this.open = false; this.onclose?.(); },
  }]));
  elements.reportTitle.textContent = '各来源在不同投诉类型中的表现';
  elements.pMode.value = 'range'; elements.pScope.value = '广告来源';
  const document = { title: elements.reportTitle.textContent, getElementById: id => elements[id] };
  runInNewContext(script, { document, localStorage: {
    getItem(key) { if (failStorage) throw Error('storage blocked'); return storage.get(key); },
    setItem(key, value) { if (failStorage) throw Error('storage blocked'); storage.set(key, value); },
  } });
  return { elements, document, storage };
}
const event = { preventDefault() {} };

test('title requires confirmation; discard and Escape preserve the committed name', () => {
  const { elements: e, document, storage } = load();
  const initial = e.reportTitle.textContent;
  e.editTitle.onclick(); assert.equal(e.titleDialog.open, true);
  e.titleInput.value = '未确认'; assert.equal(e.reportTitle.textContent, initial);
  e.discardTitle.onclick(); assert.equal(e.titleDialog.open, false);
  assert.equal(e.reportTitle.textContent, initial); assert.equal(storage.size, 0);
  e.editTitle.onclick(); e.titleInput.value = '放弃'; e.titleDialog.oncancel(event);
  assert.equal(e.reportTitle.textContent, initial); assert.equal(storage.size, 0);
  e.editTitle.onclick(); e.titleInput.value = '  广告投诉分析  '; e.titleForm.onsubmit(event);
  assert.equal(e.reportTitle.textContent, '广告投诉分析'); assert.equal(document.title, '广告投诉分析');
  assert.equal(e.titleDialog.open, false);
  assert.equal(load(storage).elements.reportTitle.textContent, '广告投诉分析');
});

test('title rejects empty and oversized values and safely renders literal text', () => {
  const { elements: e } = load();
  e.editTitle.onclick();
  for (const value of ['  ', '名'.repeat(61)]) {
    e.titleInput.value = value; e.titleForm.onsubmit(event);
    assert.equal(e.titleDialog.open, true); assert.match(e.titleError.textContent, /1–60/);
  }
  e.titleInput.value = '<img src=x onerror=alert(1)>'; e.titleForm.onsubmit(event);
  assert.equal(e.reportTitle.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(e.reportTitle.innerHTML, '');
  const blocked = load(new Map(), true).elements;
  blocked.editTitle.onclick(); blocked.titleInput.value = '本次名称'; blocked.titleForm.onsubmit(event);
  assert.equal(blocked.reportTitle.textContent, '本次名称');
  assert.match(blocked.titleStatus.textContent, /本次打开期间生效/);
});

test('retained heatmap keeps original totals, day filtering and date correction', () => {
  const { elements: e } = load();
  assert.match(e.pNote.textContent, /1142 条投诉/);
  assert.match(e.pHeat.innerHTML, /14.6%/);
  e.pScope.value = '全部'; e.pScope.onchange(); assert.match(e.pNote.textContent, /2899 条投诉/);
  e.pMode.value = 'day'; e.pStart.value = '2026-10-21'; e.pMode.onchange();
  assert.equal(e.pEndLabel.hidden, true); assert.match(e.pNote.textContent, /10-21 至 2026-10-21/);
  e.pMode.value = 'range'; e.pStart.value = '2026-10-27'; e.pEnd.value = '2026-10-21'; e.pStart.onchange();
  assert.equal(e.pEnd.value, '2026-10-27'); assert.equal(e.pEndLabel.hidden, false);
  assert.equal((html.match(/<section\b/g) || []).length, 1);
  assert.doesNotMatch(html, /id="cube"|id="play"|id="trend"/);
});
