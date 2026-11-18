import dayjs from 'dayjs';

const formatDay = day => day.format('YYYY-MM-DD');

export function complaintTrends(rows, anchor) {
  const day = dayjs(anchor);
  const totals = new Map();
  for (const { date, counts } of rows) {
    const key = date.slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + counts[0]);
  }

  function sum(start, days) {
    let total = 0;
    for (let offset = 0; offset < days; offset++) {
      const count = totals.get(formatDay(start.add(offset, 'day')));
      if (count === undefined) return null;
      total += count;
    }
    return total;
  }

  return [['日同比', 1], ['周同比', 7], ['月同比', 30]].map(([label, days]) => {
    const start = day.subtract(days, 'day');
    const priorStart = day.subtract(days * 2, 'day');
    const current = sum(start, days);
    const previous = sum(priorStart, days);
    return {
      label, current, previous,
      period: [formatDay(start), formatDay(day.subtract(1, 'day'))],
      priorPeriod: [formatDay(priorStart), formatDay(start.subtract(1, 'day'))],
      change: current === null || !previous ? null : (current - previous) / previous,
    };
  });
}
