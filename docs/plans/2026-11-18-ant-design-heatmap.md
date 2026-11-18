# Ant Design Heatmap改造计划

版本v0.0.3。参考用户指定的官方Heatmap文档，使用React、Ant Design、@ant-design/plots的Heatmap组件，Vite生产构建。

1. 将原505条汇总记录提取到src/data/report.json，保持统计口径、样本阈值、顺序和固定0–100%色阶。
2. 使用官方Heatmap的xField/yField/colorField、label、tooltip、scale和style配置真实图表，矩阵采用mark:cell；Ant Design提供日期/范围选择、来源选择与标题确认Modal。
3. 标题沿用原localStorage键，保留确认、放弃、Esc、刷新保存和输入限制。
4. Node服务仅开放dist首页、白名单assets与健康检查；Docker多阶段构建。锁定依赖，生产访问不依赖外部CDN。
5. 测试聚合、零记录/小样本、标题行为、图表配置和资源服务；构建并检查实际图表。更新部署文档后发布main及v0.0.3标签。

实施验证：实际图表引擎测试发现并修正了point.cell不支持和连续图例回调格式错误；SVG和Canvas渲染均覆盖。真实Ant Design交互使用JSDOM验收；浏览器工具启动失败，未做浏览器视觉/鼠标悬停验收。测试进程使用test-force-exit清理JSDOM与组件调度器剩余句柄，所有断言完成后才退出。
