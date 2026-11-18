import { readFileSync } from 'node:fs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement', 'ShadowRoot', 'MutationObserver', 'localStorage', 'Event', 'KeyboardEvent', 'MouseEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.getComputedStyle = element => dom.window.getComputedStyle(element);
globalThis.requestAnimationFrame = callback => { const timer = setTimeout(callback, 0); timer.unref(); return timer; };
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.ResizeObserver = globalThis.ResizeObserver;
const { default: React } = await import('react');
const { render, screen, fireEvent, waitFor, cleanup } = await import('@testing-library/react');
const { App, ConfigProvider } = await import('antd');
const { Report } = await import('../src/App.jsx');
after(() => { cleanup(); dom.window.close(); });
function ChartStub({ data }) { return <div data-testid="chart" data-cells={data.length} />; }
const data = JSON.parse(readFileSync(new URL('../src/data/report.json', import.meta.url), 'utf8'));
const mount = () => render(<ConfigProvider theme={{ token: { motion: false } }}><App><Report data={data} HeatmapComponent={ChartStub} /></App></ConfigProvider>);

test('Ant Design Modal confirms titles and preserves draft isolation, cancel, Escape and reload', async () => {
  localStorage.clear(); mount();
  const original = screen.getByRole('heading', { level: 1 }).textContent;
  fireEvent.click(screen.getByRole('button', { name: '修改名称' }));
  fireEvent.change(screen.getByLabelText('模块名称'), { target: { value: '未确认' } });
  assert.equal(screen.getByRole('heading', { level: 1 }).textContent, original);
  fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
  assert.equal(localStorage.getItem('adver-data.report-title'), null);
  fireEvent.click(screen.getByRole('button', { name: '修改名称' }));
  fireEvent.change(screen.getByLabelText('模块名称'), { target: { value: '放弃的草稿' } });
  fireEvent.keyDown(screen.getByRole('dialog').parentElement, { key: 'Escape', code: 'Escape', keyCode: 27 });
  await waitFor(() => assert.equal(screen.queryByRole('dialog'), null));
  fireEvent.click(screen.getByRole('button', { name: '修改名称' }));
  fireEvent.change(screen.getByLabelText('模块名称'), { target: { value: ' ' } });
  fireEvent.click(screen.getByRole('button', { name: '确认修改' }));
  await screen.findByText('请输入1–60个字符的名称。');
  fireEvent.change(screen.getByLabelText('模块名称'), { target: { value: '我的广告投诉报表' } });
  fireEvent.click(screen.getByRole('button', { name: '确认修改' }));
  await waitFor(() => assert.equal(screen.getByRole('heading', { level: 1 }).textContent, '我的广告投诉报表'));
  assert.equal(localStorage.getItem('adver-data.report-title'), '我的广告投诉报表');
  cleanup(); mount();
  assert.equal(screen.getByRole('heading', { level: 1 }).textContent, '我的广告投诉报表');
  cleanup();
});

test('Ant Design scope selector and date mode update Heatmap and accessible details', async () => {
  localStorage.clear(); mount();
  assert.equal(screen.getByTestId('chart').dataset.cells, '64');
  fireEvent.mouseDown(screen.getByRole('combobox', { name: '查看范围' }));
  fireEvent.click(await screen.findByText('全部来源', { selector: '.ant-select-item-option-content' }));
  await waitFor(() => assert.ok(Number(screen.getByTestId('chart').dataset.cells) > 64));
  assert.match(screen.getByRole('status').textContent, /2,899/);
  fireEvent.click(screen.getByText('某一日'));
  await screen.findByLabelText('统计日期');
  fireEvent.click(screen.getByRole('button', { name: '查看数据明细' }));
  assert.ok(screen.getByRole('table')); cleanup();
});
