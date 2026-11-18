const palette = ['#fff2cf', '#f5be72', '#d96e42', '#842e35'];
export const reportFont = '"Microsoft YaHei", "PingFang SC", sans-serif';
function labelColor(d) {
  return d.status !== 'normal' ? '#746353' : d.rate >= 0.65 ? '#ffffff' : '#36271e';
}

export function colorAtRate(rate) {
  const position = rate * 3;
  const index = Math.min(2, Math.floor(position));
  const channels = color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  const from = channels(palette[index]), to = channels(palette[index + 1]);
  return `rgb(${from.map((value, i) => Math.round(value + (to[i] - value) * (position - index))).join(', ')})`;
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
    paddingTop: 54,
    paddingBottom: 72,
    scale: {
      x: { type: 'band', domain: report.sources, padding: 0.03 },
      y: { type: 'band', domain: report.scenes, padding: 0.03 },
      color: { type: 'linear', domain: [0, 1/3, 2/3, 1], range: palette },
    },
    axis: {
      x: { position: 'top', labelFontFamily: reportFont, labelFontWeight: 700, title: false, tick: false, line: false, labelAutoRotate: false, labelAutoHide: false, labelFontSize: 15, labelFill: '#443225', labelFillOpacity: 1 },
      y: { position: 'left', labelFontFamily: reportFont, title: false, tick: false, line: false, labelAutoHide: false, labelFontSize: 15, labelFill: '#443225', labelFillOpacity: 1 },
    },
    legend: {
      color: { title: '激烈情绪占比', position: 'bottom', length: 280, labelFormatter: '.0%', labelFill: '#746353', labelFillOpacity: 1, showHandle: false },
    },
    style: {
      fill: datum => datum.status === 'empty' ? '#fffcf6' : datum.status === 'low' ? '#f2ede4' : colorAtRate(datum.rate),
      stroke: '#fffcf6', lineWidth: 2, radius: 9,
    },
    labels: [
      { text: d => d.status === 'normal' ? d.rateText : d.count ? '样本少' : '—',
        position: 'inside', dy: d => d.count ? -9 : 0, fontFamily: reportFont,
        fontSize: d => d.status === 'normal' ? 20 : 15, fontWeight: d => d.status === 'normal' ? 700 : 400, fill: labelColor, fillOpacity: 1 },
      { text: d => d.status === 'normal' ? d.high + ' / ' + d.count : d.count ? 'n = ' + d.count : '',
        position: 'inside', dy: 12, fontFamily: reportFont, fontSize: 14, fill: labelColor, fillOpacity: 1 },
    ],
    tooltip: {
      title: 'title',
      items: [
        { field: 'count', name: '投诉条数' },
        { field: 'high', name: '激烈投诉条数' },
        { field: 'rateText', name: '激烈情绪占比' },
        datum => ({ name: '样本提示', value: !datum.count ? '无记录' : datum.status === 'low' ? '少于' + report.minSample + '条，不参与比例着色' : '正常样本' }),
      ],
    },
    interaction: { tooltip: { shared: false }, legendFilter: false },
    animate: false,
  };
}
