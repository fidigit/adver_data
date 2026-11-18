import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_TITLE, TITLE_KEY, aggregateReport, loadTitle, saveTitle, validateTitle } from '../src/report-model.mjs';
import { heatmapConfig } from '../src/heatmap-config.mjs';
const data = JSON.parse(await readFile(new URL('../src/data/report.json', import.meta.url), 'utf8'));
const range = { start: '2026-10-21', end: '2026-10-27' };

test('original totals and weighted proportions are preserved', () => {
  assert.equal(data.rows.length, 505);
  const all = aggregateReport(data, { ...range, scope: '全部' });
  assert.equal(all.count, 2899); assert.equal(all.high, 869);
  const report = aggregateReport(data, range);
  assert.equal(report.count, 1142); assert.equal(report.sources.length, 8);
  const cell = report.cells.find(cell => cell.scene === '广告不满但原因不明' && cell.source === 'Gromore');
  assert.equal(cell.count, 48); assert.equal(cell.high, 7); assert.equal(cell.rateText, '14.6%');
});

test('day/range filters keep full-period source ordering and explicit missing cells', () => {
  const all = aggregateReport(data, range);
  const day = aggregateReport(data, { start: range.start, end: range.start });
  assert.deepEqual(day.sources, all.sources);
  assert.equal(day.cells.length, data.scenes.length * 8);
  const empty = day.cells.find(cell => !cell.count);
  assert.equal(empty.status, 'empty'); assert.equal(empty.label, '—');
  const feedback = aggregateReport(data, { ...range, scope: '反馈渠道' });
  assert.ok(feedback.sources.length > 0);
  assert.equal(feedback.count, data.rows.filter(row => feedback.sources.includes(row.source)).reduce((sum, row) => sum + row.n, 0));
});

test('Heatmap fixes scale and distinguishes small samples from zero', () => {
  const report = aggregateReport(data, { start: range.start, end: range.start });
  const config = heatmapConfig(report);
  assert.equal(config.mark, 'cell'); assert.equal(config.colorField, 'rate');
  assert.deepEqual(config.scale.color.domain, [0, 1]);
  assert.equal(config.style.fill({ status: 'empty' }), '#ffffff');
  assert.equal(config.style.fill({ status: 'low' }), '#f0f2f5');
  assert.notEqual(config.style.fill({ status: 'normal', rate: 0 }), '#ffffff');
  assert.notEqual(config.style.fill({ status: 'normal', rate: 0 }), '#f0f2f5');
  assert.match(report.cells.find(cell => cell.status === 'low').label, /样本少/);
});

test('title validation and storage preserve existing v0.0.2 preferences', () => {
  const map = new Map([[TITLE_KEY, '原有名称']]);
  const storage = { getItem: key => map.get(key), setItem: (key, value) => map.set(key, value) };
  assert.equal(loadTitle(storage), '原有名称'); assert.equal(validateTitle('  新名称  '), '新名称');
  assert.equal(validateTitle('  '), null); assert.equal(validateTitle('名'.repeat(61)), null);
  assert.equal(saveTitle(storage, '<测试>'), true); assert.equal(loadTitle(storage), '<测试>');
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.equal(loadTitle(blocked), DEFAULT_TITLE); assert.equal(saveTitle(blocked, '名称'), false);
});
