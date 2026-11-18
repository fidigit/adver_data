import { ComplaintDistribution } from './ComplaintDistribution.jsx';
import React, { Component, useMemo, useState } from 'react';
import { Heatmap } from '@ant-design/plots';
import { Alert, App as AntApp, Button, ConfigProvider, DatePicker, Form, Input, InputNumber, Modal, Segmented, Select, Space, Tag, Typography } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import data from './data/report.json';
import { aggregateReport, loadTitle, saveTitle, validateTitle } from './report-model.mjs';
import { heatmapConfig, reportFont } from './heatmap-config.mjs';

dayjs.locale('zh-cn');
const { RangePicker } = DatePicker;
const firstDate = data.dates[0], lastDate = data.dates.at(-1);
const defaultRange = [dayjs(firstDate), dayjs(lastDate)];
const advertisingSourceCount = new Set(data.rows.filter(row => row.group === '广告来源').map(row => row.source)).size;
const scopeOptions = [
  { value: '广告来源', label: '主要广告来源' },
  { value: '反馈渠道', label: '反馈渠道' },
  { value: '全部', label: '全部来源' },
];
const distributionKey = 'adver-data.distribution-title';
const browserStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

class ChartBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <Alert type="error" showIcon title="图表加载失败，请刷新重试。" /> : this.props.children;
  }
}

