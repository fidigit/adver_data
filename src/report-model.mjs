export const DEFAULT_TITLE = '各来源在不同投诉类型中的表现';
export const TITLE_KEY = 'adver-data.report-title';

export function validateTitle(value) {
  const title = String(value ?? '').trim();
  return title.length > 0 && title.length <= 60 ? title : null;
}

export function loadTitle(storage) {
  try { return validateTitle(storage.getItem(TITLE_KEY)) || DEFAULT_TITLE; }
  catch { return DEFAULT_TITLE; }
}

export function saveTitle(storage, title) {
  try { storage.setItem(TITLE_KEY, title); return true; }
  catch { return false; }
}

export function aggregateReport(report, { start, end, scope = '广告来源' }) {
  const totals = new Map();
  for (const row of report.rows) {
    if (scope === '全部' || row.group === scope) totals.set(row.source, (totals.get(row.source) || 0) + row.n);
  }
  let sources = [...totals.keys()].sort((a, b) => totals.get(b) - totals.get(a));
  if (scope === '广告来源') sources = sources.slice(0, 8);
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
    const status = !count ? 'empty' : count < 10 ? 'low' : 'normal';
    return {
      scene, source, count, high, rate, status,
      title: `${scene} × ${source}`,
      rateText: count ? `${(rate * 100).toFixed(1)}%` : '—',
      label: !count ? '—' : count < 10 ? `样本少\nn=${count}` : `${(rate * 100).toFixed(1)}%\n${high} / ${count}`,
    };
  }));
  return {
    sources, scenes: report.scenes, cells,
    count: records.reduce((sum, row) => sum + row.n, 0),
    high: records.reduce((sum, row) => sum + row.h, 0),
  };
}
