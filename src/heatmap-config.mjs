export function colorAtRate(rate) {
  const from = [239, 246, 255], to = [0, 59, 156];
  return `rgb(${from.map((value, i) => Math.round(value + (to[i] - value) * rate)).join(', ')})`;
}

export function heatmapConfig(report) {
  return {
    data: report.cells,
    xField: 'source',
    yField: 'scene',
    colorField: 'rate',
    // Heatmap默认point标记；矩阵需要cell标记，不是point的shape名称。
    mark: 'cell',
    autoFit: true,
    height: 640,
    paddingLeft: 200,
    paddingRight: 24,
    paddingTop: 32,
    paddingBottom: 120,
    scale: {
      x: { type: 'band', domain: report.sources, padding: 0.03 },
      y: { type: 'band', domain: report.scenes, padding: 0.03 },
      color: { type: 'linear', domain: [0, 1], range: ['#eff6ff', '#003b9c'] },
    },
    axis: {
      x: { title: false, tick: false, line: false, labelAutoRotate: false, labelAutoHide: false, labelFontSize: 12, labelFill: '#526078', labelFillOpacity: 1 },
      y: { title: false, tick: false, line: false, labelAutoHide: false, labelFontSize: 12, labelFill: '#34445a', labelFillOpacity: 1 },
    },
    legend: {
      color: { title: '激烈情绪占比', position: 'bottom', length: 280, labelFormatter: '.0%', labelFill: '#64748b', labelFillOpacity: 1, showHandle: false },
    },
    style: {
      fill: datum => datum.status === 'empty' ? '#ffffff' : datum.status === 'low' ? '#f0f2f5' : colorAtRate(datum.rate),
      stroke: '#ffffff', lineWidth: 2, radius: 2,
    },
    label: {
      text: 'label', fontSize: 13, lineHeight: 19, fontWeight: 500, fillOpacity: 1,
      fill: datum => datum.status !== 'normal' ? '#8793a5' : datum.rate >= 0.55 ? '#ffffff' : '#17324d',
      position: 'inside',
    },
    tooltip: {
      title: 'title',
      items: [
        { field: 'count', name: '投诉条数' },
        { field: 'high', name: '激烈投诉条数' },
        { field: 'rateText', name: '激烈情绪占比' },
        datum => ({ name: '样本提示', value: !datum.count ? '无记录' : datum.count < 10 ? '少于10条，不参与比例着色' : '正常样本' }),
      ],
    },
    interaction: { tooltip: { shared: false }, legendFilter: false },
    animate: false,
  };
}
