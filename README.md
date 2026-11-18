# 广告投诉分析报表 v0.0.3

仓库：[fidigit/adver_data](https://github.com/fidigit/adver_data)。

v0.0.3将现有单模块报表改造为React + Ant Design + Ant Design Charts真实Heatmap组件。参考[官方Heatmap教程](https://ant-design-charts.antgroup.com/components/plots/heatmap)。

## 当前功能

- 横轴为来源，纵轴为投诉类型；蓝色色阶固定0–100%，日期筛选后不改变比例范围。
- 格内显示激烈情绪占比和“激烈 / 投诉条数”；少于10条为灰色小样本，无记录为白色；真实零占比是浅蓝色。
- 原生图表Tooltip显示类型、来源、投诉条数、激烈条数及样本提示；来源顺序按全期投诉量固定。
- Ant Design的Segmented、RangePicker/DatePicker、Select提供日期范围/单日及来源筛选；范围限制在已有样本日期。
- Ant Design Modal提供「确认修改／放弃修改」，Esc也可放弃；名称1–60字符。沿用v0.0.2的浏览器localStorage键，刷新保留且兼容旧名称，不跨设备同步。
- 窄屏可横向滚动；同一模块内可展开数据明细，便于键盘和辅助技术读取图表数值。

## 本机运行

使用Node.js 24及npm。在PowerShell或终端执行：

```sh
npm ci
npm run build
npm test
npm start
```

访问 `http://127.0.0.1:18081`，健康接口 `/api/health` 返回版本0.0.3。也可用 `node --env-file-if-exists=.env server.mjs` 启动。缺少dist构建时服务明确报错，不能继续用旧版本的“只克隆并启动”流程。

开发热更新运行 `npm run dev`，以Vite输出的本机地址为准。生产Node服务只依赖内置模块，提供构建后的dist；浏览器无需访问外部CDN。依赖版本由package-lock.json锁定。

- [v0.0.3服务器部署与升级](docs/deployment-v0.0.3.md)
- [外部Dashboard接入评估](docs/external-report-assessment-v0.0.2.md)
- [v0.0.2历史部署说明](docs/deployment-v0.0.2.md)

## 数据与配置

`src/data/report.json`保持原505行汇总记录：2026-10-21至2026-10-27全部2,899条投诉、869条激烈投诉；默认前8广告来源1,142条。统计为先累计条数再计算占比，不平均每日百分比。不自动拉取实时数据；外部Dashboard、数据库及账号系统尚未接入。

数据打包在前端资源内，访问者可读取全部汇总数据。标题仅保存在浏览器。原中文HTML作为本地历史原件保留且被Git忽略；v0.0.3移除public/index.html，当前入口为index.html与src/main.jsx。

可将.env.example复制为.env：HOST默认0.0.0.0、PORT默认18081。Docker容器内固定18081，通过APP_PORT修改服务器映射端口。数据/图表改动后需重新构建；Docker方式需重新构建镜像。

## 验证范围

9项测试覆盖原始统计、单日/范围/反馈渠道、固定色阶、零值/小样本、标题本地存储、HTTP路径与生产资源、真实Ant Design弹窗/筛选，以及真实Heatmap引擎SVG和Canvas渲染（含64格、标签和图例）。图表渲染图片输出到被忽略的test-results目录。

界面交互测试使用JSDOM，真实图表使用离屏渲染；浏览器工具启动失败，尚未完成浏览器中的鼠标悬停、移动端及视觉验收。本机没有Docker，容器构建和目标服务器网络仍需部署后验证。测试命令在所有断言完成后强制退出，以清理JSDOM和组件调度器剩余句柄。
