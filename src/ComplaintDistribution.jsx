import React, { useEffect, useState } from 'react';
import { Line } from '@ant-design/plots';
import { Alert, Button, DatePicker, Empty, Spin, Typography } from 'antd';

import dayjs from 'dayjs';
import { reportFont } from './heatmap-config.mjs';

export function ComplaintDistribution({ title, onRename }) {
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
  const shown = range ? rows?.filter(({ date }) => {
    const day = date.slice(0, 10);
    return day >= range[0].format('YYYY-MM-DD') && day <= range[1].format('YYYY-MM-DD');
  }) : rows;
  const points = shown?.flatMap(({ date, counts }) =>
    counts.map((count, index) => ({ date, count, series: result.series[index] }))
  );
  return <section className="report-panel distribution-panel" aria-labelledby="distribution-title">
    <header className="distribution-header">
      <Typography.Title level={2} id="distribution-title">{title}</Typography.Title>
      <Button onClick={onRename} aria-label="修改广告投诉分布名称">修改名称</Button>
    </header>
    {first && <div className="distribution-controls">
      <div className="filter-field">
        <label htmlFor="distribution-start">统计日期（dt）</label>
        <DatePicker.RangePicker id={{ start: 'distribution-start', end: 'distribution-end' }}
          value={range ?? [dayjs(first), dayjs(last)]} onChange={setRange}
          disabledDate={date => date.format('YYYY-MM-DD') < first || date.format('YYYY-MM-DD') > last} />
      </div>
      <Button type="link" aria-expanded={details} onClick={() => setDetails(value => !value)}>
        {details ? '收起数据明细' : '查看数据明细'}
      </Button>
    </div>}
    {!result && <Spin description="正在读取投诉统计"><div className="distribution-loading" /></Spin>}
    {result?.error && <Alert type="warning" showIcon title={result.error}
      action={<Button onClick={() => { setResult(null); setAttempt(value => value + 1); }}>重试</Button>} />}
    {points?.length === 0 && <Empty description="暂无投诉统计" />}
    {points?.length > 0 && <Line data={points} xField="date" yField="count" colorField="series"
      height={420} point={{ size: 2 }} animate={false}
      axis={{ x: { title: '日期', labelFontFamily: reportFont, titleFontFamily: reportFont }, y: { title: '投诉数', labelFontFamily: reportFont, titleFontFamily: reportFont, labelFormatter: '~s' } }}
      legend={{ color: { position: 'bottom', itemLabelFontFamily: reportFont } }}
      scale={{ y: { domainMin: 0 }, color: { domain: result.series, range: [
        '#703126', '#bc5c24', '#197973', '#4969ad', '#7e549e', '#8c7220', '#b64765', '#416c38', '#5e6b7d',
      ] } }}
      tooltip={{ title: 'date', items: [{ field: 'count', name: '投诉数' }] }}
      interaction={{ tooltip: { shared: true } }} />}
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
