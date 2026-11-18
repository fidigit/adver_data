import React, { useEffect, useState } from 'react';
import { Line } from '@ant-design/plots';
import { Alert, Button, DatePicker, Segmented, Empty, Spin, Typography } from 'antd';

import dayjs from 'dayjs';
import { complaintTrends } from './complaint-trends.mjs';
import { reportFont } from './heatmap-config.mjs';

export function ComplaintDistribution({ title, onRename }) {
  const [mode, setMode] = useState('range');
  const [date, setDate] = useState(null);
  const [range, setRange] = useState(null);
  const [details, setDetails] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/complaint-distribution', { signal: controller.signal })
      .then(async response => {
        if (response.status === 404) {
          throw new Error('当前地址未提供投诉统计接口，请检查报表服务地址。');
        }
        if (!response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('投诉统计接口返回了异常响应，请检查服务地址和 API 转发。');
        }
        const data = await response.json().catch(() => {
          throw new Error('投诉统计接口返回的数据格式有误，请稍后重试。');
        });
        if (!response.ok) throw new Error(data?.error || '暂时无法读取投诉统计，请稍后重试。');
        if (!Array.isArray(data?.series) || !Array.isArray(data?.rows)) {
          throw new Error('投诉统计接口返回的数据格式有误，请稍后重试。');
        }
        return data;
      })
      .then(data => setResult(data))
      .catch(error => {
        if (!controller.signal.aborted) setResult({ error: error.message });
      });
    return () => controller.abort();
  }, [attempt]);

  const rows = result?.rows;
  const first = rows?.[0]?.date.slice(0, 10);
  const last = rows?.at(-1)?.date.slice(0, 10);
  const activeRange = mode === 'day' && first ? [date ?? dayjs(first), date ?? dayjs(first)] : range;
  const shown = activeRange ? rows?.filter(({ date: value }) => {
    const day = value.slice(0, 10);
    return day >= activeRange[0].format('YYYY-MM-DD') && day <= activeRange[1].format('YYYY-MM-DD');
  }) : rows;
  const disabledDate = value => value.format('YYYY-MM-DD') < first || value.format('YYYY-MM-DD') > last;
  const trends = last ? complaintTrends(rows, activeRange?.[1] ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())) : [];
  const points = shown?.flatMap(({ date, counts }) =>
    counts.map((count, index) => ({ date, count, series: result.series[index] }))
  );
  return <section className="report-panel distribution-panel" aria-labelledby="distribution-title">
    <header className="report-header">
      <Typography.Title level={2} id="distribution-title">{title}</Typography.Title>
      <Button onClick={onRename} aria-label="修改广告投诉分布名称">修改名称</Button>
    </header>
    {first && <div className="filter-bar">
      <div className="filter-field">
        <label>统计时间</label>
        <Segmented aria-label="广告投诉分布统计时间" options={[{ label: '日期范围', value: 'range' }, { label: '某一日', value: 'day' }]}
          value={mode} onChange={setMode} />
      </div>
      <div className="filter-field">
        <label htmlFor={mode === 'day' ? 'distribution-date' : 'distribution-start'}>{mode === 'day' ? '统计日期' : '开始与结束日期'}</label>
        {mode === 'day'
          ? <DatePicker id="distribution-date" value={date ?? dayjs(first)} onChange={setDate} disabledDate={disabledDate} allowClear={false} />
          : <DatePicker.RangePicker id={{ start: 'distribution-start', end: 'distribution-end' }}
            value={range ?? [dayjs(first), dayjs(last)]} onChange={setRange} disabledDate={disabledDate} allowClear={false} />}
      </div>
    </div>}
    {trends.length > 0 && <div className="distribution-trends" aria-label="总投诉数同比">
      {trends.map(({ label, current, previous, period, priorPeriod, change }) => <div className="distribution-trend" key={label}>
        <Typography.Text>{label}</Typography.Text>
        <strong className={change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : undefined}>
          {change === null ? '—' : new Intl.NumberFormat('zh-CN', { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 }).format(change)}
        </strong>
        <Typography.Text type="secondary">{period[0] === period[1] ? period[0] : period.join(' 至 ')}</Typography.Text>
        <Typography.Text type="secondary">
          {current === null || previous === null ? '本期或上期缺少日期数据' : previous === 0 ? '上期为 0 条，无法计算' : current + ' 条 / 上期 ' + previous + ' 条'}
        </Typography.Text>
        <Typography.Text type="secondary">上期 {priorPeriod[0] === priorPeriod[1] ? priorPeriod[0] : priorPeriod.join(' 至 ')}</Typography.Text>
      </div>)}
    </div>}
    <div className="distribution-chart">
      {!result && <Spin description="正在读取投诉统计"><div className="distribution-loading" /></Spin>}
      {result?.error && <Alert type="warning" showIcon title={result.error}
        action={<Button onClick={() => { setResult(null); setAttempt(value => value + 1); }}>重试</Button>} />}
      {points?.length === 0 && <Empty description="暂无投诉统计" />}
      {points?.length > 0 && <Line data={points} xField="date" yField="count" colorField="series"
        height={420} style={{ lineWidth: datum => (Array.isArray(datum) ? datum[0] : datum)?.series === result.series[0] ? 3.5 : 2.3 }} point={{ size: 2 }} animate={false}
        axis={{ x: { title: '日期', labelFontFamily: reportFont, titleFontFamily: reportFont }, y: { title: '投诉数', labelFontFamily: reportFont, titleFontFamily: reportFont, labelFormatter: '~s' } }}
        legend={{ color: { position: 'bottom', itemLabelFontFamily: reportFont } }}
        scale={{ y: { domainMin: 0 }, color: { domain: result.series, range: [
          '#2c2830', '#bf581c', '#007b73', '#405ab8', '#77469f', '#897100', '#b63964', '#457335', '#536376',
        ] } }}
        tooltip={{ title: 'date', items: [{ field: 'count', name: '投诉数' }] }}
        interaction={{ tooltip: { shared: true } }} />}
    </div>
    {first && <footer className="chart-footer distribution-footer">
      <Button type="link" aria-expanded={details} onClick={() => setDetails(value => !value)}>
        {details ? '收起数据明细' : '查看数据明细'}
      </Button>
    </footer>}
    {details && shown?.length > 0 && <div className="accessible-data distribution-data">
      <table>
        <caption>{title} · 数据明细</caption>
        <thead><tr><th scope="col">日期</th>{result.series.map(name => <th scope="col" key={name}>{name}</th>)}</tr></thead>
        <tbody>{shown.map(({ date, counts }) => <tr key={date}>
          <th scope="row">{date}</th>
          {counts.map((count, index) => <td key={result.series[index]}>{count.toLocaleString('zh-CN')}</td>)}
        </tr>)}</tbody>
      </table>
    </div>}
  </section>;
}
