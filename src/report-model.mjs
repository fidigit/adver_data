export const DEFAULT_TITLE = '广告源×广告场景 激烈投诉分布';
export const TITLE_KEY = 'adver-data.report-title';

export function validateTitle(value) {
  const title = String(value ?? '').trim();
  return title.length > 0 && title.length <= 60 ? title : null;
}

export function loadTitle(storage, key = TITLE_KEY, fallback = DEFAULT_TITLE) {
  try { return validateTitle(storage.getItem(key)) || fallback; }
  catch { return fallback; }
}

export function saveTitle(storage, title, key = TITLE_KEY) {
  try { storage.setItem(key, title); return true; }
  catch { return false; }
}

export function aggregateReport(report, { start, end, scope = '广告来源', topN = 8, minSample = 10 }) {
  const totals = new Map();
  for (const row of report.rows) {
    if (scope === '全部' || row.group === scope) totals.set(row.source, (totals.get(row.source) || 0) + row.n);
  }
  let sources = [...totals.keys()].sort((a, b) => totals.get(b) - totals.get(a));
  if (scope === '广告来源') sources = sources.slice(0, topN);
  const records = report.rows.filter(row => row.date >= start && row.date <= end && sources.includes(row.source));
  const sums = new Map();
  for (const row of records) {
    const key = JSON.stringify([row.scene, row.source]);
    const cell = sums.get(key) || { count: 0, high: 0 };
    cell.count += row.n; cell.high += row.h; sums.set(key, cell);
  }
  const cells = report.scenes.flatMap(scene => sources.map(source => {
    const { count, high } = sums.get(JSON.stringify([scene, source])) || { count: 0, high: 0 };
    const rate = count ? high / count : 0;
    const status = !count ? 'empty' : count < minSample ? 'low' : 'normal';
    return {
      scene, source, count, high, rate, status,
      title: `${scene} × ${source}`,
      rateText: count ? `${(rate * 100).toFixed(1)}%` : '—',
      label: !count ? '—' : count < minSample ? `样本少\nn=${count}` : `${(rate * 100).toFixed(1)}%\n${high} / ${count}`,
    };
  }));
  return {
    sources, minSample, scenes: report.scenes, cells,
    count: records.reduce((sum, row) => sum + row.n, 0),
    high: records.reduce((sum, row) => sum + row.h, 0),
  };
}
