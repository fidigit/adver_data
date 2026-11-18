import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { createRequire } from 'node:module';
import { aggregateReport } from '../src/report-model.mjs';
import { heatmapConfig } from '../src/heatmap-config.mjs';
const require = createRequire(import.meta.url);
const { Renderer } = require('@antv/g-svg');
const { Renderer: CanvasRenderer } = require('@antv/g-canvas');

test('actual Ant Design Charts engine renders the heatmap with all cells, labels and sample fills', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="chart"></div></body></html>', { pretendToBeVisual: true });
  const { window } = dom;
  for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement', 'XMLSerializer']) globalThis[name] = window[name];
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  globalThis.addEventListener = window.addEventListener.bind(window);
  globalThis.removeEventListener = window.removeEventListener.bind(window);
  globalThis.devicePixelRatio = 1;
  globalThis.requestAnimationFrame = callback => { const timer = setTimeout(() => callback(performance.now()), 16); timer.unref(); return timer; };
  globalThis.cancelAnimationFrame = clearTimeout;
  const contexts = new WeakMap();
  for (const property of ['width', 'height']) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLCanvasElement.prototype, property);
    Object.defineProperty(window.HTMLCanvasElement.prototype, property, {
      get: descriptor.get,
      set(value) { descriptor.set.call(this, value); if (contexts.has(this)) contexts.get(this).canvas[property] = value; },
    });
  }
  window.HTMLCanvasElement.prototype.getContext = function () {
    if (!contexts.has(this)) contexts.set(this, createCanvas(this.width || 1, this.height || 1).getContext('2d'));
    return contexts.get(this);
  };
  if (process.platform === 'win32') GlobalFonts.registerFromPath('C:/Windows/Fonts/msyh.ttc', 'Microsoft YaHei');
  const { Plots } = require('@ant-design/plots/lib/core/index.js');
  const data = JSON.parse(await readFile(new URL('../src/data/report.json', import.meta.url), 'utf8'));
  const report = aggregateReport(data, { start: data.dates[0], end: data.dates.at(-1) });
  const plot = new Plots.Heatmap(document.getElementById('chart'), {
    ...heatmapConfig(report), autoFit: false, width: 1240, height: 640, renderer: new Renderer(),
  });
  try {
    // 与Plot.render一致的真实适配器和G2渲染路径；直接等待异步绘制以捕获配置错误。
    plot.execAdaptor(); plot.chart.options(plot.options); await plot.chart.render();
    const svg = document.querySelector('svg');
    assert.ok(svg);
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const xml = svg.outerHTML;
    assert.match(xml, /Gromore/); assert.match(xml, /14.6%/); assert.match(xml, /样本少/);
    assert.doesNotMatch(xml, /NaN/); assert.match(xml, /100%/);
    assert.ok(/rgba?\(240,\s*242,\s*245(?:,1)?\)|#f0f2f5/i.test(xml), 'small samples must use gray fill');
    const marks = plot.chart.getContext().canvas.document.querySelectorAll('.element');
    assert.equal(marks.length, 64);
    await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
    await writeFile(new URL('../test-results/ant-design-heatmap.svg', import.meta.url), xml);
    // 用与浏览器相同的Canvas绘制路径导出图片，避免SVG转图工具的多行文字兼容差异。
    const canvasHost = document.createElement('div'); document.body.append(canvasHost);
    const canvasPlot = new Plots.Heatmap(canvasHost, { ...heatmapConfig(report), autoFit: false, width: 1240, height: 640, renderer: new CanvasRenderer() });
    try {
      canvasPlot.execAdaptor(); canvasPlot.chart.options(canvasPlot.options); await canvasPlot.chart.render();
      const canvas = contexts.get(canvasHost.querySelector('canvas')).canvas;
      const output = createCanvas(1240, 640), context = output.getContext('2d');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, 1240, 640); context.drawImage(canvas, 0, 0);
      await writeFile(new URL('../test-results/ant-design-heatmap.png', import.meta.url), output.toBuffer('image/png'));
    } finally { canvasPlot.destroy(); }
  } finally { plot.destroy(); dom.window.close(); }
});