export function Report({ HeatmapComponent = Heatmap }) {
  const { message } = AntApp.useApp();
  const [title, setTitle] = useState(() => loadTitle(browserStorage));
  const [distributionTitle, setDistributionTitle] = useState(() => loadTitle(browserStorage, distributionKey, '广告投诉分布'));
  const [topN, setTopN] = useState(8);
  const [minSample, setMinSample] = useState(10);
  const [draft, setDraft] = useState('');
  const [titleError, setTitleError] = useState('');
  const [editing, setEditing] = useState(null);
  const [mode, setMode] = useState('range');
  const [range, setRange] = useState(defaultRange);
  const [date, setDate] = useState(defaultRange[0]);
  const [scope, setScope] = useState('广告来源');
  const [details, setDetails] = useState(false);
  const start = (mode === 'day' ? date : range[0]).format('YYYY-MM-DD');
  const end = (mode === 'day' ? date : range[1]).format('YYYY-MM-DD');
  const report = useMemo(() => aggregateReport(data, { start, end, scope, topN, minSample }), [start, end, scope, topN, minSample]);
  const config = useMemo(() => heatmapConfig(report), [report]);
  const disabledDate = value => value && (value.format('YYYY-MM-DD') < firstDate || value.format('YYYY-MM-DD') > lastDate);
  const abandon = () => { setEditing(null); setTitleError(''); };
  const editTitle = (target, current) => {
    setDraft(current);
    setTitleError('');
    setEditing(target);
  };
  const confirm = () => {
    const value = validateTitle(draft);
    if (!value) { setTitleError('请输入1–60个字符的名称。'); return; }
    const distribution = editing === 'distribution';
    if (distribution) setDistributionTitle(value);
    else setTitle(value);
    abandon();
    const persisted = saveTitle(browserStorage, value, distribution ? distributionKey : undefined);
    message.success(persisted ? '名称已修改，刷新后保留。' : '名称已修改；浏览器存储不可用，本次页面生效。');
  };
  return <main className="report-shell">
    <section className="report-panel" aria-labelledby="report-title">
      <header className="report-header">
        <div>
          <div className="report-eyebrow"><span className="report-dot" />广告投诉 · 来源分析</div>
          <Typography.Title level={1} id="report-title">{title}</Typography.Title>
          <Typography.Text type="secondary">对比各广告来源的投诉类型，识别激烈情绪集中的位置。</Typography.Text>
        </div>
        <Button onClick={() => editTitle('heatmap', title)}>修改名称</Button>
      </header>
      <div className="filter-bar">
        <div className="filter-field"><label>统计时间</label><Segmented aria-label="统计时间" options={[{ label: '日期范围', value: 'range' }, { label: '某一日', value: 'day' }]} value={mode} onChange={setMode} /></div>
        <div className="filter-field"><label htmlFor={mode === 'day' ? 'report-date' : 'report-range'}>{mode === 'day' ? '统计日期' : '开始与结束日期'}</label>
          {mode === 'day' ? <DatePicker id="report-date" value={date} onChange={value => value && setDate(value)} disabledDate={disabledDate} allowClear={false} /> : <RangePicker id="report-range" value={range} onChange={value => value?.[0] && value?.[1] && setRange(value)} disabledDate={disabledDate} allowClear={false} />}
        </div>
        <div className="filter-field"><label htmlFor="report-scope">查看范围</label><Select id="report-scope" aria-label="查看范围" value={scope} onChange={setScope} options={scopeOptions} /></div>
        {scope === '广告来源' && <div className="filter-field"><label htmlFor="source-count">主要广告来源（前 N）</label><InputNumber id="source-count" min={1} max={advertisingSourceCount} precision={0} value={topN} onChange={value => { if (Number.isInteger(value) && value >= 1 && value <= advertisingSourceCount) setTopN(value); }} /></div>}
        <div className="filter-field"><label htmlFor="sample-count">小样本阈值（少于 M 条）</label><InputNumber id="sample-count" min={1} max={Number.MAX_SAFE_INTEGER} precision={0} value={minSample} onChange={value => { if (Number.isSafeInteger(value) && value >= 1) setMinSample(value); }} /></div>
      </div>
      <div className="report-context" role="status">
        <Space size={[8, 8]} wrap><Tag color="gold">{start} 至 {end}</Tag><Typography.Text type="secondary">当前范围 <strong>{report.count.toLocaleString('zh-CN')}</strong> 条投诉，激烈 <strong>{report.high.toLocaleString('zh-CN')}</strong> 条</Typography.Text></Space>
        <Typography.Text type="secondary" className="sample-hint">样本少：少于 {minSample} 条 · — 无记录</Typography.Text>
      </div>
      <div className="heatmap-scroll" role="region" aria-label="激烈情绪占比热力图，可横向滚动查看全部来源">
        <div className="heatmap-stage" style={{ minWidth: Math.max(980, 224 + report.sources.length * 130) }}>
          <span className="matrix-corner">投诉类型 / 来源</span>
          <ChartBoundary><HeatmapComponent {...config} /></ChartBoundary>
        </div>
      </div>
      <footer className="chart-footer"><Typography.Text type="secondary">格内为激烈占比及“激烈 / 投诉条数”；悬停查看明细。色阶固定0–100%，来源按全期投诉量排序。</Typography.Text><Button type="link" onClick={() => setDetails(value => !value)}>{details ? '收起数据明细' : '查看数据明细'}</Button></footer>
      {details && <div className="accessible-data"><table><caption>{title} · {start} 至 {end}</caption><thead><tr><th>投诉类型</th><th>来源</th><th>投诉条数</th><th>激烈条数</th><th>激烈占比</th><th>样本提示</th></tr></thead><tbody>{report.cells.map(cell => <tr key={JSON.stringify([cell.scene, cell.source])}><th scope="row">{cell.scene}</th><td>{cell.source}</td><td>{cell.count}</td><td>{cell.high}</td><td>{cell.rateText}</td><td>{cell.status === 'low' ? '小样本' : cell.status === 'empty' ? '无记录' : '正常'}</td></tr>)}</tbody></table></div>}
    </section>
    <ComplaintDistribution title={distributionTitle} onRename={() => editTitle('distribution', distributionTitle)} />
    <Modal title="确认修改" open={Boolean(editing)} onOk={confirm} onCancel={abandon} okText="确认修改" cancelText="放弃修改" mask={{ closable: false }} destroyOnHidden focusable={{ autoFocusButton: 'cancel' }}>
      <Typography.Paragraph type="secondary">确认后才会修改名称。名称仅保存在当前浏览器，不影响其他用户。</Typography.Paragraph>
      <Form layout="vertical" onFinish={confirm}>
        <Form.Item label="模块名称" htmlFor="title-input" validateStatus={titleError ? 'error' : undefined} help={titleError || '1–60个字符'}>
          <Input id="title-input" value={draft} onChange={event => { setDraft(event.target.value); setTitleError(''); }} maxLength={60} showCount autoComplete="off" />
        </Form.Item>
      </Form>
    </Modal>
  </main>;
}

export function Application() {
  return <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#9c4828', colorText: '#443225', colorTextSecondary: '#746353', borderRadius: 8, fontFamily: reportFont } }}><AntApp><Report /></AntApp></ConfigProvider>;
}
